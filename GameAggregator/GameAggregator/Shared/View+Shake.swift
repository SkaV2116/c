import SwiftUI

struct ShakeEffect: GeometryEffect {
    var amount: CGFloat = 8
    var shakesPerUnit = 3
    var animatableData: CGFloat

    func effectValue(size: CGSize) -> ProjectionTransform {
        let translation = amount * sin(animatableData * .pi * CGFloat(shakesPerUnit))
        return ProjectionTransform(CGAffineTransform(translationX: translation, y: 0))
    }
}

extension View {
    func shake(trigger: Bool) -> some View {
        modifier(ConditionalShake(trigger: trigger))
    }
}

private struct ConditionalShake: ViewModifier {
    var trigger: Bool
    @State private var animValue: CGFloat = 0

    func body(content: Content) -> some View {
        content
            .modifier(ShakeEffect(animatableData: animValue))
            .onChange(of: trigger) { _, newVal in
                guard newVal else { return }
                withAnimation(.easeInOut(duration: 0.4)) {
                    animValue += 1
                }
            }
    }
}
