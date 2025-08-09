import SwiftUI
import Charts

struct PredictionsView: View {
    @EnvironmentObject var app: AppState

    var body: some View {
        NavigationStack {
            ZStack {
                AquaBackground()
                ScrollView {
                    VStack(spacing: 16) {
                        Card {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Cycle forecast")
                                    .font(.headline)
                                if let next = app.predictions.nextPeriodStart {
                                    Label("Next period ~ \(next.formatted(date: .long, time: .omitted))", systemImage: "drop.fill")
                                        .font(.subheadline)
                                } else {
                                    Text("Not enough data yet").font(.subheadline)
                                }
                                if let fw = app.predictions.fertileWindow {
                                    Label("Fertile window: \(fw.lowerBound.formatted(date: .abbreviated, time: .omitted)) → \(fw.upperBound.formatted(date: .abbreviated, time: .omitted))", systemImage: "leaf.fill")
                                        .font(.subheadline)
                                }
                            }
                        }

                        Card {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Condition probabilities")
                                    .font(.headline)
                                Chart(app.predictions.probabilities) { item in
                                    BarMark(
                                        x: .value("Condition", item.condition.rawValue),
                                        y: .value("Probability", item.probability * 100.0)
                                    )
                                }
                                .frame(height: 180)
                                .chartYAxis {
                                    AxisMarks(position: .leading) { value in
                                        AxisGridLine()
                                        AxisValueLabel {
                                            if let v = value.as(Double.self) {
                                                Text("\(Int(v))%")
                                            }
                                        }
                                    }
                                }
                                .chartXAxis {
                                    AxisMarks { value in
                                        AxisValueLabel {
                                            if let s = value.as(String.self) {
                                                Text(s.capitalized)
                                            }
                                        }
                                    }
                                }

                                // Actionable suggestions
                                VStack(alignment: .leading, spacing: 8) {
                                    ForEach(app.predictions.probabilities.filter { $0.actionable }) { cp in
                                        SuggestionRow(condition: cp.condition, probability: cp.probability)
                                    }
                                }
                            }
                        }
                    }
                    .padding(16)
                }
            }
            .navigationTitle("Insights")
        }
    }
}

struct SuggestionRow: View {
    var condition: Predictions.Condition
    var probability: Double

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "sparkles")
                .padding(8).background(.ultraThinMaterial, in: Circle())
            VStack(alignment: .leading, spacing: 4) {
                Text(condition.rawValue.capitalized)
                    .font(.subheadline).bold()
                Text(recommendationText)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Text("\(Int(probability * 100))%")
                .font(.footnote).bold()
                .padding(6).background(Color.accentSea.opacity(0.12), in: RoundedRectangle(cornerRadius: 8))
        }
    }

    var recommendationText: String {
        switch condition {
        case .anemia:
            return "Consider iron-rich foods. If heavy flow persists, talk to a clinician."
        case .pregnancy:
            return "Fertile window approaching; log intercourse & take prenatal if trying."
        case .pain:
            return "Plan heat therapy, magnesium, and gentle movement on high-risk days."
        case .pcos:
            return "Cycle variability detected. Track ovulation and discuss labs if concerned."
        case .weightFluctuation:
            return "Hydration & sleep can stabilize weight during luteal phase."
        case .menopauseTransition:
            return "Watch for changing cycle length & symptoms; keep logs for your clinician."
        case .endometriosis:
            return "Persistent severe pain? Keep pain diary; consider specialist consult."
        }
    }
}
