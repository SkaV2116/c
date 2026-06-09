import SwiftUI

struct WyrazResultView: View {
    let gameState: WyrazGameState
    let solution: String
    let usedRows: Int
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack {
            AppTheme.background.ignoresSafeArea()

            VStack(spacing: 24) {
                Capsule()
                    .fill(Color(white: 0.4))
                    .frame(width: 40, height: 4)
                    .padding(.top, 12)

                Text(gameState == .won ? "🎉" : "😔")
                    .font(.system(size: 64))

                Text(gameState == .won ? "Brawo!" : "Następnym razem!")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(AppTheme.textPrimary)

                if gameState == .lost {
                    VStack(spacing: 8) {
                        Text("Słowo to było:")
                            .font(AppTheme.subtitleFont)
                            .foregroundColor(AppTheme.textSecondary)
                        Text(solution)
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                            .foregroundColor(AppTheme.wyrazCorrect)
                    }
                } else {
                    VStack(spacing: 8) {
                        Text("Rozwiązane w \(usedRows) \(triesLabel(usedRows))")
                            .font(AppTheme.subtitleFont)
                            .foregroundColor(AppTheme.textSecondary)
                        Text(solution)
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                            .foregroundColor(AppTheme.wyrazCorrect)
                    }
                }

                Spacer()

                Text("Wróć jutro po kolejne słowo")
                    .font(AppTheme.bodyFont)
                    .foregroundColor(AppTheme.textSecondary)

                Button("Zamknij") { dismiss() }
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(AppTheme.surfaceElevated)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .padding(.horizontal, 24)
                    .padding(.bottom, 40)
            }
        }
        .presentationDetents([.medium])
    }

    private func triesLabel(_ n: Int) -> String {
        switch n {
        case 1:        return "próbie"
        case 2, 3, 4:  return "próbach"
        default:       return "próbach"
        }
    }
}
