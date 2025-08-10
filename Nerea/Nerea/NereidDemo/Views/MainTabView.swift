import SwiftUI

// Local pearlescent palette (kept light/minimal)
fileprivate extension Color {
    static let pearlWhite = Color.white
    static let pearlLilac = Color(red: 0.75, green: 0.70, blue: 0.90)
    static let pearlFoam  = Color(red: 0.83, green: 0.93, blue: 0.99)
    static let pearlSea   = Color(red: 0.13, green: 0.45, blue: 0.58)
    static let pearlBlush = Color(red: 0.90, green: 0.70, blue: 0.85) // soft pink
    static let pearlSky   = Color(red: 0.65, green: 0.75, blue: 0.90) // airy blue
    static let pearlViolet = Color(red: 0.73, green: 0.62, blue: 0.98) // soft Gen‑Z purple
    static let pearlPeach  = Color(red: 1.00, green: 0.86, blue: 0.70) // pastel peach
    static let pearlSun    = Color(red: 1.00, green: 0.96, blue: 0.74) // light lemon
}
    
    
    struct MainTabView: View {
        init() {
            // Translucent, light tab bar (no grey).
            let appearance = UITabBarAppearance()
            appearance.configureWithTransparentBackground()
            appearance.backgroundColor = UIColor(white: 1.0, alpha: 0.10) // subtle white veil
            UITabBar.appearance().standardAppearance = appearance
            UITabBar.appearance().scrollEdgeAppearance = appearance
        }
        
        var body: some View {
            ZStack {
                // Pearl background behind the whole tab interface
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
                .overlay(
                    AngularGradient(gradient: Gradient(colors: [
                        Color.pearlWhite.opacity(0.28),
                        Color.pearlLilac.opacity(0.22),
                        Color.pearlSky.opacity(0.2),
                        Color.pearlBlush.opacity(0.18),
                        Color.pearlViolet.opacity(0.18),
                        Color.pearlPeach.opacity(0.16),
                        Color.pearlSun.opacity(0.16),
                        Color.pearlWhite.opacity(0.20)
                    ]), center: .center)
                    .blur(radius: 28)
                    .blendMode(.softLight)
                )
                
                TabView {
                    HomeDashboardView()
                        .tabItem { Label("Home", systemImage: "calendar") }
                    
                    AIInsightsView()
                        .tabItem { Label("AI Insights", systemImage: "brain.head.profile") }
                    
                    PredictionsView()
                        .tabItem { Label("Predictions", systemImage: "sparkles") }
                    
                    GoalsView()
                        .tabItem { Label("Goals", systemImage: "target") }
                    
                }
                .background(Color.clear)
                .tint(Color.pearlViolet) // use theme tint
            }
        }
    }

