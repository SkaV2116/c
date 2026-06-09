import SwiftUI

struct WyrazBoardView: View {
    let board: WyrazBoard
    let shakeTrigger: Bool
    let flipRow: Int?

    var body: some View {
        GeometryReader { geo in
            let tileSize = min((geo.size.width - 48) / 5, (geo.size.height - 40) / 6)
            VStack(spacing: 6) {
                ForEach(0..<6, id: \.self) { row in
                    rowView(row: row, tileSize: tileSize)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    @ViewBuilder
    private func rowView(row: Int, tileSize: CGFloat) -> some View {
        HStack(spacing: 6) {
            ForEach(0..<5, id: \.self) { col in
                WyrazTileView(
                    tile: board.rows[row][col],
                    size: tileSize,
                    flipDelay: Double(col) * 0.1
                )
            }
        }
        .shake(trigger: shakeTrigger && row == board.currentRow)
    }
}
