import SwiftUI

struct HomeDashboardView: View {
    @EnvironmentObject var app: AppState
    @State private var selectedDate: Date = Date()
    // Temporary fixed mood score until AI inference is hooked up
    @State private var inferredMoodScore: Double = 0.6

    // Fixed cycle model (AI will update later)
    private let fixedCycleLength: Int = 28
    private let fixedPeriodLength: Int = 5
    private let fixedFertilityWindow: Int = 6 // days ending at ovulation day
    private let fixedReferenceStart: Date = {
        var comp = DateComponents()
        comp.year = 2025; comp.month = 1; comp.day = 3 // reference period start
        return Calendar.current.date(from: comp) ?? Date()
    }()

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

                ScrollView {
                    VStack(spacing: 16) {
                        // Title styled like Onboarding
                        Text("Nereid")
                            .font(.system(size: 44, weight: .heavy, design: .rounded))
                            .foregroundStyle(
                                LinearGradient(colors: [.white, Color(red: 0.90, green: 0.84, blue: 0.98)],
                                               startPoint: .topLeading, endPoint: .bottomTrailing)
                            )
                            // thin black contour (multi-shadow) + soft glow
                            .shadow(color: .black.opacity(0.45), radius: 0, x: 1, y: 0)
                            .shadow(color: .black.opacity(0.45), radius: 0, x: -1, y: 0)
                            .shadow(color: .black.opacity(0.45), radius: 0, x: 0, y: 1)
                            .shadow(color: .black.opacity(0.45), radius: 0, x: 0, y: -1)
                            .shadow(color: .white.opacity(0.35), radius: 8, y: 2)
                            .padding(.top, 8)

                        // Calendar card (custom month grid with translucent tint for predicted days)
                        Card {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Cycle calendar")
                                    .font(.headline)
                                let predicted = predictedDates()
                                let fertility = fertilityDates()
                                MonthGridCalendar(selectedDate: $selectedDate,
                                                  predicted: predicted,
                                                  fertility: fertility,
                                                  onToggleStart: { app.toggleCycleStart(for: $0) })
                            }
                        }

                        // Collapsible: Today quick log
                        CollapsibleCard(title: "Tell me more about your day") {
                            VStack(alignment: .leading, spacing: 12) {
                                MoodPicker { app.saveLog(.mood($0.rawValue), for: Date()) }
                                FlowPicker { app.saveLog(.flow($0.rawValue), for: Date()) }
                                PainPicker { app.saveLog(.pain($0.rawValue), for: Date()) }
                                NutritionPicker { app.saveLog(.nutrition($0.rawValue), for: Date()) }
                            }
                        }

                        // Collapsible: Today at a glance
                        CollapsibleCard(title: "Look what you already have achieved") {
                            VStack(alignment: .leading, spacing: 12) {
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
            .toolbar {
                ToolbarItem(placement: .principal) { EmptyView() } // keep our custom title
            }
        }
    }
}

private extension HomeDashboardView {
    func predictedDates() -> Set<Date> {
        var out: Set<Date> = []
        let cal = Calendar.current

        // Month span for the currently selected month
        let monthStart = cal.date(from: cal.dateComponents([.year, .month], from: selectedDate))!
        let monthDays = cal.range(of: .day, in: .month, for: monthStart)!.count
        let monthEnd = cal.date(byAdding: .day, value: monthDays - 1, to: monthStart)!

        // Sweep several cycles around the month using a fixed reference
        // to cover any month the user visits.
        // 24 cycles (~2 years) is plenty for navigation.
        for n in -24...24 {
            guard let cycleStart = cal.date(byAdding: .day, value: n * fixedCycleLength, to: fixedReferenceStart) else { continue }
            let cycleEnd = cal.date(byAdding: .day, value: fixedPeriodLength - 1, to: cycleStart)!

            // If this cycle intersects the month span, add its period days
            if cycleEnd >= monthStart && cycleStart <= monthEnd {
                for d in 0..<fixedPeriodLength {
                    if let day = cal.date(byAdding: .day, value: d, to: cycleStart) {
                        out.insert(cal.startOfDay(for: day))
                    }
                }
            }
        }

        // Also include any explicit starts recorded by the user
        for d in app.cycleStartDates {
            for k in 0..<fixedPeriodLength {
                if let day = cal.date(byAdding: .day, value: k, to: cal.startOfDay(for: d)) {
                    if day >= monthStart && day <= monthEnd { out.insert(day) }
                }
            }
        }
        return out
    }

    func fertilityDates() -> Set<Date> {
        var out: Set<Date> = []
        let cal = Calendar.current

        let monthStart = cal.date(from: cal.dateComponents([.year, .month], from: selectedDate))!
        let monthDays = cal.range(of: .day, in: .month, for: monthStart)!.count
        let monthEnd = cal.date(byAdding: .day, value: monthDays - 1, to: monthStart)!

        for n in -24...24 {
            guard let nextPeriodStart = cal.date(byAdding: .day, value: n * fixedCycleLength, to: fixedReferenceStart) else { continue }
            // Ovulation assumed ~14 days before next period start
            let ovulation = cal.date(byAdding: .day, value: -14, to: nextPeriodStart)!
            // Window ends at ovulation (inclusive), length = fixedFertilityWindow
            let windowStart = cal.date(byAdding: .day, value: -(fixedFertilityWindow - 1), to: ovulation)!
            let windowEnd = ovulation

            if windowEnd >= monthStart && windowStart <= monthEnd {
                for d in 0..<fixedFertilityWindow {
                    if let day = cal.date(byAdding: .day, value: d, to: windowStart) {
                        out.insert(cal.startOfDay(for: day))
                    }
                }
            }
        }
        return out
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

// MARK: - Collapsible glass card
struct CollapsibleCard<Content: View>: View {
    let title: String
    @State private var expanded: Bool = false
    let content: () -> Content

    init(title: String, @ViewBuilder content: @escaping () -> Content) {
        self.title = title
        self.content = content
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Button {
                withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) { expanded.toggle() }
            } label: {
                HStack {
                    Text(title)
                        .font(.headline)
                    Spacer()
                    Image(systemName: expanded ? "chevron.up" : "chevron.down")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            .buttonStyle(.plain)

            if expanded {
                content()
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .padding(16)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 24).stroke(.white.opacity(0.3)))
    }
}

// MARK: - Month grid calendar with translucent predicted highlights
struct MonthGridCalendar: View {
    @Binding var selectedDate: Date
    var predicted: Set<Date> = []
    var fertility: Set<Date> = []
    var onToggleStart: (Date) -> Void

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 6), count: 7)

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Button { selectedDate = Calendar.current.date(byAdding: .month, value: -1, to: selectedDate) ?? selectedDate } label: {
                    Image(systemName: "chevron.left")
                }
                Spacer()
                Text(monthTitle(for: selectedDate))
                    .font(.headline)
                Spacer()
                Button { selectedDate = Calendar.current.date(byAdding: .month, value: 1, to: selectedDate) ?? selectedDate } label: {
                    Image(systemName: "chevron.right")
                }
            }

            LazyVGrid(columns: columns, spacing: 6) {
                ForEach(["S","M","T","W","T","F","S"], id: \.self) { d in
                    Text(d).font(.caption2).foregroundStyle(.secondary)
                }
                ForEach(daysInMonthGrid(for: selectedDate), id: \.self) { day in
                    DayCell(date: day,
                            isCurrentMonth: Calendar.current.isDate(day, equalTo: selectedDate, toGranularity: .month),
                            isSelected: Calendar.current.isDate(day, inSameDayAs: selectedDate),
                            isPredicted: predicted.contains(Calendar.current.startOfDay(for: day)),
                            isFertility: fertility.contains(Calendar.current.startOfDay(for: day)))
                    .onTapGesture { selectedDate = day }
                    .onLongPressGesture { onToggleStart(day) }
                }
            }
            .padding(.top, 6)
        }
    }

    private func monthTitle(for date: Date) -> String {
        let f = DateFormatter(); f.dateFormat = "LLLL yyyy"; return f.string(from: date)
    }

    private func daysInMonthGrid(for date: Date) -> [Date] {
        let cal = Calendar.current
        let startOfMonth = cal.date(from: cal.dateComponents([.year, .month], from: date))!
        let range = cal.range(of: .day, in: .month, for: startOfMonth)!
        let firstWeekday = cal.component(.weekday, from: startOfMonth) // 1..7, Sun=1
        let leading = (firstWeekday - 1)

        var days: [Date] = []
        // Previous month tail
        if let prevMonth = cal.date(byAdding: .month, value: -1, to: startOfMonth),
           let prevRange = cal.range(of: .day, in: .month, for: prevMonth) {
            let lastDays = Array(prevRange.suffix(leading))
            for d in lastDays {
                if let dayDate = cal.date(byAdding: .day, value: d - 1, to: prevMonth) {
                    days.append(dayDate)
                }
            }
        }
        // Current month
        for d in range {
            if let dayDate = cal.date(byAdding: .day, value: d - 1, to: startOfMonth) {
                days.append(dayDate)
            }
        }
        // Next month head to fill grid rows (up to multiple of 7)
        while days.count % 7 != 0 {
            if let next = cal.date(byAdding: .day, value: 1, to: days.last!) { days.append(next) } else { break }
        }
        return days
    }
}

struct DayCell: View {
    let date: Date
    let isCurrentMonth: Bool
    let isSelected: Bool
    let isPredicted: Bool
    let isFertility: Bool

    var body: some View {
        let base = RoundedRectangle(cornerRadius: 8, style: .continuous)
        ZStack {
            if isFertility {
                base.fill(
                    LinearGradient(
                        gradient: Gradient(colors: [
                            Color.green.opacity(0.15),
                            Color.green.opacity(0.05)
                        ]),
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
            } else if isPredicted {
                base.fill(Color.red.opacity(0.18))
            } else {
                base.fill(Color.white.opacity(0.12))
            }
            Text("\(Calendar.current.component(.day, from: date))")
                .font(.caption)
                .foregroundColor(isCurrentMonth ? .primary : .secondary)
        }
        .overlay(
            base.stroke(isSelected ? Color.white.opacity(0.8) : Color.white.opacity(0.25), lineWidth: isSelected ? 1.5 : 1)
        )
        .frame(height: 34)
    }
}

// MARK: - Pearlescent Palette
fileprivate extension Color {
    static let pearlPeach = Color(red: 1.0, green: 0.78, blue: 0.56)
    static let pearlSun   = Color(red: 1.0, green: 0.91, blue: 0.65)
    static let pearlRose  = Color(red: 1.0, green: 0.73, blue: 0.77)
    static let pearlMint  = Color(red: 0.76, green: 1.0, blue: 0.85)
    static let pearlSky   = Color(red: 0.71, green: 0.91, blue: 1.0)
    static let pearlLilac = Color(red: 0.90, green: 0.84, blue: 0.98)
    static let pearlViolet = Color(red: 0.73, green: 0.62, blue: 0.98)
}
