import SwiftUI

enum AppDestination: Hashable {
    case wyraz
    case gwiazdki
    case gwiazdkiLevel(Int)
}

@Observable
final class AppRouter {
    var path: NavigationPath = NavigationPath()

    func navigate(to destination: AppDestination) {
        path.append(destination)
    }

    func popToRoot() {
        path.removeLast(path.count)
    }
}
