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
                                                                                                Label("Next period: \(app.predictions.nextPeriodStart?.formatted(date: .abbreviated, time: .omitted) ?? "Unknown")", systemImage: "drop.fill")
                                    .font(.subheadline)
                                    .font(.subheadline)
                            }
                        }

                        Card {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Cycle Phases")
                                    .font(.headline)
                                
                                VStack(alignment: .leading, spacing: 8) {
                                    ForEach(app.predictions.phases, id: \.name) { phase in
                                        HStack {
                                            Text(phase.name.capitalized)
                                                .font(.subheadline)
                                                .foregroundColor(.primary)
                                            Spacer()
                                            Text("\(phase.duration) days")
                                                .font(.caption)
                                                .foregroundColor(.secondary)
                                        }
                                        .padding(.vertical, 4)
                                    }
                                }
                                
                                Text("Confidence: \(Int(app.predictions.confidence * 100))%")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
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


