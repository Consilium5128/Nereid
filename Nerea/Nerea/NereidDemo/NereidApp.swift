import SwiftUI

@main
struct NereidApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
                .preferredColorScheme(.light)
        }
    }
}

struct RootView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        Group {
            if appState.hasCompletedOnboarding {
                MainTabView()
            } else {
                OnboardingView()
            }
        }
        .animation(.easeInOut, value: appState.hasCompletedOnboarding)
    }
}
