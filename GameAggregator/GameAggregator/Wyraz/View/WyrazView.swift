import SwiftUI

struct WyrazView: View {
    @State private var vm = WyrazViewModel()

    var body: some View {
        @Bindable var bvm = vm
        ZStack {
            AppTheme.background.ignoresSafeArea()

            VStack(spacing: 0) {
                navigationBar

                if let toast = vm.toastMessage {
                    toastView(toast)
                        .transition(.move(edge: .top).combined(with: .opacity))
                        .zIndex(10)
                }

                WyrazBoardView(
                    board: vm.board,
                    shakeTrigger: vm.shakeTrigger,
                    flipRow: vm.flipRow
                )
                .padding(.horizontal, 16)
                .padding(.vertical, 8)

                Spacer(minLength: 8)

                WyrazKeyboardView(
                    letterStates: vm.board.letterStates,
                    onKey: vm.keyTapped,
                    onDelete: vm.deleteTapped,
                    onSubmit: vm.submitTapped
                )
            }
        }
        .navigationBarHidden(true)
        .sheet(isPresented: $bvm.showResult) {
            WyrazResultView(
                gameState: vm.board.gameState,
                solution: WyrazDictionary.shared.todaysSolution(),
                usedRows: vm.board.currentRow
            )
        }
        .animation(.easeInOut(duration: 0.2), value: vm.toastMessage)
    }

    private var navigationBar: some View {
        HStack {
            BackButton()
            Spacer()
            Text("WYRAZ")
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundColor(AppTheme.textPrimary)
                .tracking(4)
            Spacer()
            Color.clear.frame(width: 44, height: 44)
        }
        .padding(.horizontal, 16)
        .padding(.top, 8)
        .padding(.bottom, 4)
        .overlay(
            Divider().opacity(0.3),
            alignment: .bottom
        )
    }

    private func toastView(_ message: String) -> some View {
        Text(message)
            .font(.system(size: 14, weight: .semibold))
            .foregroundColor(.white)
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(Color(white: 0.2))
            .clipShape(Capsule())
            .padding(.top, 8)
    }
}

struct BackButton: View {
    @Environment(AppRouter.self) private var router

    var body: some View {
        Button {
            router.path.removeLast()
        } label: {
            Image(systemName: "chevron.left")
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(AppTheme.textPrimary)
                .frame(width: 44, height: 44)
        }
        .buttonStyle(.plain)
    }
}
