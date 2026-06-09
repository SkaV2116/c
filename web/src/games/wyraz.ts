import { SOLUTIONS, VALID_WORDS } from '../data/words'

export type TileState = 'empty' | 'typed' | 'correct' | 'present' | 'absent'
export interface Tile { letter: string; state: TileState }
export type GameState = 'playing' | 'won' | 'lost'

export interface WyrazBoard {
  rows: Tile[][]
  currentRow: number
  currentCol: number
  gameState: GameState
  dateKey: string
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export function todaysSolution(): string {
  const ref = new Date('2024-01-01').getTime()
  const now = new Date().setHours(0,0,0,0)
  const days = Math.floor((now - ref) / 86400000)
  return SOLUTIONS[Math.abs(days) % SOLUTIONS.length]
}

export function freshBoard(): WyrazBoard {
  return {
    rows: Array.from({ length: 6 }, () =>
      Array.from({ length: 5 }, () => ({ letter: '', state: 'empty' as TileState }))
    ),
    currentRow: 0, currentCol: 0, gameState: 'playing', dateKey: todayKey()
  }
}

export function isValidWord(word: string): boolean {
  return VALID_WORDS.has(word.toUpperCase())
}

export function evaluateGuess(guess: string, solution: string): TileState[] {
  const g = Array.from(guess.toUpperCase())
  const s = Array.from(solution.toUpperCase())
  const states: TileState[] = Array(5).fill('absent')
  const remaining: Record<string, number> = {}

  // First pass: greens
  for (let i = 0; i < 5; i++) {
    if (g[i] === s[i]) {
      states[i] = 'correct'
    } else {
      remaining[s[i]] = (remaining[s[i]] ?? 0) + 1
    }
  }
  // Second pass: yellows
  for (let i = 0; i < 5; i++) {
    if (states[i] === 'correct') continue
    if (remaining[g[i]]) {
      states[i] = 'present'
      remaining[g[i]]--
    }
  }
  return states
}

const STORAGE_KEY = 'wyraz_board'
const STREAK_KEY = 'wyraz_streak'
const LAST_WIN_KEY = 'wyraz_lastwin'

export function loadBoard(): WyrazBoard | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const board: WyrazBoard = JSON.parse(raw)
    if (board.dateKey !== todayKey()) return null
    return board
  } catch { return null }
}

export function saveBoard(board: WyrazBoard) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(board))
}

export function loadStreak(): number {
  return parseInt(localStorage.getItem(STREAK_KEY) ?? '0', 10)
}

export function updateStreak(won: boolean) {
  if (!won) return
  const today = todayKey()
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const lastWin = localStorage.getItem(LAST_WIN_KEY) ?? ''
  const cur = loadStreak()
  const newStreak = (lastWin === yesterday || lastWin === today) ? cur + 1 : 1
  localStorage.setItem(STREAK_KEY, String(newStreak))
  localStorage.setItem(LAST_WIN_KEY, today)
}
