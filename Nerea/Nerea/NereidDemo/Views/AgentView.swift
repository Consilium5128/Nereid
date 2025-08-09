import SwiftUI

struct AgentView: View {
    var body: some View {
        ZStack {
            LinearGradient(colors: [
                Color(red: 0.80, green: 0.92, blue: 0.98).opacity(0.25),
                Color(red: 0.70, green: 0.88, blue: 0.85).opacity(0.25)
            ], startPoint: .topLeading, endPoint: .bottomTrailing)
            .ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .fill(.ultraThinMaterial)
                        .overlay(
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Today’s suggestions").font(.headline)
                                Label("Short walk after lunch", systemImage: "figure.walk.motion")
                                Label("Warm compress before bed", systemImage: "flame")
                                Label("Blue-light wind-down tonight", systemImage: "moon.zzz.fill")
                            }
                            .padding(16)
                        )
                        .overlay(RoundedRectangle(cornerRadius: 24).stroke(.white.opacity(0.3)))
                }
                .padding(16)
            }
        }
        .navigationTitle("Agent")
    }
}
