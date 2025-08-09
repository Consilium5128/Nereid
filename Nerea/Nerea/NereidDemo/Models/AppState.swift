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
    private var cancellables = Set<AnyCancellable>()
    private let engine = InferenceEngine()
    private let sensor = SensorManager()

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

struct Predictions {
    var nextPeriodStart: Date?
    var fertileWindow: ClosedRange<Date>?
    var probabilities: [ConditionProbability]

    struct ConditionProbability: Identifiable {
        var id = UUID()
        var condition: Condition
        var probability: Double // 0...1
        var actionable: Bool
    }

    enum Condition: String, CaseIterable, Identifiable {
        case pregnancy, menopauseTransition, pcos, anemia, pain, weightFluctuation, endometriosis
        var id: String { rawValue }
    }

    static let mock = Predictions(
        nextPeriodStart: Calendar.current.date(byAdding: .day, value: 15, to: Date()),
        fertileWindow: {
            let start = Calendar.current.date(byAdding: .day, value: 9, to: Date())!
            let end = Calendar.current.date(byAdding: .day, value: 14, to: Date())!
            return start...end
        }(),
        probabilities: [
            .init(condition: .pain, probability: 0.42, actionable: true),
            .init(condition: .anemia, probability: 0.18, actionable: true),
            .init(condition: .pcos, probability: 0.09, actionable: false),
            .init(condition: .pregnancy, probability: 0.06, actionable: true)
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
        // Extremely simplified heuristics for demo purposes.
        // In production, swap with a Bayesian model + personalization.
        let avgCycle = averageCycleLength(from: cycleStartDates) ?? 28
        let lastStart = cycleStartDates.sorted().last
        let nextStart = lastStart.flatMap { Calendar.current.date(byAdding: .day, value: avgCycle, to: $0) }

        let fertileStart = lastStart.flatMap { Calendar.current.date(byAdding: .day, value: 9, to: $0) }
        let fertileEnd = lastStart.flatMap { Calendar.current.date(byAdding: .day, value: 14, to: $0) }
        let fertile = (fertileStart != nil && fertileEnd != nil) ? (fertileStart!...fertileEnd!) : nil

        // Probabilities (toy): pain risk up if sleep low + steps low, anemia up if heavy flow recent, etc.
        let recent = logs.values.suffix(7)
        let heavyCount = recent.filter { $0.flow == .heavy }.count
        let painProb = clamp01(0.2 + (readings.sleepHours < 6.5 ? 0.15 : 0.0) + (readings.steps < 5000 ? 0.1 : 0.0))
        let anemiaProb = clamp01(0.05 + Double(heavyCount) * 0.06)
        let pcosProb = clamp01(0.03 + (avgCycle > 35 ? 0.12 : 0.0))
        let pregProb = clamp01(fertile != nil ? 0.06 : 0.02)

        return Predictions(
            nextPeriodStart: nextStart,
            fertileWindow: fertile,
            probabilities: [
                .init(condition: .pain, probability: painProb, actionable: true),
                .init(condition: .anemia, probability: anemiaProb, actionable: true),
                .init(condition: .pcos, probability: pcosProb, actionable: false),
                .init(condition: .pregnancy, probability: pregProb, actionable: true)
            ]
        )
    }

    private func averageCycleLength(from dates: [Date]) -> Int? {
        let sorted = dates.sorted()
        guard sorted.count >= 2 else { return nil }
        let diffs = zip(sorted.dropFirst(), sorted).map { Calendar.current.dateComponents([.day], from: $1, to: $0).day ?? 0 }
        let avg = diffs.reduce(0, +) / diffs.count
        return avg
    }

    private func clamp01(_ v: Double) -> Double { max(0, min(1, v)) }
}
