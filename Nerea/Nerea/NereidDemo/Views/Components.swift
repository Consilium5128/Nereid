import SwiftUI

// MARK: - Brand
extension Color {
    static let accentSea = Color(red: 0.0, green: 0.57, blue: 0.69) // teal
}

struct AquaBackground: View {
    var body: some View {
        LinearGradient(colors: [
            Color.accentSea.opacity(0.10),
            Color.teal.opacity(0.05),
            Color.blue.opacity(0.03)
        ], startPoint: .topLeading, endPoint: .bottomTrailing)
        .ignoresSafeArea()
    }
}

struct Card<Content: View>: View {
    var content: () -> Content
    init(@ViewBuilder _ content: @escaping () -> Content) {
        self.content = content
    }
    var body: some View {
        VStack(alignment: .leading) {
            content()
        }
        .padding(16)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .shadow(color: .black.opacity(0.04), radius: 12, x: 0, y: 6)
    }
}

struct WaterButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(LinearGradient(colors: [.accentSea, .teal], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .shadow(color: .accentSea.opacity(configuration.isPressed ? 0.1 : 0.3), radius: configuration.isPressed ? 4 : 12, x: 0, y: 6)
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
    }
}

struct WaterCapsule: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.horizontal, 12).padding(.vertical, 6)
            .background(Color.accentSea.opacity(0.12), in: Capsule())
    }
}

// MARK: - Quick log pickers
struct MoodPicker: View {
    var onPick: (Mood) -> Void
    var body: some View {
        PickerRow(title: "Mood", items: Mood.allCases.map { ($0.rawValue.capitalized, $0) }) { onPick($0) }
    }
}
struct FlowPicker: View {
    var onPick: (Flow) -> Void
    var body: some View {
        PickerRow(title: "Flow", items: Flow.allCases.map { ($0.rawValue.capitalized, $0) }) { onPick($0) }
    }
}
struct PainPicker: View {
    var onPick: (Pain) -> Void
    var body: some View {
        PickerRow(title: "Pain", items: Pain.allCases.map { ($0.rawValue.capitalized, $0) }) { onPick($0) }
    }
}
struct NutritionPicker: View {
    var onPick: (Nutrition) -> Void
    var body: some View {
        PickerRow(title: "Nutrition", items: Nutrition.allCases.map { ($0.rawValue.capitalized, $0) }) { onPick($0) }
    }
}

struct PickerRow<T: Identifiable>: View {
    var title: String
    var items: [(String, T)]
    var onPick: (T) -> Void
    @State private var isPresented = false

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).bold()
            ScrollView(.horizontal, showsIndicators: false) {
                HStack {
                    ForEach(items, id: \.1.id) { item in
                        Button {
                            onPick(item.1)
                        } label: {
                            Text(item.0)
                                .font(.footnote).bold()
                                .padding(.horizontal, 10).padding(.vertical, 6)
                        }
                        .buttonStyle(WaterCapsule())
                    }
                }
            }
        }
    }
}
