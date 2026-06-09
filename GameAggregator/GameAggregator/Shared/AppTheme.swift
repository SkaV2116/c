import SwiftUI

enum AppTheme {
    // MARK: - Background
    static let background = Color(red: 0.11, green: 0.11, blue: 0.12)
    static let surface = Color(red: 0.17, green: 0.17, blue: 0.18)
    static let surfaceElevated = Color(red: 0.22, green: 0.22, blue: 0.23)

    // MARK: - Wyraz tile colors
    static let wyrazCorrect   = Color(red: 0.325, green: 0.553, blue: 0.306)  // zielony
    static let wyrazPresent   = Color(red: 0.714, green: 0.624, blue: 0.231)  // żółty
    static let wyrazAbsent    = Color(red: 0.227, green: 0.227, blue: 0.235)  // szary
    static let wyrazEmpty     = Color(red: 0.15,  green: 0.15,  blue: 0.16)
    static let wyrazTyped     = Color(red: 0.22,  green: 0.22,  blue: 0.23)
    static let wyrazBorder    = Color(red: 0.35,  green: 0.35,  blue: 0.36)
    static let wyrazTypedBorder = Color(red: 0.55, green: 0.55, blue: 0.56)

    // MARK: - Gwiazdki region colors (12 distinct colors)
    static let regionColors: [Color] = [
        Color(red: 0.95, green: 0.60, blue: 0.60),  // 0 – coral
        Color(red: 0.60, green: 0.85, blue: 0.65),  // 1 – mint
        Color(red: 0.60, green: 0.75, blue: 0.95),  // 2 – sky
        Color(red: 0.95, green: 0.85, blue: 0.55),  // 3 – yellow
        Color(red: 0.85, green: 0.65, blue: 0.95),  // 4 – lavender
        Color(red: 0.95, green: 0.75, blue: 0.55),  // 5 – peach
        Color(red: 0.55, green: 0.90, blue: 0.90),  // 6 – cyan
        Color(red: 0.90, green: 0.75, blue: 0.85),  // 7 – pink
        Color(red: 0.75, green: 0.90, blue: 0.55),  // 8 – lime
        Color(red: 0.70, green: 0.80, blue: 0.95),  // 9 – periwinkle
        Color(red: 0.95, green: 0.70, blue: 0.80),  // 10 – rose
        Color(red: 0.80, green: 0.95, blue: 0.75),  // 11 – sage
    ]

    static func regionColor(_ index: Int) -> Color {
        regionColors[index % regionColors.count]
    }

    // MARK: - Text
    static let textPrimary   = Color.white
    static let textSecondary = Color(white: 0.65)
    static let textDisabled  = Color(white: 0.40)

    // MARK: - Fonts
    static func tileFont(size: CGFloat) -> Font { .system(size: size, weight: .bold) }
    static let titleFont: Font = .system(size: 28, weight: .bold, design: .rounded)
    static let subtitleFont: Font = .system(size: 16, weight: .medium)
    static let bodyFont: Font = .system(size: 15, weight: .regular)
}
