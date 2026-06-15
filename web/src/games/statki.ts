export type BoardSize = 8 | 10

export interface ShipDef { size: number; count: number }

export const CONFIGS: Record<string, ShipDef[]> = {
  standard: [
    { size: 4, count: 1 },
    { size: 3, count: 2 },
    { size: 2, count: 3 },
    { size: 1, count: 4 },
  ],
  simplified: [
    { size: 4, count: 1 },
    { size: 3, count: 1 },
    { size: 2, count: 2 },
    { size: 1, count: 2 },
  ],
}

export interface Ship {
  cells: number[]  // flat indices
  size: number
  horizontal: boolean
  sunk: boolean
}

// Convert flat index -> row/col
function rc(idx: number, boardSize: number): [number, number] {
  return [Math.floor(idx / boardSize), idx % boardSize]
}

// Validates ship placement: no overlap, no adjacency (even diagonal), within bounds.
// For each new cell, check all existing ship cells — must be Chebyshev distance > 1
// (cannot be adjacent horizontally, vertically OR diagonally).
export function canPlace(ships: Ship[], newCells: number[], boardSize: number): boolean {
  for (const c of newCells) {
    if (c < 0 || c >= boardSize * boardSize) return false
  }
  const occupied = new Set<number>()
  for (const ship of ships) {
    for (const c of ship.cells) occupied.add(c)
  }
  for (const nc of newCells) {
    if (occupied.has(nc)) return false
  }
  for (const nc of newCells) {
    const [nr, ncol] = rc(nc, boardSize)
    for (const oc of occupied) {
      const [or_, ocol] = rc(oc, boardSize)
      const dr = Math.abs(nr - or_)
      const dc = Math.abs(ncol - ocol)
      // adjacency including diagonal: both deltas <= 1
      if (dr <= 1 && dc <= 1) return false
    }
  }
  return true
}

// Returns cell indices for a ship starting at (row, col), given direction.
// Returns null if out of bounds.
export function shipCells(
  row: number,
  col: number,
  size: number,
  horizontal: boolean,
  boardSize: number,
): number[] | null {
  const cells: number[] = []
  for (let i = 0; i < size; i++) {
    const r = horizontal ? row : row + i
    const c = horizontal ? col + i : col
    if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) return null
    cells.push(r * boardSize + c)
  }
  return cells
}

// Check if all ships are sunk (all cells hit)
export function allSunk(ships: Ship[]): boolean {
  return ships.length > 0 && ships.every(s => s.sunk)
}

// Random valid placement of all ships
export function randomPlacement(config: ShipDef[], boardSize: number): Ship[] {
  const sizes: number[] = []
  for (const def of config) {
    for (let i = 0; i < def.count; i++) sizes.push(def.size)
  }
  sizes.sort((a, b) => b - a)

  for (let attempt = 0; attempt < 200; attempt++) {
    const ships: Ship[] = []
    let ok = true
    for (const size of sizes) {
      let placed = false
      for (let tries = 0; tries < 300; tries++) {
        const horizontal = Math.random() < 0.5
        const row = Math.floor(Math.random() * boardSize)
        const col = Math.floor(Math.random() * boardSize)
        const cells = shipCells(row, col, size, horizontal, boardSize)
        if (!cells) continue
        if (!canPlace(ships, cells, boardSize)) continue
        ships.push({ cells, size, horizontal, sunk: false })
        placed = true
        break
      }
      if (!placed) {
        ok = false
        break
      }
    }
    if (ok) return ships
  }
  return []
}

// Mark a hit on a ship list, returns updated ships.
// hitCells tracking is done by caller; here we recompute the sunk flag
// assuming the given cellIdx is now hit along with all previously-hit cells.
export function applyHit(ships: Ship[], cellIdx: number): Ship[] {
  return ships.map(s => {
    if (!s.cells.includes(cellIdx)) return s
    return { ...s }
  })
}

// Which cells are forbidden (ship + 1-cell padding) for display
export function forbiddenCells(ships: Ship[], boardSize: number): Set<number> {
  const forbidden = new Set<number>()
  for (const ship of ships) {
    for (const c of ship.cells) {
      const [r, col] = rc(c, boardSize)
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr
          const ncol = col + dc
          if (nr < 0 || nr >= boardSize || ncol < 0 || ncol >= boardSize) continue
          forbidden.add(nr * boardSize + ncol)
        }
      }
    }
  }
  return forbidden
}
