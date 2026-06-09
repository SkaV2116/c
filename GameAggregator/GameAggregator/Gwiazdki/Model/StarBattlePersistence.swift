import Foundation

struct StarBattlePersistence {
    private static let completedKey = "gwiazdki.completedLevels"
    private static let boardPrefix = "gwiazdki.board."

    static func markCompleted(_ levelId: Int) {
        var completed = completedLevels()
        completed.insert(levelId)
        let arr = Array(completed).sorted()
        UserDefaults.standard.set(arr, forKey: completedKey)
    }

    static func completedLevels() -> Set<Int> {
        let arr = UserDefaults.standard.array(forKey: completedKey) as? [Int] ?? []
        return Set(arr)
    }

    static func isCompleted(_ levelId: Int) -> Bool {
        completedLevels().contains(levelId)
    }

    static func saveBoard(_ board: StarBattleBoard, levelId: Int) {
        guard let data = try? JSONEncoder().encode(board) else { return }
        UserDefaults.standard.set(data, forKey: boardPrefix + "\(levelId)")
    }

    static func loadBoard(levelId: Int) -> StarBattleBoard? {
        guard let data = UserDefaults.standard.data(forKey: boardPrefix + "\(levelId)"),
              let board = try? JSONDecoder().decode(StarBattleBoard.self, from: data)
        else { return nil }
        return board
    }

    static func clearBoard(levelId: Int) {
        UserDefaults.standard.removeObject(forKey: boardPrefix + "\(levelId)")
    }
}
