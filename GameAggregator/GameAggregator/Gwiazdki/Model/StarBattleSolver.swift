import Foundation

struct StarBattleSolver {

    struct Result {
        let solutions: [[GridCoord]]
        var isUnique: Bool { solutions.count == 1 }
        var hasSolution: Bool { !solutions.isEmpty }
    }

    // Find all solutions up to `stopAfter` count (use stopAfter:2 for uniqueness check)
    static func solve(_ level: StarBattleLevel, stopAfter: Int = 2) -> Result {
        let n = level.gridSize
        var stars: [GridCoord] = []
        var usedCols = Set<Int>()
        var usedRegions = Set<Int>()
        var blocked = Array(repeating: Array(repeating: false, count: n), count: n)
        var solutions: [[GridCoord]] = []

        func backtrack(row: Int) {
            if solutions.count >= stopAfter { return }
            if row == n {
                if stars.count == n { solutions.append(stars) }
                return
            }
            for col in 0..<n {
                guard !blocked[row][col],
                      !usedCols.contains(col) else { continue }
                let region = level.regionIndex(row: row, col: col)
                guard !usedRegions.contains(region) else { continue }

                // Check adjacency with existing stars
                let coord = GridCoord(row: row, col: col)
                if stars.contains(where: { isAdjacent($0, coord, n: n) }) { continue }

                // Place
                stars.append(coord)
                usedCols.insert(col)
                usedRegions.insert(region)

                // Block cells in same row+col and adjacent
                var newlyBlocked: [GridCoord] = []
                for c in 0..<n where c != col {
                    if !blocked[row][c] { blocked[row][c] = true; newlyBlocked.append(GridCoord(row: row, col: c)) }
                }
                for r in 0..<n where r != row {
                    if !blocked[r][col] { blocked[r][col] = true; newlyBlocked.append(GridCoord(row: r, col: col)) }
                }
                for dr in -1...1 {
                    for dc in -1...1 {
                        guard dr != 0 || dc != 0 else { continue }
                        let nr = row + dr; let nc = col + dc
                        if nr >= 0, nr < n, nc >= 0, nc < n, !blocked[nr][nc] {
                            blocked[nr][nc] = true
                            newlyBlocked.append(GridCoord(row: nr, col: nc))
                        }
                    }
                }

                backtrack(row: row + 1)

                // Undo
                stars.removeLast()
                usedCols.remove(col)
                usedRegions.remove(region)
                for c in newlyBlocked { blocked[c.row][c.col] = false }
            }
        }

        backtrack(row: 0)
        return Result(solutions: solutions)
    }

    private static func isAdjacent(_ a: GridCoord, _ b: GridCoord, n: Int) -> Bool {
        abs(a.row - b.row) <= 1 && abs(a.col - b.col) <= 1
    }
}
