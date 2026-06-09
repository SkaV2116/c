import SwiftUI

struct GameCardView: View {
    let title: String
    let subtitle: String
    let description: String
    let accentColor: Color
    let icon: String
    let badge: String?
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                iconView
                textStack
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(AppTheme.textDisabled)
            }
            .padding(20)
            .background(AppTheme.surface)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(accentColor.opacity(0.3), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    private var iconView: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 12)
                .fill(accentColor.opacity(0.15))
                .frame(width: 52, height: 52)
            Image(systemName: icon)
                .font(.system(size: 22, weight: .semibold))
                .foregroundColor(accentColor)
        }
    }

    private var textStack: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 8) {
                Text(title)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(AppTheme.textPrimary)
                if let badge {
                    Text(badge)
                        .font(.system(size: 12, weight: .semibold))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(accentColor.opacity(0.2))
                        .foregroundColor(accentColor)
                        .clipShape(Capsule())
                }
            }
            Text(subtitle)
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(accentColor)
            Text(description)
                .font(.system(size: 13))
                .foregroundColor(AppTheme.textSecondary)
        }
    }
}
