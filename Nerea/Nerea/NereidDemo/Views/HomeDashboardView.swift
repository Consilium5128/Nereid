import SwiftUI

struct HomeDashboardView: View {
    @EnvironmentObject var app: AppState
    @State private var selectedDate: Date = Date()

    var body: some View {
        NavigationStack {
            ZStack {
                AquaBackground()
                ScrollView {
                    VStack(spacing: 16) {
                        // Calendar / DatePicker
                        Card {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Cycle calendar")
                                    .font(.headline)
                                DatePicker("",
                                           selection: $selectedDate,
                                           displayedComponents: [.date])
                                .datePickerStyle(.graphical)
                                .tint(.accentSea)
                                HStack {
                                    Button {
                                        app.toggleCycleStart(for: selectedDate)
                                    } label: {
                                        Label("Toggle period start", systemImage: "drop.fill")
                                    }
                                    .buttonStyle(WaterCapsule())
                                    Spacer()
                                    if let next = app.predictions.nextPeriodStart {
                                        Text("Next: \(next.formatted(date: .abbreviated, time: .omitted))")
                                            .font(.footnote).foregroundStyle(.secondary)
                                    }
                                }
                            }
                        }

                        // Quick asks (only things we can't infer)
                        Card {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Today’s quick log")
                                    .font(.headline)
                                MoodPicker { app.saveLog(.mood($0), for: Date()) }
                                FlowPicker { app.saveLog(.flow($0), for: Date()) }
                                PainPicker { app.saveLog(.pain($0), for: Date()) }
                                NutritionPicker { app.saveLog(.nutrition($0), for: Date()) }
                            }
                        }

                        // Mini analytics
                        Card {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Today at a glance")
                                    .font(.headline)
                                MetricRow(icon: "figure.walk", title: "Steps", value: "\(app.latestReadings.steps)")
                                MetricRow(icon: "bed.double.fill", title: "Sleep", value: String(format: "%.1fh", app.latestReadings.sleepHours))
                                MetricRow(icon: "iphone", title: "Screen", value: String(format: "%.1fh", app.latestReadings.screenTimeHours))
                                MetricRow(icon: "thermometer", title: "Temp", value: String(format: "%.1f℃", app.latestReadings.temperatureC))
                            }
                        }
                    }
                    .padding(16)
                }
            }
            .navigationTitle("Nereid")
        }
    }
}

struct MetricRow: View {
    var icon: String; var title: String; var value: String
    var body: some View {
        HStack {
            Image(systemName: icon).frame(width: 24)
            Text(title)
            Spacer()
            Text(value).bold()
        }
        .font(.subheadline)
    }
}
