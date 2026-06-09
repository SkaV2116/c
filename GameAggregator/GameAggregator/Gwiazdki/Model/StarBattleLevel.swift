import Foundation

struct StarBattleLevel: Codable, Identifiable {
    let id: Int          // 1-based
    let gridSize: Int    // N (6–12)
    let regions: [Int]   // flat gridSize×gridSize, value = regionIndex 0..(N-1)
                         // access: regions[row * gridSize + col]

    func regionIndex(row: Int, col: Int) -> Int {
        regions[row * gridSize + col]
    }
}

// Compact JSON wrapper
struct LevelBundleFile: Codable {
    let version: Int
    let levels: [StarBattleLevel]
}
