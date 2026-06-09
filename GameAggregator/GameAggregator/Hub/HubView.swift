import SwiftUI

struct HubView: View {
    @State private var vm = HubViewModel()
    @Environment(AppRouter.self) private var router

    var body: some View {
        ZStack {
            AppTheme.background.ignoresSafeArea()

            VStack(spacing: 0) {
                header
                    .padding(.top, 16)

                ScrollView {
                    VStack(spacing: 16) {
                        GameCardView(
                            title: "Wyraz",
                            subtitle: vm.wyrazCompletedToday ? "Zagrane dziś ✓" : "Codzienne słowo",
                            description: vm.wyrazCompletedToday
                                ? "Wróć jutro po nowe słowo"
                                : "Zgadnij słowo w 6 próbach",
                            accentColor: AppTheme.wyrazCorrect,
                            icon: "textformat.abc",
                            badge: vm.wyrazStreak > 1 ? "\(vm.wyrazStreak) 🔥" : nil
                        ) {
                            router.navigate(to: .wyraz)
                        }

                        GameCardView(
                            title: "Gwiazdki",
                            subtitle: "\(vm.gwiazdkiProgress.completedCount)/200 poziomów",
                            description: "Umieszczaj gwiazdki na planszy",
                            accentColor: Color(red: 0.95, green: 0.85, blue: 0.55),
                            icon: "star.fill",
                            badge: nil
                        ) {
                            router.navigate(to: .gwiazdki)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 24)
                    .padding(.bottom, 40)
                }
            }
        }
        .navigationBarHidden(true)
        .onAppear { vm.refresh() }
    }

    private var header: some View {
        VStack(spacing: 4) {
            Text("Mini Gry")
                .font(AppTheme.titleFont)
                .foregroundColor(AppTheme.textPrimary)
            Text(Date.now, format: .dateTime.day().month().year())
                .font(AppTheme.subtitleFont)
                .foregroundColor(AppTheme.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.bottom, 8)
    }
}
