export type Mark = 'X' | 'O' | ''
export type GameResult = 'X' | 'O' | 'draw' | null

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
]

export function emptyBoard(): Mark[] {
  return ['', '', '', '', '', '', '', '', '']
}

export function checkWinner(board: Mark[]): GameResult {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as 'X' | 'O'
    }
  }
  if (board.every(cell => cell !== '')) return 'draw'
  return null
}

function getEmptyCells(board: Mark[]): number[] {
  return board.reduce<number[]>((acc, cell, i) => {
    if (cell === '') acc.push(i)
    return acc
  }, [])
}

function minimax(board: Mark[], isMaximizing: boolean, aiMark: Mark, humanMark: Mark): number {
  const result = checkWinner(board)
  if (result === aiMark) return 10
  if (result === humanMark) return -10
  if (result === 'draw') return 0

  const emptyCells = getEmptyCells(board)
  if (emptyCells.length === 0) return 0

  if (isMaximizing) {
    let best = -Infinity
    for (const idx of emptyCells) {
      board[idx] = aiMark
      best = Math.max(best, minimax(board, false, aiMark, humanMark))
      board[idx] = ''
    }
    return best
  } else {
    let best = Infinity
    for (const idx of emptyCells) {
      board[idx] = humanMark
      best = Math.min(best, minimax(board, true, aiMark, humanMark))
      board[idx] = ''
    }
    return best
  }
}

export function getAIMove(board: Mark[], aiMark: Mark, difficulty: 'easy' | 'hard'): number {
  const emptyCells = getEmptyCells(board)
  if (emptyCells.length === 0) return -1

  if (difficulty === 'easy') {
    return emptyCells[Math.floor(Math.random() * emptyCells.length)]
  }

  // hard: minimax
  const humanMark: Mark = aiMark === 'X' ? 'O' : 'X'
  let bestScore = -Infinity
  let bestMove = emptyCells[0]

  for (const idx of emptyCells) {
    board[idx] = aiMark
    const score = minimax(board, false, aiMark, humanMark)
    board[idx] = ''
    if (score > bestScore) {
      bestScore = score
      bestMove = idx
    }
  }

  return bestMove
}
