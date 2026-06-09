import SwiftUI

struct GwiazdkiView: View {
    let levelId: Int
    @State private var vm = GwiazdkiViewModel()
    @Environment(AppRouter.self) private var router

    var body: some View {
        ZStack {
            AppTheme.background.ignoresSafeArea()

            VStack(spacing: 0) {
                navBar

                if let level = vm.level {
                    VStack(spacing: 16) {
                        infoRow(level: level)

                        LevelGridView(level: level)
                            .environment(vm)
                            .padding(.horizontal, 16)

                        Spacer(minLength: 8)
                    }
                    .padding(.top, 12)
                } else {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }

            if vm.showSuccess {
                successOverlay
            }
        }
        .navigationBarHidden(true)
        .onAppear { vm.loadLevel(levelId) }
    }

    private var navBar: some View {
        HStack {
            BackButton()
            Spacer()
            Text("GWIAZDKI")
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundColor(AppTheme.textPrimary)
                .tracking(3)
            Spacer()
            Button {
                vm.resetLevel()
            } label: {
                Image(systemName: "arrow.counterclockwise")
                    .font(.system(size: 18, weight: .medium))
                    .foregroundColor(AppTheme.textSecondary)
                    .frame(width: 44, height: 44)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 16)
        .padding(.top, 8)
        .overlay(Divider().opacity(0.3), alignment: .bottom)
    }

    private func infoRow(level: StarBattleLevel) -> some View {
        HStack {
            Label("Poziom \(level.id)", systemImage: "flag.fill")
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(AppTheme.textSecondary)
            Spacer()
            Text("Plansza \(level.gridSize)×\(level.gridSize)")
                .font(.system(size: 14))
                .foregroundColor(AppTheme.textDisabled)
            Spacer()
            Label("\(vm.moveCount)", systemImage: "hand.tap")
                .font(.system(size: 14))
                .foregroundColor(AppTheme.textDisabled)
        }
        .padding(.horizontal, 20)
    }

    private var successOverlay: some View {
        ZStack {
            Color.black.opacity(0.6).ignoresSafeArea()

            VStack(spacing: 24) {
                Text("⭐")
                    .font(.system(size: 72))

                Text("Brawo!")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.white)

                Text("Poziom \(levelId) ukończony!")
                    .font(.system(size: 18))
                    .foregroundColor(Color(white: 0.8))

                HStack(spacing: 16) {
                    Button("Menu") {
                        router.path.removeLast(router.path.count)
                    }
                    .buttonStyle(GwiazdkiButtonStyle(primary: false))

                    if levelId < 200 {
                        Button("Dalej →") {
                            router.navigate(to: .gwiazdkiLevel(levelId + 1))
                        }
                        .buttonStyle(GwiazdkiButtonStyle(primary: true))
                    }
                }
            }
            .padding(32)
            .background(AppTheme.surface)
            .clipShape(RoundedRectangle(cornerRadius: 24))
            .padding(32)
        }
        .transition(.opacity)
        .animation(.easeInOut(duration: 0.3), value: vm.showSuccess)
    }
}

struct GwiazdkiButtonStyle: ButtonStyle {
    let primary: Bool

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 16, weight: .semibold))
            .foregroundColor(primary ? .black : .white)
            .padding(.horizontal, 28)
            .padding(.vertical, 14)
            .background(primary ? Color.yellow : AppTheme.surfaceElevated)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
    }
}
