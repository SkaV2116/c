import SwiftUI

@Observable
@MainActor
final class WyrazViewModel {
    var board: WyrazBoard
    var shakeTrigger: Bool = false
    var toastMessage: String? = nil
    var flipRow: Int? = nil
    var showResult: Bool = false
    private(set) var isAnimating: Bool = false

    private let dictionary = WyrazDictionary.shared
    private let solution: String

    init() {
        solution = WyrazDictionary.shared.todaysSolution()
        if let saved = WyrazPersistence.load() {
            board = saved
        } else {
            board = WyrazBoard.fresh()
        }
    }

    var currentGuess: String {
        board.rows[board.currentRow]
            .compactMap { $0.letter }
            .map(String.init)
            .joined()
    }

    func keyTapped(_ key: String) {
        guard !board.isFinished, !isAnimating else { return }
        guard board.currentCol < 5 else { return }
        let char = Character(key.uppercased())
        board.rows[board.currentRow][board.currentCol].letter = char
        board.rows[board.currentRow][board.currentCol].state = .typed
        board.currentCol += 1
    }

    func deleteTapped() {
        guard !board.isFinished, !isAnimating else { return }
        guard board.currentCol > 0 else { return }
        board.currentCol -= 1
        board.rows[board.currentRow][board.currentCol].letter = nil
        board.rows[board.currentRow][board.currentCol].state = .empty
    }

    func submitTapped() {
        guard !board.isFinished, !isAnimating else { return }
        let guess = currentGuess
        guard guess.count == 5 else {
            triggerShake()
            showToast("Za mało liter")
            return
        }
        guard dictionary.isValid(guess) else {
            triggerShake()
            showToast("Nieznane słowo")
            return
        }

        let states = WyrazGame.evaluate(guess: guess, solution: solution)
        WyrazGame.applyStates(states, to: &board.rows[board.currentRow])
        flipRow = board.currentRow

        let row = board.currentRow
        let won = states.allSatisfy { $0 == .correct }

        board.currentRow += 1
        board.currentCol = 0
        isAnimating = true

        Task { @MainActor in
            // Wait for flip animation (5 tiles × 0.1s delay + 0.3s flip = ~0.8s total)
            try? await Task.sleep(for: .milliseconds(900))
            isAnimating = false
            if won {
                board.gameState = .won
                WyrazPersistence.incrementStreak(won: true)
                showToast(wonMessage(row: row))
                try? await Task.sleep(for: .milliseconds(1500))
                showResult = true
            } else if board.currentRow == 6 {
                board.gameState = .lost
                WyrazPersistence.incrementStreak(won: false)
                showToast(solution)
                try? await Task.sleep(for: .milliseconds(2000))
                showResult = true
            }
            WyrazPersistence.save(board)
        }
    }

    private func triggerShake() {
        shakeTrigger = true
        Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(600))
            shakeTrigger = false
        }
    }

    private func showToast(_ message: String) {
        toastMessage = message
        Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(2000))
            toastMessage = nil
        }
    }

    private func wonMessage(row: Int) -> String {
        switch row {
        case 0: return "Genialne!"
        case 1: return "Świetnie!"
        case 2: return "Doskonale!"
        case 3: return "Dobrze!"
        case 4: return "Nieźle!"
        default: return "Uff, ledwo!"
        }
    }
}
