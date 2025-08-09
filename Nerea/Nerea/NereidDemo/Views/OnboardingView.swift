import SwiftUI
import CoreHaptics

// MARK: - Iridescent Palette
fileprivate extension Color {
    static let pearl1 = Color(red: 0.80, green: 0.92, blue: 0.98)
    static let pearl2 = Color(red: 0.90, green: 0.84, blue: 0.98)
    static let pearl3 = Color(red: 0.98, green: 0.93, blue: 0.82)
    static let pearl4 = Color(red: 0.70, green: 0.88, blue: 0.85)
}

enum ControlTarget: String, CaseIterable {
    case cycle = "Average cycle length"
    case period = "Typical period length"
    case age = "Age"
}

// MARK: - Onboarding
struct OnboardingView: View {
    @EnvironmentObject var appState: AppState
    // Values
    @State private var cycleLength: Int = 28        // 20...45
    @State private var periodLength: Int = 5        // 2...10
    @State private var age: Int = 25                // 12...60

    @State private var target: ControlTarget = .cycle
    @State private var dragAccum: CGFloat = 0
    @State private var engine: CHHapticEngine?

    private let cycleRange = 20...45
    private let periodRange = 2...10
    private let ageRange = 12...60

    var body: some View {
        GeometryReader { geo in
            let width = geo.size.width
            ZStack {
                LinearGradient(colors: [.pearl1.opacity(0.95), .pearl2.opacity(0.9), .pearl4.opacity(0.95)],
                               startPoint: .topLeading, endPoint: .bottomTrailing)
                    .ignoresSafeArea()

                VStack(spacing: 12) {
                    // Title
                    Text("Nereid")
                        .font(.system(size: min(56, width*0.18), weight: .heavy, design: .rounded))
                        .foregroundStyle(
                            LinearGradient(colors: [.white, .pearl2],
                                           startPoint: .topLeading, endPoint: .bottomTrailing)
                        )
                        // black contour using multiple tight shadows
                        .shadow(color: .black.opacity(0.45), radius: 0, x: 1, y: 0)
                        .shadow(color: .black.opacity(0.45), radius: 0, x: -1, y: 0)
                        .shadow(color: .black.opacity(0.45), radius: 0, x: 0, y: 1)
                        .shadow(color: .black.opacity(0.45), radius: 0, x: 0, y: -1)
                        // keep soft glow
                        .shadow(color: .white.opacity(0.35), radius: 10, y: 2)
                        .padding(.top, 8)

                    // Sub headline replaced by gentle space
                    Spacer(minLength: 0)

                    // Pearl control
                    PearlDial(selected: $target, valueString: currentValueString, progress: currentProgress, onDrag: handleDrag)
                        .frame(height: min(280, geo.size.height*0.34))
                        .padding(.horizontal, 24)

                    // Inline segmented selector for which parameter the pearl controls
                    TargetSelector(target: $target)
                        .padding(.horizontal, 24)

                    // Readouts (single line, no scrolling)
                    HStack(spacing: 10) {
                        ReadoutPill(title: "Cycle", value: "\(cycleLength) d")
                        ReadoutPill(title: "Period", value: "\(periodLength) d")
                        ReadoutPill(title: "Age", value: "\(age)")
                    }
                    .padding(.horizontal, 24)

                    Spacer(minLength: 0)

                    // CTA
                    Button {
                        withAnimation(.easeInOut) {
                            appState.hasCompletedOnboarding = true
                        }
                    } label: {
                        Text("Ready to control yourself?")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                    }
                    .background(
                        LinearGradient(colors: [.pearl2, .pearl4], startPoint: .leading, endPoint: .trailing)
                            .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                    )
                    .foregroundColor(.white)
                    .shadow(radius: 8, y: 2)
                    .padding(.horizontal, 24)
                    .padding(.bottom, 22)
                }
            }
            .onAppear { prepareHaptics() }
        }
    }

    // MARK: - Helpers
    private var currentValueString: String {
        switch target {
        case .cycle: return "\(cycleLength) days"
        case .period: return "\(periodLength) days"
        case .age: return "\(age)"
        }
    }

    private var currentProgress: Double {
        switch target {
        case .cycle:
            return Double(cycleLength - cycleRange.lowerBound) / Double(cycleRange.upperBound - cycleRange.lowerBound)
        case .period:
            return Double(periodLength - periodRange.lowerBound) / Double(periodRange.upperBound - periodRange.lowerBound)
        case .age:
            return Double(age - ageRange.lowerBound) / Double(ageRange.upperBound - ageRange.lowerBound)
        }
    }
    

    private func handleDrag(delta: CGFloat) {
        // accumulate horizontal movement; step every ~40pt
        dragAccum += delta
        let step: CGFloat = 40
        while dragAccum > step {
            increment(+1)
            dragAccum -= step
        }
        while dragAccum < -step {
            increment(-1)
            dragAccum += step
        }
    }

    private func increment(_ dir: Int) {
        switch target {
        case .cycle:
            cycleLength = clamp(cycleLength + dir, range: cycleRange)
        case .period:
            periodLength = clamp(periodLength + dir, range: periodRange)
        case .age:
            age = clamp(age + dir, range: ageRange)
        }
        hapticTick()
    }

    private func clamp(_ v: Int, range: ClosedRange<Int>) -> Int {
        return min(max(v, range.lowerBound), range.upperBound)
    }
}

// MARK: - Pearl Dial
struct PearlDial: View {
    @Binding var selected: ControlTarget
    var valueString: String
    var progress: Double
    var onDrag: (CGFloat) -> Void

    @State private var hueShift: Double = 0
    @State private var press: Bool = false
    @State private var lastX: CGFloat = 0

    var body: some View {
        GeometryReader { geo in
            let size = min(geo.size.width, geo.size.height)
            ZStack {
                // Soft iridescent card
                RoundedRectangle(cornerRadius: 28, style: .continuous)
                    .fill(.ultraThinMaterial)
                    .overlay(RoundedRectangle(cornerRadius: 28).stroke(.white.opacity(0.35), lineWidth: 1))

                // The pearl itself as the control
                Circle()
                    .fill(
                        RadialGradient(colors: [.white, Color.pearl2.opacity(0.85), Color.pearl4.opacity(0.6), .clear],
                                       center: .center, startRadius: 6, endRadius: size*0.65)
                    )
                    .overlay(
                        Circle().stroke(.white.opacity(0.5), lineWidth: 1.5)
                    )
                    .shadow(color: .white.opacity(0.35), radius: press ? 20 : 10)
                    .scaleEffect(press ? 0.97 : 1.0)
                    .overlay(
                        // Indicator text
                        VStack(spacing: 8) {
                            Text(selected.rawValue)
                                .font(.subheadline.weight(.semibold))
                                .foregroundColor(.primary.opacity(0.8))
                                .padding(.top, 8)
                            Text(valueString)
                                .font(.system(size: 28, weight: .bold, design: .rounded))
                                .foregroundStyle(LinearGradient(colors: [.primary.opacity(0.9), .primary.opacity(0.7)], startPoint: .top, endPoint: .bottom))
                        }
                        .padding(.horizontal, 16)
                    )
                    .padding(.horizontal, 12)
                    .gesture(
                        DragGesture(minimumDistance: 0)
                            .onChanged { g in
                                if lastX == 0 { lastX = g.location.x }
                                let dx = g.location.x - lastX
                                lastX = g.location.x
                                onDrag(dx)
                                press = true
                            }
                            .onEnded { _ in
                                lastX = 0
                                withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                                    press = false
                                }
                            }
                    )
                    .padding(16)

                
                // Labels for bounds
               // Rotating rim marker attached to the pearl to indicate position
                Circle()
                    .stroke(Color.white.opacity(0.18), lineWidth: 3)
                    .frame(width: size * 0.78, height: size * 0.78)

                Circle()
                    .fill(
                        LinearGradient(colors: [.white, Color.pearl2], startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    .frame(width: 14, height: 14)
                    .overlay(Circle().stroke(Color.black.opacity(0.25), lineWidth: 0.75))
                    .shadow(radius: 2)
                    .offset(y: -(size * 0.36))
                    // map progress 0...1 to an arc around the pearl (about 320 degrees)
                    .rotationEffect(.degrees(progress * 320 - 160))
            }
        }
    }
}


// MARK: - Target Selector
struct TargetSelector: View {
    @Binding var target: ControlTarget

    var body: some View {
        HStack(spacing: 8) {
            ForEach(ControlTarget.allCases, id: \.self) { t in
                Button {
                    withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                        target = t
                    }
                } label: {
                    Text(short(t))
                        .font(.subheadline.weight(.semibold))
                        .padding(.vertical, 10)
                        .padding(.horizontal, 14)
                        .background(.ultraThinMaterial)
                        .overlay(Capsule().stroke(.white.opacity(0.35), lineWidth: 1))
                        .clipShape(Capsule())
                }
                .foregroundColor(target == t ? .primary : .secondary)
            }
        }
    }

    private func short(_ t: ControlTarget) -> String {
        switch t {
        case .cycle: return "Cycle"
        case .period: return "Period"
        case .age: return "Age"
        }
    }
}

// MARK: - Readout Pill
struct ReadoutPill: View {
    let title: String
    let value: String
    var body: some View {
        VStack(spacing: 4) {
            Text(title).font(.caption).foregroundColor(.secondary)
            Text(value).font(.headline)
        }
        .padding(.vertical, 10).padding(.horizontal, 12)
        .background(.ultraThinMaterial)
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(.white.opacity(0.35), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

// MARK: - Haptics
extension OnboardingView {
    private func prepareHaptics() {
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }
        do {
            engine = try CHHapticEngine()
            try engine?.start()
        } catch {
            // ignore in simulator
        }
    }

    fileprivate func hapticTick() {
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }
        var events = [CHHapticEvent]()
        let sharp = CHHapticEvent(eventType: .hapticTransient,
                                  parameters: [CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.6),
                                               CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.7)],
                                  relativeTime: 0)
        events.append(sharp)
        do {
            let pattern = try CHHapticPattern(events: events, parameters: [])
            let player = try engine?.makePlayer(with: pattern)
            try player?.start(atTime: 0)
        } catch {
            // ignore in simulator
        }
    }
}
