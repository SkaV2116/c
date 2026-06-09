import SwiftUI

struct LevelGridView: View {
    @Environment(GwiazdkiViewModel.self) private var vm
    let level: StarBattleLevel

    var body: some View {
        GeometryReader { geo in
            let size = min(geo.size.width, geo.size.height)
            let cellSize = size / CGFloat(level.gridSize)
            let n = level.gridSize

            ZStack(alignment: .topLeading) {
                // Canvas renders region fills + border lines (static relative to region map)
                Canvas { ctx, _ in
                    drawBackground(ctx: ctx, size: size, cellSize: cellSize, n: n)
                }
                .frame(width: size, height: size)

                // Interactive overlay: marks + tap/longpress handlers
                VStack(spacing: 0) {
                    ForEach(0..<n, id: \.self) { row in
                        HStack(spacing: 0) {
                            ForEach(0..<n, id: \.self) { col in
                                CellOverlayView(
                                    mark: vm.board.marks[row][col],
                                    cellSize: cellSize
                                )
                                .contentShape(Rectangle())
                                .onTapGesture { vm.cellTapped(row: row, col: col) }
                                .onLongPressGesture(minimumDuration: 0.45) {
                                    vm.cellLongPressed(row: row, col: col)
                                }
                            }
                        }
                    }
                }
                .frame(width: size, height: size)
            }
            .frame(width: size, height: size)
        }
        .aspectRatio(1, contentMode: .fit)
    }

    private func drawBackground(ctx: GraphicsContext, size: CGFloat, cellSize: CGFloat, n: Int) {
        // Region fills
        for row in 0..<n {
            for col in 0..<n {
                let regionIdx = level.regionIndex(row: row, col: col)
                let color = AppTheme.regionColor(regionIdx)
                let rect = CGRect(x: CGFloat(col) * cellSize, y: CGFloat(row) * cellSize,
                                  width: cellSize, height: cellSize)
                ctx.fill(Path(rect), with: .color(color.opacity(0.45)))
            }
        }

        // Thin inner grid lines
        var innerPath = Path()
        for i in 1..<n {
            let x = CGFloat(i) * cellSize
            let y = CGFloat(i) * cellSize
            innerPath.move(to: CGPoint(x: x, y: 0))
            innerPath.addLine(to: CGPoint(x: x, y: size))
            innerPath.move(to: CGPoint(x: 0, y: y))
            innerPath.addLine(to: CGPoint(x: size, y: y))
        }
        ctx.stroke(innerPath, with: .color(.white.opacity(0.12)), lineWidth: 0.5)

        // Thick border between different regions
        var thickPath = Path()
        for row in 0..<n {
            for col in 0..<n {
                let r = level.regionIndex(row: row, col: col)
                if col + 1 < n, level.regionIndex(row: row, col: col + 1) != r {
                    let x = CGFloat(col + 1) * cellSize
                    thickPath.move(to: CGPoint(x: x, y: CGFloat(row) * cellSize))
                    thickPath.addLine(to: CGPoint(x: x, y: CGFloat(row + 1) * cellSize))
                }
                if row + 1 < n, level.regionIndex(row: row + 1, col: col) != r {
                    let y = CGFloat(row + 1) * cellSize
                    thickPath.move(to: CGPoint(x: CGFloat(col) * cellSize, y: y))
                    thickPath.addLine(to: CGPoint(x: CGFloat(col + 1) * cellSize, y: y))
                }
            }
        }
        ctx.stroke(thickPath, with: .color(.white.opacity(0.75)), lineWidth: 2.5)

        // Outer border
        let outerRect = CGRect(x: 0, y: 0, width: size, height: size)
        ctx.stroke(Path(outerRect), with: .color(.white.opacity(0.7)), lineWidth: 2)
    }
}

struct CellOverlayView: View {
    let mark: CellMark
    let cellSize: CGFloat

    var body: some View {
        ZStack {
            Color.clear
            markView
        }
        .frame(width: cellSize, height: cellSize)
    }

    @ViewBuilder
    private var markView: some View {
        switch mark {
        case .empty:
            EmptyView()
        case .star:
            Image(systemName: "star.fill")
                .font(.system(size: cellSize * 0.48, weight: .regular))
                .foregroundStyle(.yellow)
                .shadow(color: .orange.opacity(0.7), radius: 3, x: 0, y: 1)
        case .autoX:
            Image(systemName: "xmark")
                .font(.system(size: cellSize * 0.32, weight: .light))
                .foregroundStyle(.white.opacity(0.4))
        case .manualX:
            Image(systemName: "xmark")
                .font(.system(size: cellSize * 0.32, weight: .semibold))
                .foregroundStyle(.white.opacity(0.65))
        }
    }
}
