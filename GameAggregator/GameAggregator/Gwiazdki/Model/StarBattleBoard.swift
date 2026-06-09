import Foundation

enum CellMark: Int, Codable, Equatable {
    case empty   = 0
    case star    = 1
    case autoX   = 2   // placed automatically when a star is placed
    case manualX = 3   // placed by long-press, survives star removal
}

struct GridCoord: Hashable, Codable, Equatable {
    let row: Int
    let col: Int
}

struct StarBattleBoard: Codable {
    var marks: [[CellMark]]          // [row][col]
    var autoXOwners: [String: [String]]   // "r,c" -> ["r1,c1","r2,c2"] star coords that caused this autoX
    var isSolved: Bool
    var moveCount: Int

    static func empty(size: Int) -> StarBattleBoard {
        StarBattleBoard(
            marks: Array(repeating: Array(repeating: .empty, count: size), count: size),
            autoXOwners: [:],
            isSolved: false,
            moveCount: 0
        )
    }

    // Encode coord to string key
    static func key(_ coord: GridCoord) -> String { "\(coord.row),\(coord.col)" }
    static func coord(from key: String) -> GridCoord? {
        let parts = key.split(separator: ",")
        guard parts.count == 2, let r = Int(parts[0]), let c = Int(parts[1]) else { return nil }
        return GridCoord(row: r, col: c)
    }

    var starCoords: [GridCoord] {
        var result: [GridCoord] = []
        for r in 0..<marks.count {
            for c in 0..<marks[r].count {
                if marks[r][c] == .star { result.append(GridCoord(row: r, col: c)) }
            }
        }
        return result
    }
}
