import SwiftUI

// Local pearlescent palette
fileprivate extension Color {
    static let pearlWhite = Color.white
    static let pearlLilac = Color(red: 0.75, green: 0.70, blue: 0.90)
    static let pearlFoam  = Color(red: 0.83, green: 0.93, blue: 0.99)
    static let pearlSea   = Color(red: 0.13, green: 0.45, blue: 0.58)
    static let pearlBlush = Color(red: 0.90, green: 0.70, blue: 0.85)
    static let pearlSky   = Color(red: 0.65, green: 0.75, blue: 0.90)
    static let pearlViolet = Color(red: 0.73, green: 0.62, blue: 0.98)
    static let pearlPeach  = Color(red: 1.00, green: 0.86, blue: 0.70)
    static let pearlSun    = Color(red: 1.00, green: 0.96, blue: 0.74)
}

struct AIInsightsView: View {
    @EnvironmentObject var app: AppState
    
    var body: some View {
        NavigationView {
            ZStack {
                // Pearl background
                LinearGradient(colors: [
                    Color.pearlWhite.opacity(0.4),
                    Color.pearlLilac.opacity(0.35),
                    Color.pearlSky.opacity(0.3),
                    Color.pearlBlush.opacity(0.28),
                    Color.pearlViolet.opacity(0.26),
                    Color.pearlPeach.opacity(0.24),
                    Color.pearlSun.opacity(0.22)
                ], startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()
                
                ScrollView {
                    LazyVStack(spacing: 16) {
                        // AI Message
                        if let analysis = app.aiAnalysis {
                            Card {
                                VStack(alignment: .leading, spacing: 12) {
                                    HStack {
                                        Image(systemName: "brain.head.profile")
                                            .foregroundStyle(Color.pearlViolet)
                                        Text("AI Insights")
                                            .font(.headline)
                                        Spacer()
                                        Button("Refresh") {
                                            app.triggerAIAnalysis()
                                        }
                                        .buttonStyle(WaterCapsule())
                                    }
                                    
                                    Text(analysis.insights.first ?? "No insights available")
                                        .font(.body)
                                        .foregroundStyle(.primary)
                                }
                            }
                            
                            // Plan Recommendations
                            if !analysis.recommendations.isEmpty {
                                PlanRecommendationsView(plan: ["recommendations": analysis.recommendations])
                            }
                            
                            // Health Alerts
                            if !analysis.insights.isEmpty {
                                HealthAlertsView(abnormalities: [])
                            }
                            
                            // Risk Assessment
                            RiskAssessmentView(riskLevel: 0.3, uncertainty: 0.2, summary: "Low risk based on current data")
                        }
                        
                        // UI Adaptations
                        if !app.uiAdaptations.isEmpty {
                            UIAdaptationsView(adaptations: app.uiAdaptations)
                        }
                        
                        // Manual Trigger Button
                        Card {
                            Button("Get AI Analysis") {
                                app.triggerAIAnalysis()
                            }
                            .buttonStyle(WaterCapsule())
                            .frame(maxWidth: .infinity)
                        }
                    }
                    .padding(16)
                }
            }
            .navigationTitle("AI Insights")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}

struct PlanRecommendationsView: View {
    let plan: [String: Any]
    
    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 12) {
                Text("Today's Plan")
                    .font(.headline)
                
                if let track = plan["track"] as? [String] {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Track")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundStyle(Color.pearlViolet)
                        
                        ForEach(track, id: \.self) { item in
                            HStack {
                                Image(systemName: "checkmark.circle")
                                    .foregroundStyle(.green)
                                Text(item)
                                    .font(.subheadline)
                                Spacer()
                            }
                        }
                    }
                }
                
                if let maintain = plan["maintain"] as? [String] {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Maintain")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundStyle(Color.pearlViolet)
                        
                        ForEach(maintain, id: \.self) { item in
                            HStack {
                                Image(systemName: "heart.fill")
                                    .foregroundStyle(.red)
                                Text(item)
                                    .font(.subheadline)
                                Spacer()
                            }
                        }
                    }
                }
            }
        }
    }
}

struct HealthAlertsView: View {
    let abnormalities: [Abnormality]
    
    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundStyle(.orange)
                    Text("Health Alerts")
                        .font(.headline)
                }
                
                ForEach(Array(abnormalities.enumerated()), id: \.offset) { index, abnormality in
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(abnormality.type.replacingOccurrences(of: "_", with: " ").capitalized)
                                .font(.subheadline)
                                .fontWeight(.semibold)
                            
                            Spacer()
                            
                            Text(abnormality.severity.capitalized)
                                .font(.caption)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(severityColor(abnormality.severity))
                                .foregroundStyle(.white)
                                .clipShape(Capsule())
                        }
                        
                        Text(abnormality.description)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        
                        if abnormality.actionable {
                            Text("Action recommended")
                                .font(.caption)
                                .foregroundStyle(Color.pearlViolet)
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
        }
    }
    
    private func severityColor(_ severity: String) -> Color {
        switch severity.lowercased() {
        case "high":
            return .red
        case "moderate":
            return .orange
        case "low":
            return .yellow
        default:
            return .gray
        }
    }
}

struct RiskAssessmentView: View {
    let riskLevel: Double
    let uncertainty: Double
    let summary: String
    
    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 12) {
                Text("Risk Assessment")
                    .font(.headline)
                
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Risk Level")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Text("\(Int(riskLevel * 100))%")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundStyle(riskColor(riskLevel))
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .trailing, spacing: 4) {
                        Text("Uncertainty")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Text("\(Int(uncertainty * 100))%")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundStyle(.orange)
                    }
                }
                
                Text(summary)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
    }
    
    private func riskColor(_ risk: Double) -> Color {
        if risk > 0.7 {
            return .red
        } else if risk > 0.4 {
            return .orange
        } else {
            return .green
        }
    }
}

struct UIAdaptationsView: View {
    let adaptations: [UIAdaptation]
    
    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Image(systemName: "paintbrush.fill")
                        .foregroundStyle(Color.pearlViolet)
                    Text("UI Adaptations")
                        .font(.headline)
                }
                
                ForEach(adaptations, id: \.type) { adaptation in
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(adaptation.type.replacingOccurrences(of: "_", with: " ").capitalized)
                                .font(.subheadline)
                                .fontWeight(.semibold)
                            
                            Spacer()
                            
                            Text(adaptation.applied ? "Applied" : "Pending")
                                .font(.caption)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(adaptation.applied ? Color.green : Color.orange)
                                .foregroundStyle(.white)
                                .clipShape(Capsule())
                        }
                        
                        Text(adaptation.description)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 4)
                }
            }
        }
    }
    

}

#Preview {
    AIInsightsView()
        .environmentObject(AppState())
}
