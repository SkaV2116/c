import SwiftUI

@main
struct GameAggregatorApp: App {
    @State private var router = AppRouter()

    var body: some Scene {
        WindowGroup {
            NavigationStack(path: $router.path) {
                HubView()
                    .navigationDestination(for: AppDestination.self) { destination in
                        switch destination {
                        case .wyraz:
                            WyrazView()
                        case .gwiazdki:
                            LevelSelectView()
                        case .gwiazdkiLevel(let id):
                            GwiazdkiView(levelId: id)
                        }
                    }
            }
            .environment(router)
            .preferredColorScheme(.dark)
        }
    }
}
