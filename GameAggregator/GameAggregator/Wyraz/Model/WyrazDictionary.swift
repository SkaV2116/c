import Foundation

final class WyrazDictionary {
    static let shared = WyrazDictionary()

    private let validWords: Set<String>
    let solutions: [String]

    private init() {
        func loadLines(_ filename: String) -> [String] {
            guard let url = Bundle.main.url(forResource: filename, withExtension: "txt"),
                  let content = try? String(contentsOf: url, encoding: .utf8)
            else { return [] }
            return content.components(separatedBy: .newlines)
                .map { $0.trimmingCharacters(in: .whitespaces).uppercased() }
                .filter { $0.count == 5 }
        }

        solutions = loadLines("wyraz_solutions")
        let allWords = loadLines("wyraz_words")
        validWords = Set(allWords + solutions)
    }

    func isValid(_ word: String) -> Bool {
        validWords.contains(word.uppercased())
    }

    func todaysSolution() -> String {
        WyrazGame.solution(for: Date(), wordList: solutions)
    }
}
