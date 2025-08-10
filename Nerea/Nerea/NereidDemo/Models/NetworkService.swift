import Foundation
import Combine

// MARK: - Network Service
class NetworkService: ObservableObject {
    private let baseURL = "http://localhost:3000"
    private let session = URLSession.shared
    
    // MARK: - User Management
    func createUser(_ user: UserProfile) async throws -> UserResponse {
        let url = URL(string: "\(baseURL)/users")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(user)
        
        let (data, _) = try await session.data(for: request)
        return try JSONDecoder().decode(UserResponse.self, from: data)
    }
    
    func getUser(userId: String) async throws -> UserProfile {
        let url = URL(string: "\(baseURL)/users/\(userId)")!
        let (data, _) = try await session.data(from: url)
        return try JSONDecoder().decode(UserProfile.self, from: data)
    }
    
    // MARK: - Sensor Data
    func sendSensorReading(_ reading: SensorReading) async throws -> SensorResponse {
        let url = URL(string: "\(baseURL)/sensors")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(reading)
        
        let (data, _) = try await session.data(for: request)
        return try JSONDecoder().decode(SensorResponse.self, from: data)
    }
    
    func getSensorReadings(userId: String) async throws -> [SensorReading] {
        let url = URL(string: "\(baseURL)/sensors/\(userId)")!
        let (data, _) = try await session.data(from: url)
        return try JSONDecoder().decode([SensorReading].self, from: data)
    }
    
    // MARK: - User Logs
    func sendUserLog(_ log: UserLog) async throws -> LogResponse {
        let url = URL(string: "\(baseURL)/logs")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(log)
        
        let (data, _) = try await session.data(for: request)
        return try JSONDecoder().decode(LogResponse.self, from: data)
    }
    
    func getUserLogs(userId: String) async throws -> [UserLog] {
        let url = URL(string: "\(baseURL)/logs/\(userId)")!
        let (data, _) = try await session.data(from: url)
        return try JSONDecoder().decode([UserLog].self, from: data)
    }
    
    // MARK: - Cycle Events
    func sendCycleEvent(_ event: CycleEvent) async throws -> CycleResponse {
        let url = URL(string: "\(baseURL)/cycles")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(event)
        
        let (data, _) = try await session.data(for: request)
        return try JSONDecoder().decode(CycleResponse.self, from: data)
    }
    
    func getCycleEvents(userId: String) async throws -> [CycleEvent] {
        let url = URL(string: "\(baseURL)/cycles/\(userId)")!
        let (data, _) = try await session.data(from: url)
        return try JSONDecoder().decode([CycleEvent].self, from: data)
    }
    
    // MARK: - AI Analysis
    func triggerAnalysis(userId: String) async throws -> AIAnalysis {
        let url = URL(string: "\(baseURL)/analyze/\(userId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        let (data, _) = try await session.data(for: request)
        return try JSONDecoder().decode(AIAnalysis.self, from: data)
    }
    
    func getAnalysis(userId: String) async throws -> AIAnalysis {
        let url = URL(string: "\(baseURL)/analysis/\(userId)")!
        let (data, _) = try await session.data(from: url)
        return try JSONDecoder().decode(AIAnalysis.self, from: data)
    }
    
    // MARK: - Predictions
    func getPredictions(userId: String) async throws -> CyclePredictions {
        let url = URL(string: "\(baseURL)/predictions/\(userId)")!
        let (data, _) = try await session.data(from: url)
        return try JSONDecoder().decode(CyclePredictions.self, from: data)
    }
    
    // MARK: - UI Adaptations
    func getUIAdaptations(userId: String) async throws -> [UIAdaptation] {
        let url = URL(string: "\(baseURL)/ui-adaptations/\(userId)")!
        let (data, _) = try await session.data(from: url)
        return try JSONDecoder().decode([UIAdaptation].self, from: data)
    }
    
    // MARK: - Health Analysis Methods
    
    func healthAnalysis(userId: String) async throws -> AIAnalysis {
        let url = URL(string: "\(baseURL)/api/health/analyze/\(userId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        let (data, _) = try await session.data(for: request)
        let response = try JSONDecoder().decode(HealthAnalysisResponse.self, from: data)
        return AIAnalysis(
            userId: response.profile.userId,
            insights: response.healthInsights.cycleInsights.map { $0.message },
            recommendations: response.healthInsights.healthInsights.map { $0.description },
            goals: response.healthInsights.goals,
            timestamp: response.healthInsights.timestamp
        )
    }
    
    func healthProfile(userId: String) async throws -> HealthProfile {
        let url = URL(string: "\(baseURL)/api/health/profile/\(userId)")!
        let (data, _) = try await session.data(from: url)
        let response = try JSONDecoder().decode(HealthProfileResponse.self, from: data)
        return response.profile
    }
    
    func cyclePredictions(userId: String, days: Int = 30) async throws -> Predictions {
        let url = URL(string: "\(baseURL)/api/health/predictions/\(userId)?days=\(days)")!
        let (data, _) = try await session.data(from: url)
        let response = try JSONDecoder().decode(CyclePredictionsResponse.self, from: data)
        
        // Convert predictions to Predictions format
        let formatter = ISO8601DateFormatter()
        let nextPeriodStart = formatter.date(from: response.predictions.first?.startDate ?? "") ?? Date()
        
        return Predictions(
            nextPeriodStart: nextPeriodStart,
            cycleLength: response.predictions.first?.length ?? 28,
            confidence: response.predictions.first?.confidence ?? 0.75,
            phases: response.predictions.first?.phases.map { phase in
                CyclePhase(
                    name: phase.name,
                    startDate: phase.startDate,
                    endDate: phase.endDate,
                    duration: phase.duration
                )
            } ?? []
        )
    }
    
    func healthInsights(userId: String) async throws -> HealthInsights {
        let url = URL(string: "\(baseURL)/api/health/insights/\(userId)")!
        let (data, _) = try await session.data(from: url)
        let response = try JSONDecoder().decode(HealthInsightsResponse.self, from: data)
        return response.insights
    }
    
    // MARK: - UI Adaptation Methods
    
    func adaptUI(userId: String, profile: HealthProfile, insights: HealthInsights) async throws -> [UIAdaptation] {
        let url = URL(string: "\(baseURL)/api/ui/adapt/\(userId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = UIAdaptationRequest(userProfile: profile, healthInsights: insights)
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, _) = try await session.data(for: request)
        let response = try JSONDecoder().decode(UIAdaptationResponse.self, from: data)
        return response.adaptations.adaptations.compactMap { adaptation in
            guard adaptation.success else { return nil }
            return UIAdaptation(
                type: adaptation.changes.first?.type ?? "unknown",
                description: adaptation.changes.first?.description ?? "",
                applied: adaptation.success
            )
        }
    }
    
    func personalizedNotifications(userId: String) async throws -> [Notification] {
        let url = URL(string: "\(baseURL)/api/ui/notifications/\(userId)")!
        let (data, _) = try await session.data(from: url)
        let response = try JSONDecoder().decode(NotificationsResponse.self, from: data)
        return response.notifications
    }
}

// MARK: - Data Models

struct UserProfile: Codable {
    let id: String
    let name: String
    let age: Int
    let cycle_length: Int
    let typical_period_length: Int
}

struct SensorReading: Codable {
    let id: Int
    let user_id: String
    let source: String
    let payload: [String: Any]
    let timestamp: String
    let created_at: String
    
    enum CodingKeys: String, CodingKey {
        case id, user_id, source, payload, timestamp, created_at
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(Int.self, forKey: .id)
        user_id = try container.decode(String.self, forKey: .user_id)
        source = try container.decode(String.self, forKey: .source)
        timestamp = try container.decode(String.self, forKey: .timestamp)
        created_at = try container.decode(String.self, forKey: .created_at)
        
        // Handle payload as JSON object
        if let payloadData = try? container.decode(Data.self, forKey: .payload) {
            payload = (try? JSONSerialization.jsonObject(with: payloadData) as? [String: Any]) ?? [:]
        } else {
            payload = [:]
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(user_id, forKey: .user_id)
        try container.encode(source, forKey: .source)
        try container.encode(timestamp, forKey: .timestamp)
        try container.encode(created_at, forKey: .created_at)
        
        // Encode payload as JSON data
        let payloadData = try JSONSerialization.data(withJSONObject: payload)
        try container.encode(payloadData, forKey: .payload)
    }
}

struct UserLog: Codable {
    let user_id: String
    let log_date: String
    let mood: String?
    let flow: String?
    let color: String?
    let pain: String?
    let nutrition: String?
}

struct CycleEvent: Codable {
    let id: Int
    let user_id: String
    let event_type: String
    let event_date: String
    let created_at: String
}

struct CyclePredictions: Codable {
    let next_period_start: String?
    let average_cycle_length: Int?
    let current_phase: String?
    let day_of_cycle: Int?
}

// MARK: - Response Models

struct UserResponse: Codable {
    let user: UserProfile
}

struct SensorResponse: Codable {
    let success: Bool
    let reading: SensorReading
}

struct LogResponse: Codable {
    let success: Bool
    let log: UserLog
}

struct CycleResponse: Codable {
    let success: Bool
    let event: CycleEvent
}

// MARK: - Health Analysis Response Models

struct HealthAnalysisResponse: Codable {
    let success: Bool
    let profile: HealthProfile
    let cyclePredictions: [CyclePrediction]
    let healthInsights: HealthInsights
}

struct HealthProfileResponse: Codable {
    let success: Bool
    let profile: HealthProfile
}

struct CyclePredictionsResponse: Codable {
    let success: Bool
    let predictions: [CyclePrediction]
}

struct HealthInsightsResponse: Codable {
    let success: Bool
    let insights: HealthInsights
}

struct UIAdaptationResponse: Codable {
    let success: Bool
    let adaptations: UIAdaptationResult
}

struct NotificationsResponse: Codable {
    let success: Bool
    let notifications: [Notification]
}

// MARK: - Health Analysis Data Models

struct HealthProfile: Codable {
    let userId: String
    let age: Int
    let conditions: HealthConditions
    let preferences: UserPreferences
    let cyclePattern: CyclePattern
    let healthMetrics: HealthMetrics
    let lifestyleFactors: LifestyleFactors
}

struct HealthConditions: Codable {
    let pcos: Bool
    let endometriosis: Bool
    let irregularPeriods: Bool
    let weightGain: Bool
    let insulinResistance: Bool
    let ovarianCysts: Bool
    let hairThinning: Bool
    let heavyBleeding: Bool
    let infertility: Bool
    let giIssues: Bool
}

struct UserPreferences: Codable {
    let journalingMode: String
    let goalFocus: String
    let coachingStyle: String
}

struct CyclePattern: Codable {
    let averageCycleLength: Int
    let averageFlowDuration: Int
    let regularity: String
    let phases: [String: PhaseData]
}

struct PhaseData: Codable {
    let count: Int
    let averageSymptoms: [String: Any]
    
    enum CodingKeys: String, CodingKey {
        case count, averageSymptoms
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        count = try container.decode(Int.self, forKey: .count)
        averageSymptoms = [:] // Simplified for now
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(count, forKey: .count)
        // Encode averageSymptoms as JSON data
        let symptomsData = try JSONSerialization.data(withJSONObject: averageSymptoms)
        try container.encode(symptomsData, forKey: .averageSymptoms)
    }
}

struct HealthMetrics: Codable {
    let hrv: HRVMetrics
    let sleep: SleepMetrics
    let bbt: BBTMetrics
    let activity: ActivityMetrics
    let symptoms: SymptomMetrics
}

struct HRVMetrics: Codable {
    let average: Int
    let trend: String
    let optimalRange: [Int]
}

struct SleepMetrics: Codable {
    let averageHours: Double
    let deepSleepPercentage: Int
    let quality: String
}

struct BBTMetrics: Codable {
    let average: Double
    let follicular: Double
    let luteal: Double
}

struct ActivityMetrics: Codable {
    let averageSteps: Int
    let averageActiveMinutes: Int
}

struct SymptomMetrics: Codable {
    let cramps: SymptomData
    let bodyPain: SymptomData
    let backPain: SymptomData
    let mood: MoodData
}

struct SymptomData: Codable {
    let average: Double
    let severity: String
}

struct MoodData: Codable {
    let average: Double
    let trend: String
}

struct LifestyleFactors: Codable {
    let caffeine: CaffeineData
    let stress: StressData
    let environment: EnvironmentData
    let travel: TravelData
}

struct CaffeineData: Codable {
    let average: Double
    let impact: String
}

struct StressData: Codable {
    let averageBusyScore: Int
    let meetingsPerDay: Double
    let stressLevel: String
}

struct EnvironmentData: Codable {
    let averageLightMinutes: Int
    let sunnyDays: Int
    let averageUVIndex: Double
    let averageTemperature: Double
    let averageAQI: Int
    let averagePollenCount: Int
}

struct TravelData: Codable {
    let flightDays: Int
    let averageJetLag: Double
}

struct CyclePrediction: Codable {
    let startDate: String
    let endDate: String
    let length: Int
    let phases: [PhasePrediction]
    let confidence: Double
}

struct PhasePrediction: Codable {
    let name: String
    let startDate: String
    let endDate: String
    let duration: Int
}



struct UIAdaptationResult: Codable {
    let userId: String
    let timestamp: String
    let adaptations: [UIAdaptationDetail]
}

struct UIAdaptationDetail: Codable {
    let file: String
    let changes: [UIChange]
    let success: Bool
    let error: String?
}

struct UIChange: Codable {
    let type: String
    let description: String
    let success: Bool
    let error: String?
}

struct UIAdaptationRequest: Codable {
    let userProfile: HealthProfile
    let healthInsights: HealthInsights
}
