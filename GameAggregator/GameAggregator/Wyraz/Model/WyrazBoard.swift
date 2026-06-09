import Foundation

enum TileState: String, Codable {
    case empty    // no letter
    case typed    // letter entered, not yet submitted
    case correct  // right letter, right position (green)
    case present  // right letter, wrong position (yellow)
    case absent   // letter not in word (gray)
}

struct WyrazTile: Identifiable, Codable {
    let id: UUID
    var letter: Character?
    var state: TileState

    init(letter: Character? = nil, state: TileState = .empty) {
        self.id = UUID()
        self.letter = letter
        self.state = state
    }

    var display: String {
        letter.map(String.init) ?? ""
    }
}

enum WyrazGameState: String, Codable {
    case inProgress, won, lost
}

struct WyrazBoard: Codable {
    var rows: [[WyrazTile]]
    var currentRow: Int
    var currentCol: Int
    var gameState: WyrazGameState
    var dateKey: String    // "yyyy-MM-dd" — stale detection

    static func fresh() -> WyrazBoard {
        let emptyRow = { (0..<5).map { _ in WyrazTile() } }
        return WyrazBoard(
            rows: (0..<6).map { _ in emptyRow() },
            currentRow: 0,
            currentCol: 0,
            gameState: .inProgress,
            dateKey: todayKey()
        )
    }

    static func todayKey() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Date())
    }

    var isFinished: Bool { gameState != .inProgress }

    var letterStates: [Character: TileState] {
        var result: [Character: TileState] = [:]
        let priority: [TileState: Int] = [.correct: 3, .present: 2, .absent: 1, .typed: 0, .empty: -1]
        for row in rows {
            for tile in row {
                guard let letter = tile.letter, tile.state != .empty, tile.state != .typed else { continue }
                if let current = result[letter] {
                    if (priority[tile.state] ?? 0) > (priority[current] ?? 0) {
                        result[letter] = tile.state
                    }
                } else {
                    result[letter] = tile.state
                }
            }
        }
        return result
    }
}
