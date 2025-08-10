import SwiftUI

// Local pearlescent palette (kept light/minimal)
fileprivate extension Color {
    static let pearlLilac = Color(red: 0.75, green: 0.70, blue: 0.90)
    static let pearlFoam  = Color(red: 0.83, green: 0.93, blue: 0.99)
    static let pearlSea   = Color(red: 0.13, green: 0.45, blue: 0.58)
    static let pearlBlush = Color(red: 0.90, green: 0.70, blue: 0.85) // soft pink
    static let pearlSky   = Color(red: 0.65, green: 0.75, blue: 0.90) // airy blue
    static let pearlViolet = Color(red: 0.73, green: 0.62, blue: 0.98) // soft Gen‑Z purple
    static let pearlPeach  = Color(red: 1.00, green: 0.86, blue: 0.70) // pastel peach
    static let pearlSun    = Color(red: 1.00, green: 0.96, blue: 0.74) // light lemon
}

struct GoalsView: View {
    @EnvironmentObject var app: AppState

    var body: some View {
        NavigationStack {
            ZStack {
                // Mother‑of‑pearl background (more intrigue, still calm)
                LinearGradient(
                    colors: [
                        .white.opacity(0.42),
                        Color.pearlViolet.opacity(0.26),
                        Color.pearlPeach.opacity(0.22),
                        Color.pearlSun.opacity(0.20)
                    ],
                    startPoint: .topLeading, endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                .overlay(
                    AngularGradient(
                        gradient: Gradient(colors: [
                            .white.opacity(0.28),
                            Color.pearlViolet.opacity(0.18),
                            Color.pearlPeach.opacity(0.16),
                            Color.pearlSun.opacity(0.16),
                            .white.opacity(0.20)
                        ]),
                        center: .center
                    )
                    .blur(radius: 28)
                    .blendMode(.softLight)
                )
                

                VStack(spacing: 16) {
                    // Title matching onboarding style replaced with pearl logo image
                    Image("pearl_logo")
                        .resizable()
                        .scaledToFit()
                        .frame(height: 40)
                        .padding(.top, 8)

                    // Two goals – elevated, iconic, easy to scan
                    PearlCard {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack(spacing: 8) {
                                Image(systemName: "target")
                                Text("Your goals")
                            }
                            .font(.headline)

                            HStack(spacing: 12) {
                                ForEach(Array(app.goals.prefix(2))) { goal in
                                    IconGoalCard(goal: goal)
                                }
                            }
                        }
                    }

                    // Three gentle “what to do now” actions with softer blue/purple/pink icons
                    PearlCard {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack(spacing: 8) {
                                Image(systemName: "sparkles")
                                Text("What to do now")
                            }
                            .font(.headline)

                            VStack(spacing: 12) {
                                ActionRow(icon: "bed.double.fill", title: "Wind‑down 10:30")
                                ActionRow(icon: "drop.fill", title: "Sip water hourly")
                                ActionRow(icon: "figure.walk", title: "Post‑lunch walk")
                            }
                        }
                    }

                    Spacer(minLength: 0)
                }
                .padding(16)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            }
            .navigationTitle("Goals")
        }
    }
}

// MARK: - Iconic goal tile with progress ring
struct IconGoalCard: View {
    var goal: Goal

    private var iconName: String {
        // light mapping by title keywords
        let t = goal.title.lowercased()
        if t.contains("water") { return "drop.fill" }
        if t.contains("sleep") { return "bed.double.fill" }
        if t.contains("step") || t.contains("walk") { return "figure.walk" }
        if t.contains("screen") { return "iphone" }
        if t.contains("pain") { return "cross.case.fill" }
        return "target"
    }

    private var progress: Double {
        // Calculate progress based on current vs target
        switch goal.target {
        case .value(let target):
            return min(goal.current / target, 1.0)
        case .range(let range):
            let normalized = (goal.current - range.lowerBound) / (range.upperBound - range.lowerBound)
            return max(0, min(normalized, 1.0))
        }
    }

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .stroke(
                        LinearGradient(colors: [.white, Color.pearlViolet.opacity(0.30)], startPoint: .top, endPoint: .bottom),
                        lineWidth: 10
                    )
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(
                        LinearGradient(colors: [Color.pearlViolet.opacity(0.95), Color.pearlPeach.opacity(0.95), Color.pearlSun.opacity(0.95)], startPoint: .top, endPoint: .bottom),
                        style: StrokeStyle(lineWidth: 10, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                Image(systemName: iconName)
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(Color.pearlSea)
            }
            .frame(width: 72, height: 72)
            .background(.thinMaterial, in: Circle())
            .overlay(
                Circle().stroke(
                    LinearGradient(colors: [.white, Color.pearlFoam.opacity(0.20)], startPoint: .top, endPoint: .bottom),
                    lineWidth: 1
                )
            )

            Text(goal.title)
                .font(.subheadline.weight(.semibold))
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .frame(maxWidth: 110)
            Text(progressSubtitle)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.black)
        }
        .frame(maxWidth: 130)
    }

    private var progressSubtitle: String {
        let progressPercent = Int(progress * 100)
        return "\(progressPercent)%"
    }
}

// MARK: - Compact action chips
struct ActionBadge: View {
    var icon: String
    var title: String
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
            Text(title)
        }
        .font(.footnote.weight(.semibold))
        .padding(.vertical, 10).padding(.horizontal, 12)
        .background(.thinMaterial, in: Capsule())
        .overlay(
            Capsule().stroke(
                LinearGradient(colors: [.white, Color.pearlFoam.opacity(0.18)], startPoint: .leading, endPoint: .trailing),
                lineWidth: 1
            )
        )
    }
}

struct ActionRow: View {
    var icon: String
    var title: String
    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(colors: [.white, Color.pearlFoam.opacity(0.45), Color.pearlBlush.opacity(0.38)], startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    .frame(width: 28, height: 28)
                    .overlay(Circle().stroke(Color.white.opacity(0.9), lineWidth: 0.5))
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(.black)
            }
            Text(title)
                .font(.headline)
        }
        .padding(.vertical, 14)
        .padding(.horizontal, 14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(colors: [.white.opacity(0.9), Color.pearlFoam.opacity(0.45), Color.pearlBlush.opacity(0.42)], startPoint: .topLeading, endPoint: .bottomTrailing),
            in: RoundedRectangle(cornerRadius: 18, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(LinearGradient(colors: [.white.opacity(0.9), Color.pearlFoam.opacity(0.35)], startPoint: .top, endPoint: .bottom), lineWidth: 1.5)
        )
        .foregroundStyle(.black) // NO grey — pure dark text/icons
    }
}

// MARK: - Reusable glass card
struct PearlCard<Content: View>: View {
    var content: () -> Content
    init(@ViewBuilder content: @escaping () -> Content) { self.content = content }
    var body: some View {
        VStack(alignment: .leading) { content() }
            .padding(16)
            .background(
                LinearGradient(colors: [
                    .white.opacity(0.60),
                    Color.pearlPeach.opacity(0.16),
                    Color.pearlViolet.opacity(0.16)
                ], startPoint: .topLeading, endPoint: .bottomTrailing),
                in: RoundedRectangle(cornerRadius: 24, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .stroke(
                        LinearGradient(colors: [.white.opacity(0.95), Color.pearlSun.opacity(0.45)], startPoint: .top, endPoint: .bottom),
                        lineWidth: 2
                    )
            )
    }
}

fileprivate func seeded01(_ i: Int, _ offset: Double) -> Double {
    // Deterministic pseudo-random in [0,1) based on i and a small offset
    let x = sin((Double(i) + offset) * 12.9898 + 78.233) * 43758.5453
    return x - floor(x)
}
