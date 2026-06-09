import SwiftUI

struct WyrazKeyboardView: View {
    let letterStates: [Character: TileState]
    let onKey: (String) -> Void
    let onDelete: () -> Void
    let onSubmit: () -> Void

    private let rows: [[String]] = [
        ["Q","W","E","R","T","Y","U","I","O","P"],
        ["A","S","D","F","G","H","J","K","L","Ó"],
        ["ENTER","Z","X","C","V","B","N","M","⌫"],
        ["Ą","Ć","Ę","Ł","Ń","Ś","Ź","Ż"]
    ]

    var body: some View {
        VStack(spacing: 8) {
            ForEach(rows, id: \.self) { row in
                HStack(spacing: 5) {
                    ForEach(row, id: \.self) { key in
                        keyButton(key)
                    }
                }
            }
        }
        .padding(.horizontal, 8)
        .padding(.bottom, 8)
    }

    @ViewBuilder
    private func keyButton(_ key: String) -> some View {
        let isSpecial = key == "ENTER" || key == "⌫"
        let state = keyState(for: key)

        Button {
            switch key {
            case "ENTER": onSubmit()
            case "⌫":    onDelete()
            default:      onKey(key)
            }
        } label: {
            Text(key)
                .font(.system(size: isSpecial ? 11 : 14, weight: .semibold))
                .foregroundColor(.white)
                .frame(width: isSpecial ? 52 : 34, height: 48)
                .background(backgroundColor(for: state, isSpecial: isSpecial))
                .clipShape(RoundedRectangle(cornerRadius: 6))
        }
        .buttonStyle(.plain)
    }

    private func keyState(for key: String) -> TileState? {
        guard key.count == 1 || (key.count == 2 && key != "⌫") else { return nil }
        return letterStates[Character(key)]
    }

    private func backgroundColor(for state: TileState?, isSpecial: Bool) -> Color {
        if isSpecial { return AppTheme.surfaceElevated }
        switch state {
        case .correct: return AppTheme.wyrazCorrect
        case .present: return AppTheme.wyrazPresent
        case .absent:  return AppTheme.wyrazAbsent
        default:       return AppTheme.surfaceElevated
        }
    }
}
