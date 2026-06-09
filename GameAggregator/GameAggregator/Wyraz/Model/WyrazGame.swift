import Foundation

struct WyrazGame {

    // Deterministic daily word
    static func solution(for date: Date, wordList: [String]) -> String {
        guard !wordList.isEmpty else { return "SŁOWO" }
        let ref = Calendar.current.date(from: DateComponents(year: 2024, month: 1, day: 1))!
        let days = Calendar.current.dateComponents([.day], from: ref, to: date).day ?? 0
        return wordList[abs(days) % wordList.count]
    }

    // Evaluate a guess against the solution.
    // Returns array of 5 TileState values.
    // Handles duplicate letters correctly (Wordle algorithm).
    static func evaluate(guess: String, solution: String) -> [TileState] {
        let guessChars = Array(guess.uppercased())
        let solutionChars = Array(solution.uppercased())
        guard guessChars.count == 5, solutionChars.count == 5 else {
            return Array(repeating: .absent, count: 5)
        }

        var states = Array(repeating: TileState.absent, count: 5)
        var remainingCounts: [Character: Int] = [:]

        // First pass: mark greens, count remaining solution letters
        for i in 0..<5 {
            if guessChars[i] == solutionChars[i] {
                states[i] = .correct
            } else {
                remainingCounts[solutionChars[i], default: 0] += 1
            }
        }

        // Second pass: mark yellows using remaining counts
        for i in 0..<5 {
            guard states[i] != .correct else { continue }
            let letter = guessChars[i]
            if let count = remainingCounts[letter], count > 0 {
                states[i] = .present
                remainingCounts[letter] = count - 1
            }
        }

        return states
    }

    // Apply evaluated states to a board row in-place
    static func applyStates(_ states: [TileState], to row: inout [WyrazTile]) {
        for i in 0..<min(states.count, row.count) {
            row[i].state = states[i]
        }
    }
}
