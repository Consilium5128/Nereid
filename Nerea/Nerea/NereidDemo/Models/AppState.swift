import Foundation
import Combine
#if canImport(HealthKit)
import HealthKit
#endif

final class AppState: ObservableObject {
    // Persistent-ish state
    @Published var hasCompletedOnboarding: Bool {
        didSet {
            UserDefaults.standard.set(hasCompletedOnboarding, forKey: "hasCompletedOnboarding")
        }
    }
    @Published var cycleStartDates: [Date] = []
    @Published var symptoms: [Date: DailyLog] = [:]  // keyed by stripped date
    @Published var goals: [Goal] = Goal.defaultGoals()
    @Published var predictions: Predictions = Predictions.mock
    @Published var latestReadings: SensorReadings = SensorReadings.stub
    @Published var aiAnalysis: AIAnalysis?
    @Published var uiAdaptations: [UIAdaptation] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    private var cancellables = Set<AnyCancellable>()
    private let engine = InferenceEngine()
    private let sensor = SensorManager()
    private let networkService = NetworkService()

    init() {
        self.hasCompletedOnboarding = UserDefaults.standard.bool(forKey: "hasCompletedOnboarding")
        // Load mock data for demo
        self.cycleStartDates = DemoData.mockCycleStarts()
        self.symptoms = DemoData.mockDailyLogs()
        self.latestReadings = sensor.latest

        // Derive initial predictions
        recomputePredictions()

        // Subscribe to sensor updates (mocked)
        sensor.$latest
            .receive(on: DispatchQueue.main)
            .sink { [weak self] readings in
                guard let self else { return }
                self.latestReadings = readings
                self.predictions = self.engine.inferPredictions(
                    cycleStartDates: self.cycleStartDates,
                    logs: self.symptoms,
                    readings: readings
                )
                // Light-touch goal nudges based on readings/logs
                self.goals = Goal.personalize(from: self.goals, logs: self.symptoms, readings: readings)
            }
            .store(in: &cancellables)
    }

    func toggleCycleStart(for date: Date) {
        let d = date.onlyDate()
        if let idx = cycleStartDates.firstIndex(where: { $0.onlyDate() == d }) {
            cycleStartDates.remove(at: idx)
        } else {
            cycleStartDates.append(d)
        }
        recomputePredictions()
    }

    func saveLog(_ log: LogEntry, for date: Date) {
        let key = date.onlyDate()
        var day = symptoms[key] ?? DailyLog()
        day.update(with: log)
        symptoms[key] = day
        recomputePredictions()
    }

    func recomputePredictions() {
        predictions = engine.inferPredictions(
            cycleStartDates: cycleStartDates,
            logs: symptoms,
            readings: latestReadings
        )
    }
    
    // MARK: - AI Integration Methods
    
    func triggerAIAnalysis() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                let analysis = try await networkService.triggerAnalysis(userId: "USER_001")
                await MainActor.run {
                    self.aiAnalysis = analysis
                    self.isLoading = false
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    self.isLoading = false
                }
            }
        }
    }
    
    func loadHealthAnalysis(userId: String = "P900") {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                let analysis = try await networkService.healthAnalysis(userId: userId)
                await MainActor.run {
                    self.aiAnalysis = analysis
                    self.isLoading = false
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    self.isLoading = false
                }
            }
        }
    }
    
    func loadCyclePredictions(userId: String = "P900", days: Int = 30) {
        Task {
            do {
                let predictions = try await networkService.cyclePredictions(userId: userId, days: days)
                await MainActor.run {
                    self.predictions = predictions
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }
    
    func loadHealthInsights(userId: String = "P900") {
        Task {
            do {
                let insights = try await networkService.healthInsights(userId: userId)
                await MainActor.run {
                    // Update goals based on insights
                    let newGoals = insights.goals
                    print("Loaded \(newGoals.count) health goals")
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }
    
    func adaptUIForUser(userId: String = "P900") {
        Task {
            do {
                let profile = try await networkService.healthProfile(userId: userId)
                let insights = try await networkService.healthInsights(userId: userId)
                let adaptations = try await networkService.adaptUI(userId: userId, profile: profile, insights: insights)
                
                await MainActor.run {
                    self.uiAdaptations = adaptations
                    print("Applied \(adaptations.count) UI adaptations for user \(userId)")
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }
    
    func loadPersonalizedNotifications(userId: String = "P900") {
        Task {
            do {
                let notifications = try await networkService.personalizedNotifications(userId: userId)
                await MainActor.run {
                    // Store notifications for display
                    print("Loaded \(notifications.count) personalized notifications")
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }
    
    func loadAIAnalysis() {
        loadHealthAnalysis()
        loadCyclePredictions()
        loadHealthInsights()
        adaptUIForUser()
        loadPersonalizedNotifications()
    }
}

// MARK: - Data Models

struct Goal: Identifiable, Codable {
    var id = UUID()
    var title: String
    var target: GoalTarget
    var current: Double
    var unit: String
    var enabled: Bool = true

    enum GoalTarget: Codable {
        case value(Double)
        case range(ClosedRange<Double>)
    }

    static func defaultGoals() -> [Goal] {
        [
            Goal(title: "Sleep", target: .range(7...9), current: 6.2, unit: "h"),
            Goal(title: "Water", target: .value(2000), current: 1400, unit: "ml"),
            Goal(title: "Steps", target: .value(8000), current: 5200, unit: ""),
            Goal(title: "Screen Time", target: .range(0...2.5), current: 3.8, unit: "h"),
            Goal(title: "Exercise", target: .value(30), current: 12, unit: "min")
        ]
    }

    static func personalize(from goals: [Goal], logs: [Date: DailyLog], readings: SensorReadings) -> [Goal] {
        // Nudge water and iron if flow=heavy or color=dark frequently, otherwise keep as-is
        var gs = goals
        let recent = logs.values.suffix(5)
        let heavyCount = recent.filter { $0.flow == .heavy || $0.color == .darkRed }.count
        if heavyCount >= 2 {
            if let idx = gs.firstIndex(where: { $0.title == "Water" }) {
                gs[idx].target = .value(2400)
            }
        }
        // Screen time nudge if sleep low + screen high
        if readings.sleepHours < 6 && readings.screenTimeHours > 3 {
            if let idx = gs.firstIndex(where: { $0.title == "Screen Time" }) {
                gs[idx].target = .range(0...2.0)
            }
        }
        return gs
    }
}

struct Predictions {
    var nextPeriodStart: Date?
    var cycleLength: Int = 28
    var confidence: Double = 0.85
    var phases: [CyclePhase] = []
    
    static let mock = Predictions(
        nextPeriodStart: Calendar.current.date(byAdding: .day, value: 7, to: Date()),
        cycleLength: 28,
        confidence: 0.85,
        phases: [
            CyclePhase(name: "menstrual", startDate: "2025-08-18", endDate: "2025-08-22", duration: 5),
            CyclePhase(name: "follicular", startDate: "2025-08-23", endDate: "2025-09-04", duration: 13),
            CyclePhase(name: "ovulatory", startDate: "2025-09-05", endDate: "2025-09-07", duration: 3),
            CyclePhase(name: "luteal", startDate: "2025-09-08", endDate: "2025-09-14", duration: 7)
        ]
    )
}

struct CyclePhase: Codable {
    let name: String
    let startDate: String
    let endDate: String
    let duration: Int
}

struct AIAnalysis: Codable {
    let userId: String
    let insights: [String]
    let recommendations: [String]
    let goals: [HealthGoal]?
    let timestamp: String
}

struct UIAdaptation: Codable {
    let type: String
    let description: String
    let applied: Bool
}

struct HealthGoal: Codable {
    let category: String
    let title: String
    let target: String
    let current: String
    let timeframe: String
    let actionable: Bool
    let progress: Int?
    let status: String?
}

struct HealthInsights: Codable {
    let userId: String
    let timestamp: String
    let cycleInsights: [CycleInsight]
    let healthInsights: [HealthInsight]
    let lifestyleInsights: [LifestyleInsight]
    let riskFactors: [RiskFactor]
    let goals: [HealthGoal]
    let notifications: [Notification]
}

struct CycleInsight: Codable {
    let type: String
    let title: String
    let message: String
    let priority: String
}

struct HealthInsight: Codable {
    let category: String
    let title: String
    let description: String
    let actionable: Bool
    let priority: String
}

struct LifestyleInsight: Codable {
    let category: String
    let title: String
    let description: String
    let actionable: Bool
    let priority: String
}

struct RiskFactor: Codable {
    let condition: String
    let riskLevel: String
    let factors: [String]
    let recommendations: [String]
}

struct Notification: Codable {
    let id: String
    let title: String
    let body: String
    let scheduledTime: String
    let `repeat`: String
    let category: String
}

struct Abnormality: Codable {
    let type: String
    let severity: String
    let description: String
    let actionable: Bool
}

struct DemoData {
    static func mockCycleStarts() -> [Date] {
        var dates: [Date] = []
        let today = Date()
        for offset in stride(from: -90, through: 0, by: 28) {
            if let d = Calendar.current.date(byAdding: .day, value: offset, to: today) {
                dates.append(d.onlyDate())
            }
        }
        return dates
    }
    static func mockDailyLogs() -> [Date: DailyLog] {
        var out: [Date: DailyLog] = [:]
        let today = Date()
        for delta in -10...0 {
            if let d = Calendar.current.date(byAdding: .day, value: delta, to: today)?.onlyDate() {
                var log = DailyLog()
                if delta % 2 == 0 { log.mood = .calm }
                if delta % 3 == 0 { log.flow = .light }
                if delta % 5 == 0 { log.pain = .crampy }
                out[d] = log
            }
        }
        return out
    }
}

extension Date {
    func onlyDate() -> Date {
        Calendar.current.startOfDay(for: self)
    }
}

typealias DailyLog = LogBundle

struct LogBundle: Codable {
    var mood: Mood? = nil
    var flow: Flow? = nil
    var color: Coloration? = nil
    var pain: Pain? = nil
    var nutrition: Nutrition? = nil

    mutating func update(with entry: LogEntry) {
        switch entry {
        case .mood(let v): mood = Mood(rawValue: v)
        case .flow(let v): flow = Flow(rawValue: v)
        case .color(let v): color = Coloration(rawValue: v)
        case .pain(let v): pain = Pain(rawValue: v)
        case .nutrition(let v): nutrition = Nutrition(rawValue: v)
        }
    }
}

enum LogEntry {
    case mood(String)
    case flow(String)
    case color(String)
    case pain(String)
    case nutrition(String)
}

enum Mood: String, CaseIterable, Identifiable, Codable {
    case calm, happy, low, irritable, anxious
    var id: String { rawValue }
}

enum Flow: String, CaseIterable, Identifiable, Codable {
    case spotting, light, medium, heavy
    var id: String { rawValue }
}

enum Coloration: String, CaseIterable, Identifiable, Codable {
    case brightRed, darkRed, brown, pink
    var id: String { rawValue }
}

enum Pain: String, CaseIterable, Identifiable, Codable {
    case none, crampy, backache, headache, pelvic
    var id: String { rawValue }
}

enum Nutrition: String, CaseIterable, Identifiable, Codable {
    case balanced, ironRich, lowAppetite, highCarb, highProtein
    var id: String { rawValue }
}

struct SensorReadings {
    var steps: Int = 0
    var sleepHours: Double = 7.0
    var screenTimeHours: Double = 2.0
    var temperatureC: Double = 36.6
    
    static let stub = SensorReadings()
}

class SensorManager: ObservableObject {
    @Published var latest = SensorReadings()
}

class InferenceEngine {
    func inferPredictions(cycleStartDates: [Date], logs: [Date: DailyLog], readings: SensorReadings) -> Predictions {
        // Simple prediction logic
        let avgCycleLength = 28
        let lastStart = cycleStartDates.last ?? Date()
        let nextStart = Calendar.current.date(byAdding: .day, value: avgCycleLength, to: lastStart) ?? Date()
        
        var phases: [CyclePhase] = []
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        
        // Generate phases
        phases.append(CyclePhase(
            name: "menstrual",
            startDate: formatter.string(from: nextStart),
            endDate: formatter.string(from: Calendar.current.date(byAdding: .day, value: 4, to: nextStart) ?? nextStart),
            duration: 5
        ))
        
        phases.append(CyclePhase(
            name: "follicular",
            startDate: formatter.string(from: Calendar.current.date(byAdding: .day, value: 5, to: nextStart) ?? nextStart),
            endDate: formatter.string(from: Calendar.current.date(byAdding: .day, value: 17, to: nextStart) ?? nextStart),
            duration: 13
        ))
        
        phases.append(CyclePhase(
            name: "ovulatory",
            startDate: formatter.string(from: Calendar.current.date(byAdding: .day, value: 18, to: nextStart) ?? nextStart),
            endDate: formatter.string(from: Calendar.current.date(byAdding: .day, value: 20, to: nextStart) ?? nextStart),
            duration: 3
        ))
        
        phases.append(CyclePhase(
            name: "luteal",
            startDate: formatter.string(from: Calendar.current.date(byAdding: .day, value: 21, to: nextStart) ?? nextStart),
            endDate: formatter.string(from: Calendar.current.date(byAdding: .day, value: 27, to: nextStart) ?? nextStart),
            duration: 7
        ))
        
        return Predictions(
            nextPeriodStart: nextStart,
            cycleLength: avgCycleLength,
            confidence: 0.85,
            phases: phases
        )
    }
}

