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
        self.latestReadings = sensor.latest.readings

        // Derive initial predictions
        recomputePredictions()

        // Subscribe to sensor updates (mocked)
        sensor.$latest
            .map { $0.readings }
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
                    if let newGoals = insights.goals {
                        self.goals = newGoals
                    }
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
                    // This would typically integrate with the notification system
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
        Task {
            do {
                let analysis = try await networkService.getAnalysis(userId: "USER_001")
                await MainActor.run {
                    self.aiAnalysis = analysis
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }
    
    func loadUIAdaptations() {
        Task {
            do {
                let adaptations = try await networkService.getUIAdaptations(userId: "USER_001")
                await MainActor.run {
                    self.uiAdaptations = adaptations
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }
    
    func loadPredictions() {
        Task {
            do {
                let predictions = try await networkService.getPredictions(userId: "USER_001")
                await MainActor.run {
                    // Update local predictions with AI predictions
                    if let nextPeriodString = predictions.next_period_start {
                        let formatter = ISO8601DateFormatter()
                        self.predictions.nextPeriodStart = formatter.date(from: nextPeriodString)
                    }
                    if let avgCycleLength = predictions.average_cycle_length {
                        // Note: averageCycleLength is not a property of Predictions, so we'll skip this
                    }
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }
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
        case .mood(let v): mood = v
        case .flow(let v): flow = v
        case .color(let v): color = v
        case .pain(let v): pain = v
        case .nutrition(let v): nutrition = v
        }
    }
}

enum LogEntry {
    case mood(Mood), flow(Flow), color(Coloration), pain(Pain), nutrition(Nutrition)
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

// MARK: - AI Data Models

struct AIAnalysis: Codable {
    let userId: String
    let insights: [String]
    let recommendations: [String]
    let goals: [HealthGoal]?
    let timestamp: String
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

struct Notification: Codable {
    let id: String
    let title: String
    let body: String
    let scheduledTime: String
    let repeat: String
    let category: String
}



struct Abnormality: Codable {
    let type: String
    let severity: String
    let description: String
    let actionable: Bool
}

struct UIAdaptation: Codable {
    let type: String
    let description: String
    let applied: Bool
}

struct Predictions {
    var nextPeriod: String
    var cycleLength: Int
    var confidence: Double
    var phases: [CyclePhase]
    
    static let mock = Predictions(
        nextPeriod: "2025-08-25",
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

struct SensorReadings {
    var restingHR: Int
    var temperatureC: Double
    var steps: Int
    var sleepHours: Double
    var screenTimeHours: Double
    var weatherC: Double

    static let stub = SensorReadings(restingHR: 64, temperatureC: 36.8, steps: 5200, sleepHours: 6.1, screenTimeHours: 3.4, weatherC: 28)
}

final class SensorManager: ObservableObject {
    @Published var latest: (timestamp: Date, readings: SensorReadings) = (
        Date(), SensorReadings.stub
    )
    private var timer: Timer?

    init() {
        // Mock: tick every 20 seconds to simulate new data
        timer = Timer.scheduledTimer(withTimeInterval: 20, repeats: true) { [weak self] _ in
            guard let self else { return }
            let jitter = Double.random(in: -0.3...0.3)
            let now = Date()
            self.latest = (now, SensorReadings(
                restingHR: Int.random(in: 58...72),
                temperatureC: 36.5 + jitter,
                steps: Int.random(in: 2000...12000),
                sleepHours: Double.random(in: 5.5...8.5),
                screenTimeHours: Double.random(in: 1.0...5.0),
                weatherC: Double.random(in: 10...34)
            ))
        }
    }
}

final class InferenceEngine {
    func inferPredictions(cycleStartDates: [Date], logs: [Date: DailyLog], readings: SensorReadings) -> Predictions {
        // Simplified heuristics for demo purposes
        let avgCycle = averageCycleLength(from: cycleStartDates) ?? 28
        let lastStart = cycleStartDates.sorted().last
        let nextStart = lastStart.flatMap { Calendar.current.date(byAdding: .day, value: avgCycle, to: $0) }
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let nextPeriodString = nextStart.map { dateFormatter.string(from: $0) } ?? "2025-08-25"
        
        // Generate phases based on cycle length
        let phases = generatePhases(cycleLength: avgCycle, startDate: lastStart ?? Date())
        
        return Predictions(
            nextPeriod: nextPeriodString,
            cycleLength: avgCycle,
            confidence: 0.85,
            phases: phases
        )
    }
    
    private func generatePhases(cycleLength: Int, startDate: Date) -> [CyclePhase] {
        let calendar = Calendar.current
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
        let menstrualDuration = 5
        let follicularDuration = Int(Double(cycleLength - menstrualDuration) * 0.6)
        let ovulatoryDuration = 3
        let lutealDuration = cycleLength - menstrualDuration - follicularDuration - ovulatoryDuration
        
        var phases: [CyclePhase] = []
        var currentDate = startDate
        
        // Menstrual phase
        let menstrualEnd = calendar.date(byAdding: .day, value: menstrualDuration - 1, to: currentDate)!
        phases.append(CyclePhase(
            name: "menstrual",
            startDate: dateFormatter.string(from: currentDate),
            endDate: dateFormatter.string(from: menstrualEnd),
            duration: menstrualDuration
        ))
        
        // Follicular phase
        currentDate = calendar.date(byAdding: .day, value: menstrualDuration, to: currentDate)!
        let follicularEnd = calendar.date(byAdding: .day, value: follicularDuration - 1, to: currentDate)!
        phases.append(CyclePhase(
            name: "follicular",
            startDate: dateFormatter.string(from: currentDate),
            endDate: dateFormatter.string(from: follicularEnd),
            duration: follicularDuration
        ))
        
        // Ovulatory phase
        currentDate = calendar.date(byAdding: .day, value: follicularDuration, to: currentDate)!
        let ovulatoryEnd = calendar.date(byAdding: .day, value: ovulatoryDuration - 1, to: currentDate)!
        phases.append(CyclePhase(
            name: "ovulatory",
            startDate: dateFormatter.string(from: currentDate),
            endDate: dateFormatter.string(from: ovulatoryEnd),
            duration: ovulatoryDuration
        ))
        
        // Luteal phase
        currentDate = calendar.date(byAdding: .day, value: ovulatoryDuration, to: currentDate)!
        let lutealEnd = calendar.date(byAdding: .day, value: lutealDuration - 1, to: currentDate)!
        phases.append(CyclePhase(
            name: "luteal",
            startDate: dateFormatter.string(from: currentDate),
            endDate: dateFormatter.string(from: lutealEnd),
            duration: lutealDuration
        ))
        
        return phases
    }

    private func averageCycleLength(from dates: [Date]) -> Int? {
        let sorted = dates.sorted()
        guard sorted.count >= 2 else { return nil }
        let diffs = zip(sorted.dropFirst(), sorted).map { Calendar.current.dateComponents([.day], from: $1, to: $0).day ?? 0 }
        let avg = diffs.reduce(0, +) / diffs.count
        return avg
    }

    private func clamp01(_ value: Double) -> Double {
        return max(0, min(1, value))
    }
}

// MARK: - Missing Data Models

struct DailyLog: Codable {
    var mood: String?
    var flow: String?
    var color: String?
    var pain: String?
    var nutrition: String?
    
    mutating func update(with entry: LogEntry) {
        switch entry {
        case .mood(let value):
            mood = value
        case .flow(let value):
            flow = value
        case .color(let value):
            color = value
        case .pain(let value):
            pain = value
        case .nutrition(let value):
            nutrition = value
        }
    }
}

struct LogEntry {
    enum EntryType {
        case mood(String)
        case flow(String)
        case color(String)
        case pain(String)
        case nutrition(String)
    }
    
    let type: EntryType
}

extension LogEntry {
    static func mood(_ value: String) -> LogEntry {
        LogEntry(type: .mood(value))
    }
    
    static func flow(_ value: String) -> LogEntry {
        LogEntry(type: .flow(value))
    }
    
    static func color(_ value: String) -> LogEntry {
        LogEntry(type: .color(value))
    }
    
    static func pain(_ value: String) -> LogEntry {
        LogEntry(type: .pain(value))
    }
    
    static func nutrition(_ value: String) -> LogEntry {
        LogEntry(type: .nutrition(value))
    }
}

struct CyclePhase: Codable {
    let name: String
    let startDate: String
    let endDate: String
    let duration: Int
}

// MARK: - Mock Data

struct DemoData {
    static func mockCycleStarts() -> [Date] {
        let calendar = Calendar.current
        let today = Date()
        return (0..<6).compactMap { i in
            calendar.date(byAdding: .month, value: -i, to: today)
        }
    }
    
    static func mockDailyLogs() -> [Date: DailyLog] {
        let calendar = Calendar.current
        let today = Date()
        var logs: [Date: DailyLog] = [:]
        
        for i in 0..<30 {
            if let date = calendar.date(byAdding: .day, value: -i, to: today) {
                logs[date] = DailyLog(
                    mood: ["Happy", "Calm", "Energetic", "Tired"].randomElement(),
                    flow: ["Light", "Medium", "Heavy"].randomElement(),
                    color: ["Red", "Pink", "Brown"].randomElement(),
                    pain: ["None", "Mild", "Moderate"].randomElement(),
                    nutrition: ["Good", "Fair", "Poor"].randomElement()
                )
            }
        }
        
        return logs
    }
}

// MARK: - Extensions

extension Date {
    func onlyDate() -> Date {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month, .day], from: self)
        return calendar.date(from: components) ?? self
    }
}
                 return avg
     }
}
