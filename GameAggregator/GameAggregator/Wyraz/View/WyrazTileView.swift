import SwiftUI

struct WyrazTileView: View {
    let tile: WyrazTile
    let size: CGFloat
    var flipDelay: Double = 0

    @State private var scaleY: CGFloat = 1
    @State private var displayedState: TileState = .empty

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 4)
                .fill(backgroundColor)
                .overlay(
                    RoundedRectangle(cornerRadius: 4)
                        .stroke(borderColor, lineWidth: displayedState == .typed ? 2 : 1)
                )

            Text(tile.display)
                .font(.system(size: size * 0.48, weight: .bold))
                .foregroundColor(textColor)
        }
        .frame(width: size, height: size)
        .scaleEffect(x: 1, y: scaleY)
        .onChange(of: tile.state) { _, newState in
            guard newState == .correct || newState == .present || newState == .absent else {
                displayedState = newState
                return
            }
            Task { @MainActor in
                try? await Task.sleep(for: .seconds(flipDelay))
                // First half: scale down
                withAnimation(.easeIn(duration: 0.15)) { scaleY = 0 }
                try? await Task.sleep(for: .milliseconds(160))
                // Swap color at midpoint
                displayedState = newState
                // Second half: scale up
                withAnimation(.easeOut(duration: 0.15)) { scaleY = 1 }
            }
        }
        .onAppear { displayedState = tile.state }
    }

    private var backgroundColor: Color {
        switch displayedState {
        case .empty:   return AppTheme.wyrazEmpty
        case .typed:   return AppTheme.wyrazTyped
        case .correct: return AppTheme.wyrazCorrect
        case .present: return AppTheme.wyrazPresent
        case .absent:  return AppTheme.wyrazAbsent
        }
    }

    private var borderColor: Color {
        switch displayedState {
        case .empty:   return AppTheme.wyrazBorder
        case .typed:   return AppTheme.wyrazTypedBorder
        default:       return Color.clear
        }
    }

    private var textColor: Color {
        switch displayedState {
        case .empty: return Color.clear
        case .typed: return AppTheme.textPrimary
        default:     return .white
        }
    }
}
