import Foundation

final class LevelBundle {
    static let shared = LevelBundle()

    private(set) var levels: [StarBattleLevel] = []

    private init() {
        loadLevels()
    }

    func level(_ id: Int) -> StarBattleLevel? {
        guard id >= 1, id <= levels.count else { return nil }
        return levels[id - 1]
    }

    private func loadLevels() {
        // First try to load from bundle JSON
        if let url = Bundle.main.url(forResource: "gwiazdki_levels", withExtension: "json"),
           let data = try? Data(contentsOf: url),
           let bundle = try? JSONDecoder().decode(LevelBundleFile.self, from: data),
           !bundle.levels.isEmpty {
            levels = bundle.levels.sorted { $0.id < $1.id }
            return
        }
        // Fallback: use embedded levels
        levels = EmbeddedLevels.all
    }
}
