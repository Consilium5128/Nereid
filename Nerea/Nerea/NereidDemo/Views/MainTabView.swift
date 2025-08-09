import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            HomeDashboardView()
                .tabItem { Label("Home", systemImage: "calendar") }
            PredictionsView()
                .tabItem { Label("Insights", systemImage: "sparkles") }
            GoalsView()
                .tabItem { Label("Goals", systemImage: "target") }
            AgentView()
                .tabItem { Label("Agent", systemImage: "aqi.medium") }
        }
        .tint(Color.accentSea)
    }
}
