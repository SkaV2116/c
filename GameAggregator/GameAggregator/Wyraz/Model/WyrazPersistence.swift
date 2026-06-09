import Foundation

struct WyrazPersistence {
    private static let boardKey = "wyraz.boardState"
    private static let streakKey = "wyraz.streak"
    private static let lastWinKey = "wyraz.lastWinDate"

    static func save(_ board: WyrazBoard) {
        guard let data = try? JSONEncoder().encode(board) else { return }
        UserDefaults.standard.set(data, forKey: boardKey)
    }

    static func load() -> WyrazBoard? {
        guard let data = UserDefaults.standard.data(forKey: boardKey),
              let board = try? JSONDecoder().decode(WyrazBoard.self, from: data)
        else { return nil }

        // Discard stale save
        guard board.dateKey == WyrazBoard.todayKey() else { return nil }
        return board
    }

    static func incrementStreak(won: Bool) {
        let today = WyrazBoard.todayKey()
        let lastWin = UserDefaults.standard.string(forKey: lastWinKey) ?? ""

        if won {
            let yesterday = yesterdayKey()
            let current = UserDefaults.standard.integer(forKey: streakKey)
            let newStreak = (lastWin == yesterday || lastWin == today) ? current + 1 : 1
            UserDefaults.standard.set(newStreak, forKey: streakKey)
            UserDefaults.standard.set(today, forKey: lastWinKey)
        } else {
            // Lost — don't reset streak until next day
        }
    }

    private static func yesterdayKey() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: Date())!
        return formatter.string(from: yesterday)
    }
}
