import SwiftUI

@Observable
@MainActor
final class GwiazdkiViewModel {
    var level: StarBattleLevel?
    var board: StarBattleBoard = .empty(size: 6)
    var showSuccess: Bool = false
    var moveCount: Int = 0

    private var currentLevelId: Int?

    func loadLevel(_ id: Int) {
        guard let lvl = LevelBundle.shared.level(id) else { return }
        level = lvl
        currentLevelId = id
        showSuccess = false

        if let saved = StarBattlePersistence.loadBoard(levelId: id) {
            board = saved
        } else {
            board = .empty(size: lvl.gridSize)
        }
        moveCount = board.moveCount
    }

    func cellTapped(row: Int, col: Int) {
        guard let lvl = level else { return }
        guard row >= 0, row < lvl.gridSize, col >= 0, col < lvl.gridSize else { return }

        let current = board.marks[row][col]
        switch current {
        case .star:
            removeStar(at: GridCoord(row: row, col: col))
        case .empty:
            placeStar(at: GridCoord(row: row, col: col), level: lvl)
        case .autoX:
            break  // can't place here
        case .manualX:
            board.marks[row][col] = .empty
        }

        board.moveCount += 1
        moveCount = board.moveCount
        persist()
        checkSolved(level: lvl)
    }

    func cellLongPressed(row: Int, col: Int) {
        guard let lvl = level else { return }
        guard row >= 0, row < lvl.gridSize, col >= 0, col < lvl.gridSize else { return }
        let current = board.marks[row][col]
        guard current == .empty || current == .manualX else { return }
        board.marks[row][col] = current == .manualX ? .empty : .manualX
        persist()
    }

    func resetLevel() {
        guard let lvl = level, let id = currentLevelId else { return }
        board = .empty(size: lvl.gridSize)
        moveCount = 0
        showSuccess = false
        StarBattlePersistence.clearBoard(levelId: id)
    }

    // MARK: - Private

    private func placeStar(at coord: GridCoord, level: StarBattleLevel) {
        let n = level.gridSize
        board.marks[coord.row][coord.col] = .star

        let starKey = StarBattleBoard.key(coord)
        var autoXCells: [String] = []

        // Same row
        for c in 0..<n where c != coord.col {
            markAutoX(row: coord.row, col: c, starKey: starKey, autoXCells: &autoXCells)
        }
        // Same column
        for r in 0..<n where r != coord.row {
            markAutoX(row: r, col: coord.col, starKey: starKey, autoXCells: &autoXCells)
        }
        // 8 neighbors
        for dr in -1...1 {
            for dc in -1...1 {
                guard dr != 0 || dc != 0 else { continue }
                let nr = coord.row + dr; let nc = coord.col + dc
                if nr >= 0, nr < n, nc >= 0, nc < n {
                    markAutoX(row: nr, col: nc, starKey: starKey, autoXCells: &autoXCells)
                }
            }
        }

        board.autoXOwners[starKey] = autoXCells
    }

    private func markAutoX(row: Int, col: Int, starKey: String, autoXCells: inout [String]) {
        let cellKey = "\(row),\(col)"
        // Always track ownership so removal logic works when multiple stars block the same cell
        autoXCells.append(cellKey)
        if board.marks[row][col] == .empty {
            board.marks[row][col] = .autoX
        }
    }

    private func removeStar(at coord: GridCoord) {
        board.marks[coord.row][coord.col] = .empty
        let starKey = StarBattleBoard.key(coord)

        // Collect all cells this star marked as autoX
        guard let ownedCells = board.autoXOwners.removeValue(forKey: starKey) else { return }

        // For each cell, remove autoX only if no other star also owns it
        let allOtherOwnedKeys = Set(board.autoXOwners.values.flatMap { $0 })
        for cellKey in ownedCells {
            guard !allOtherOwnedKeys.contains(cellKey),
                  let cell = StarBattleBoard.coord(from: cellKey),
                  board.marks[cell.row][cell.col] == .autoX
            else { continue }
            board.marks[cell.row][cell.col] = .empty
        }
    }

    private func checkSolved(level: StarBattleLevel) {
        let n = level.gridSize
        let stars = board.starCoords
        guard stars.count == n else { return }

        // 1 star per row
        let rows = Set(stars.map { $0.row })
        guard rows.count == n else { return }

        // 1 star per column
        let cols = Set(stars.map { $0.col })
        guard cols.count == n else { return }

        // 1 star per region
        let regions = Set(stars.map { level.regionIndex(row: $0.row, col: $0.col) })
        guard regions.count == n else { return }

        // No adjacency
        for i in 0..<stars.count {
            for j in (i+1)..<stars.count {
                if abs(stars[i].row - stars[j].row) <= 1 && abs(stars[i].col - stars[j].col) <= 1 {
                    return
                }
            }
        }

        // Solved!
        board.isSolved = true
        showSuccess = true
        if let id = currentLevelId {
            StarBattlePersistence.markCompleted(id)
            StarBattlePersistence.clearBoard(levelId: id)
        }
    }

    private func persist() {
        guard let id = currentLevelId, !board.isSolved else { return }
        StarBattlePersistence.saveBoard(board, levelId: id)
    }
}
