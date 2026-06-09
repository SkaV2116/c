import Foundation

struct StarBattleGenerator {

    static func generate(gridSize n: Int, id: Int, maxAttempts: Int = 200) -> StarBattleLevel? {
        var rng = SystemRandomNumberGenerator()
        for _ in 0..<maxAttempts {
            guard let stars = placeStars(n: n, rng: &rng) else { continue }
            guard let regions = growRegions(n: n, stars: stars, rng: &rng) else { continue }
            let candidate = StarBattleLevel(id: id, gridSize: n, regions: regions)
            let result = StarBattleSolver.solve(candidate, stopAfter: 2)
            if result.isUnique { return candidate }
        }
        return nil
    }

    // MARK: – Star placement (one per row, backtracking)

    private static func placeStars<R: RandomNumberGenerator>(n: Int, rng: inout R) -> [GridCoord]? {
        var stars: [GridCoord] = []
        var usedCols = Set<Int>()
        var blocked = Set<GridCoord>()

        func backtrack(row: Int) -> Bool {
            if row == n { return stars.count == n }
            let cols = Array(0..<n).shuffled(using: &rng)
            for col in cols {
                let c = GridCoord(row: row, col: col)
                guard !usedCols.contains(col), !blocked.contains(c) else { continue }
                // Adjacency check with previous stars
                let adjacent = stars.contains { abs($0.row - row) <= 1 && abs($0.col - col) <= 1 }
                guard !adjacent else { continue }

                // Place
                stars.append(c)
                usedCols.insert(col)
                var newBlocked: [GridCoord] = []
                for dr in -1...1 {
                    for dc in -1...1 {
                        let nr = row + dr; let nc = col + dc
                        guard nr >= 0, nr < n, nc >= 0, nc < n else { continue }
                        let nb = GridCoord(row: nr, col: nc)
                        if blocked.insert(nb).inserted { newBlocked.append(nb) }
                    }
                }

                if backtrack(row: row + 1) { return true }

                stars.removeLast()
                usedCols.remove(col)
                newBlocked.forEach { blocked.remove($0) }
            }
            return false
        }

        return backtrack(row: 0) ? stars : nil
    }

    // MARK: – Region growing (territory expansion, BFS-style)

    private static func growRegions<R: RandomNumberGenerator>(n: Int, stars: [GridCoord], rng: inout R) -> [Int]? {
        var map = Array(repeating: -1, count: n * n)
        for (idx, star) in stars.enumerated() {
            map[star.row * n + star.col] = idx
        }
        var assigned = stars.count

        while assigned < n * n {
            // Collect all expansion candidates: (unassigned cell, region of an adjacent assigned cell)
            var candidates: [(GridCoord, Int)] = []
            for row in 0..<n {
                for col in 0..<n {
                    guard map[row * n + col] == -1 else { continue }
                    for (nr, nc) in neighbors4(row, col, n: n) {
                        let reg = map[nr * n + nc]
                        if reg >= 0 {
                            candidates.append((GridCoord(row: row, col: col), reg))
                            break
                        }
                    }
                }
            }
            guard !candidates.isEmpty else { return nil }

            // Pick a random candidate (bias toward smaller regions for balance)
            let regionSizes = (0..<n).map { r in map.filter { $0 == r }.count }
            let weighted = candidates.sorted { regionSizes[$0.1] < regionSizes[$1.1] }
            // Take from the front (smaller regions get priority) with some randomness
            let pick = Int.random(in: 0..<min(candidates.count, max(1, candidates.count / 2 + 1)), using: &rng)
            let chosen = weighted[pick]
            map[chosen.0.row * n + chosen.0.col] = chosen.1
            assigned += 1
        }

        return map
    }

    private static func neighbors4(_ row: Int, _ col: Int, n: Int) -> [(Int, Int)] {
        [(-1,0),(1,0),(0,-1),(0,1)].compactMap { (dr, dc) in
            let nr = row + dr; let nc = col + dc
            return (nr >= 0 && nr < n && nc >= 0 && nc < n) ? (nr, nc) : nil
        }
    }
}
