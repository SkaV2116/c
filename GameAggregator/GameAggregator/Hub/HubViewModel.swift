import Foundation

@Observable
@MainActor
final class HubViewModel {
    var wyrazStreak: Int = 0
    var wyrazCompletedToday: Bool = false
    var gwiazdkiProgress: GwiazdkiProgress = GwiazdkiProgress()

    struct GwiazdkiProgress {
        var completedCount: Int = 0
        var lastPlayedLevel: Int? = nil
        let totalCount = 200
    }

    func refresh() {
        refreshWyraz()
        refreshGwiazdki()
    }

    private func refreshWyraz() {
        if let board = WyrazPersistence.load() {
            wyrazCompletedToday = board.gameState != .inProgress
        } else {
            wyrazCompletedToday = false
        }
        wyrazStreak = UserDefaults.standard.integer(forKey: "wyraz.streak")
    }

    private func refreshGwiazdki() {
        let completed = StarBattlePersistence.completedLevels()
        gwiazdkiProgress.completedCount = completed.count
        gwiazdkiProgress.lastPlayedLevel = completed.max()
    }
}
