import SwiftUI

struct GoalsView: View {
    @EnvironmentObject var app: AppState

    var body: some View {
        NavigationStack {
            ZStack {
                AquaBackground()
                ScrollView {
                    VStack(spacing: 16) {
                        Card {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Your goals")
                                    .font(.headline)
                                ForEach(app.goals) { goal in
                                    GoalRow(goal: goal)
                                        .padding(.vertical, 6)
                                }
                            }
                        }
                        Card {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("What you do now")
                                    .font(.headline)
                                Text("Auto-inferred from sensors and your logs. Edit to add routines.")
                                    .font(.footnote).foregroundStyle(.secondary)
                                VStack(alignment: .leading, spacing: 8) {
                                    RoutineRow(icon: "bed.double.fill", text: "Wind-down at 10:30pm (from sleep data)")
                                    RoutineRow(icon: "drop.fill", text: "Water sips each work hour (from reminders)")
                                    RoutineRow(icon: "figure.run", text: "Walk after lunch most days (from steps)")
                                }
                            }
                        }
                    }
                    .padding(16)
                }
            }
            .navigationTitle("Goals")
        }
    }
}

struct GoalRow: View {
    var goal: Goal
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(goal.title).bold()
                Text(targetText).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            ProgressView(value: progressValue)
                .frame(width: 120)
        }
    }

    var targetText: String {
        switch goal.target {
        case .value(let v):
            return "Target \(Int(v)) \(goal.unit) • Today \(Int(goal.current))"
        case .range(let r):
            return "Target \(Int(r.lowerBound))–\(Int(r.upperBound)) \(goal.unit) • Today \(String(format: "%.1f", goal.current))"
        }
    }

    var progressValue: Double {
        switch goal.target {
        case .value(let v):
            return min(1, goal.current / max(1, v))
        case .range(let r):
            let mid = (r.lowerBound + r.upperBound) / 2.0
            return min(1, goal.current / max(1, mid))
        }
    }
}

struct RoutineRow: View {
    var icon: String; var text: String
    var body: some View {
        HStack {
            Image(systemName: icon).frame(width: 24)
            Text(text)
            Spacer()
            Image(systemName: "chevron.right").foregroundStyle(.tertiary)
        }
        .font(.subheadline)
        .padding(10)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}
