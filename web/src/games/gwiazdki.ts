export interface Level { id: number; gridSize: number; regions: number[] }

export type CellMark = 'empty' | 'star' | 'autoX' | 'manualX'

export interface BoardState {
  marks: CellMark[][]
  // star coord string "r,c" -> list of cell strings it auto-blocked
  autoXOwners: Record<string, string[]>
  isSolved: boolean
  moveCount: number
}

export function emptyBoard(size: number): BoardState {
  return {
    marks: Array.from({ length: size }, () => Array(size).fill('empty')),
    autoXOwners: {},
    isSolved: false,
    moveCount: 0,
  }
}

function key(r: number, c: number) { return `${r},${c}` }

export function placeStar(board: BoardState, row: number, col: number, size: number): BoardState {
  const b = deepClone(board)
  b.marks[row][col] = 'star'
  const starKey = key(row, col)
  const owned: string[] = []

  const markAutoX = (r: number, c: number) => {
    const k = key(r, c)
    owned.push(k)
    if (b.marks[r][c] === 'empty') b.marks[r][c] = 'autoX'
  }

  for (let c = 0; c < size; c++) if (c !== col) markAutoX(row, c)
  for (let r = 0; r < size; r++) if (r !== row) markAutoX(r, col)
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (dr === 0 && dc === 0) continue
    const nr = row + dr, nc = col + dc
    if (nr >= 0 && nr < size && nc >= 0 && nc < size) markAutoX(nr, nc)
  }

  b.autoXOwners[starKey] = owned
  return b
}

export function removeStar(board: BoardState, row: number, col: number): BoardState {
  const b = deepClone(board)
  b.marks[row][col] = 'empty'
  const starKey = key(row, col)
  const owned = b.autoXOwners[starKey] ?? []
  delete b.autoXOwners[starKey]

  const otherOwned = new Set(Object.values(b.autoXOwners).flat())
  for (const k of owned) {
    if (otherOwned.has(k)) continue
    const [r, c] = k.split(',').map(Number)
    if (b.marks[r][c] === 'autoX') b.marks[r][c] = 'empty'
  }
  return b
}

export function toggleManualX(board: BoardState, row: number, col: number): BoardState {
  const b = deepClone(board)
  b.marks[row][col] = b.marks[row][col] === 'manualX' ? 'empty' : 'manualX'
  return b
}

export function checkSolved(board: BoardState, level: Level): boolean {
  const n = level.gridSize
  const stars: [number, number][] = []
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (board.marks[r][c] === 'star') stars.push([r, c])

  if (stars.length !== n) return false
  if (new Set(stars.map(([r]) => r)).size !== n) return false
  if (new Set(stars.map(([, c]) => c)).size !== n) return false
  if (new Set(stars.map(([r, c]) => level.regions[r * n + c])).size !== n) return false

  for (let i = 0; i < stars.length; i++)
    for (let j = i + 1; j < stars.length; j++)
      if (Math.abs(stars[i][0] - stars[j][0]) <= 1 && Math.abs(stars[i][1] - stars[j][1]) <= 1)
        return false

  return true
}

const COMPLETED_KEY = 'gwiazdki_completed'
const BOARD_PREFIX = 'gwiazdki_board_'

export function loadCompleted(): Set<number> {
  try {
    return new Set(JSON.parse(localStorage.getItem(COMPLETED_KEY) ?? '[]'))
  } catch { return new Set() }
}

export function markCompleted(id: number) {
  const s = loadCompleted()
  s.add(id)
  localStorage.setItem(COMPLETED_KEY, JSON.stringify([...s]))
}

export function saveBoardState(id: number, board: BoardState) {
  localStorage.setItem(BOARD_PREFIX + id, JSON.stringify(board))
}

export function loadBoardState(id: number): BoardState | null {
  try {
    const raw = localStorage.getItem(BOARD_PREFIX + id)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function clearBoardState(id: number) {
  localStorage.removeItem(BOARD_PREFIX + id)
}

function deepClone<T>(v: T): T { return JSON.parse(JSON.stringify(v)) }

// ── Timer persistence ──────────────────────────────────────────────────────
const TIMES_KEY = 'gwiazdki_times'

function loadAllTimes(): Record<number, number> {
  try { return JSON.parse(localStorage.getItem(TIMES_KEY) ?? '{}') }
  catch { return {} }
}

export function saveLevelTime(id: number, seconds: number) {
  const times = loadAllTimes()
  if (times[id] === undefined || seconds < times[id]) {
    times[id] = seconds
    localStorage.setItem(TIMES_KEY, JSON.stringify(times))
  }
}

export function loadLevelTime(id: number): number | null {
  return loadAllTimes()[id] ?? null
}

export function loadAllLevelTimes(): Record<number, number> {
  return loadAllTimes()
}

export function formatTime(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
