import SwiftUI

struct LevelSelectView: View {
    @Environment(AppRouter.self) private var router
    @State private var completedLevels: Set<Int> = []

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 12), count: 5)

    var body: some View {
        ZStack {
            AppTheme.background.ignoresSafeArea()

            VStack(spacing: 0) {
                navBar

                ScrollView {
                    LazyVGrid(columns: columns, spacing: 12) {
                        ForEach(1...200, id: \.self) { id in
                            levelButton(id: id)
                        }
                    }
                    .padding(16)
                }
            }
        }
        .navigationBarHidden(true)
        .onAppear { completedLevels = StarBattlePersistence.completedLevels() }
    }

    private var navBar: some View {
        HStack {
            BackButton()
            Spacer()
            VStack(spacing: 2) {
                Text("GWIAZDKI")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundColor(AppTheme.textPrimary)
                    .tracking(3)
                Text("\(completedLevels.count)/200 ukończonych")
                    .font(.system(size: 11))
                    .foregroundColor(AppTheme.textSecondary)
            }
            Spacer()
            Color.clear.frame(width: 44, height: 44)
        }
        .padding(.horizontal, 16)
        .padding(.top, 8)
        .padding(.bottom, 4)
        .overlay(Divider().opacity(0.3), alignment: .bottom)
    }

    @ViewBuilder
    private func levelButton(id: Int) -> some View {
        let completed = completedLevels.contains(id)
        let unlocked = id == 1 || completedLevels.contains(id - 1)
        let gridSize = LevelBundle.shared.level(id)?.gridSize ?? 6

        Button {
            if unlocked { router.navigate(to: .gwiazdkiLevel(id)) }
        } label: {
            VStack(spacing: 4) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(completed ? AppTheme.wyrazCorrect.opacity(0.3) :
                              unlocked  ? AppTheme.surfaceElevated :
                                          AppTheme.surface)
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(completed ? AppTheme.wyrazCorrect.opacity(0.5) :
                                        unlocked  ? Color(white: 0.35) :
                                                    Color.clear, lineWidth: 1)
                        )

                    if completed {
                        Image(systemName: "star.fill")
                            .font(.system(size: 20))
                            .foregroundColor(.yellow)
                    } else if unlocked {
                        Text("\(id)")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(AppTheme.textPrimary)
                    } else {
                        Image(systemName: "lock.fill")
                            .font(.system(size: 14))
                            .foregroundColor(AppTheme.textDisabled)
                    }
                }
                .frame(height: 52)

                Text("\(gridSize)×\(gridSize)")
                    .font(.system(size: 10))
                    .foregroundColor(AppTheme.textDisabled)
            }
        }
        .buttonStyle(.plain)
        .disabled(!unlocked)
    }
}
