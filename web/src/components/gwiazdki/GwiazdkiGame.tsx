import { useState, useCallback, useRef, useEffect } from 'react'
import type { Level, BoardState, CellMark } from '../../games/gwiazdki'
import {
  emptyBoard, placeStar, removeStar, checkSolved,
  markCompleted, saveBoardState, loadBoardState, clearBoardState,
  saveLevelTime, loadLevelTime, formatTime
} from '../../games/gwiazdki'
import levelsData from '../../data/gwiazdki_levels.json'

const allLevels: Level[] = (levelsData as { levels: Level[] }).levels

const REGION_COLORS = [
  '#e08080','#80cc90','#80b0e8','#e8d878',
  '#c090e8','#e8c080','#70d8d8','#e8b0c8',
  '#a8d868','#a0b8e8','#e880a0','#b0e8a0',
]

interface Props {
  levelId: number
  onBack: () => void
  onMenu: () => void
}

export default function GwiazdkiGame({ levelId, onBack, onMenu }: Props) {
  const level = allLevels.find(l => l.id === levelId)!
  const [board, setBoard] = useState<BoardState>(() => loadBoardState(levelId) ?? emptyBoard(level.gridSize))
  const [elapsed, setElapsed] = useState(0)
  const elapsedRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const n = level.gridSize
  const boardSize = Math.min(window.innerWidth - 28, window.innerHeight - 180)
  const cellSize = boardSize / n

  // Start timer when level loads, reset between levels
  useEffect(() => {
    elapsedRef.current = 0
    setElapsed(0)
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1
      setElapsed(elapsedRef.current)
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [levelId])

  // Stop timer and save when solved
  useEffect(() => {
    if (board.isSolved) {
      if (timerRef.current) clearInterval(timerRef.current)
      saveLevelTime(levelId, elapsedRef.current)
    }
  }, [board.isSolved, levelId])

  // Tap cycle: empty → manualX → star → empty
  const handleTap = useCallback((row: number, col: number) => {
    setBoard(b => {
      if (b.isSolved) return b
      const mark: CellMark = b.marks[row][col]

      if (mark === 'autoX') return b  // auto-X can't be tapped

      let nb: BoardState
      if (mark === 'empty') {
        // empty → manualX
        const clone = JSON.parse(JSON.stringify(b)) as BoardState
        clone.marks[row][col] = 'manualX'
        saveBoardState(levelId, clone)
        return clone
      } else if (mark === 'manualX') {
        // manualX → star (with auto-X propagation)
        nb = placeStar(b, row, col, n)
        nb.moveCount++
        const solved = checkSolved(nb, level)
        if (solved) {
          nb = { ...nb, isSolved: true }
          markCompleted(levelId)
          clearBoardState(levelId)
          return nb
        }
        saveBoardState(levelId, nb)
        return nb
      } else {
        // star → empty (remove star and its auto-X)
        nb = removeStar(b, row, col)
        nb.moveCount++
        saveBoardState(levelId, nb)
        return nb
      }
    })
  }, [n, level, levelId])

  const reset = () => {
    clearBoardState(levelId)
    elapsedRef.current = 0
    setElapsed(0)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1
      setElapsed(elapsedRef.current)
    }, 1000)
    setBoard(emptyBoard(n))
  }

  const getCellBorders = (row: number, col: number) => {
    const reg = level.regions[row * n + col]
    const top    = row > 0 && level.regions[(row-1)*n + col] !== reg
    const bottom = row < n-1 && level.regions[(row+1)*n + col] !== reg
    const left   = col > 0 && level.regions[row*n + col-1] !== reg
    const right  = col < n-1 && level.regions[row*n + col+1] !== reg
    return {
      borderTop:    `${top ? 2.5 : 0.5}px solid ${top ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.12)'}`,
      borderBottom: `${bottom ? 2.5 : 0.5}px solid ${bottom ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.12)'}`,
      borderLeft:   `${left ? 2.5 : 0.5}px solid ${left ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.12)'}`,
      borderRight:  `${right ? 2.5 : 0.5}px solid ${right ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.12)'}`,
    }
  }

  const markContent = (mark: CellMark) => {
    if (mark === 'star') return <span className="cell-star">⭐</span>
    if (mark === 'autoX') return <span className="cell-x-auto">✕</span>
    if (mark === 'manualX') return <span className="cell-x-manual">✕</span>
    return null
  }

  const bestTime = board.isSolved ? loadLevelTime(levelId) : null

  return (
    <div className="screen gwiazdki-game">
      <div className="navbar">
        <button className="btn-back" onClick={onBack}>‹</button>
        <span className="navbar-title">GWIAZDKI</span>
        <button className="btn-back" onClick={reset}>↺</button>
      </div>

      <div className="gwiazdki-info">
        <span>Poziom {level.id}</span>
        <span>Plansza {n}×{n}</span>
        <span className="gwiazdki-timer">⏱ {formatTime(elapsed)}</span>
      </div>

      <div className="gwiazdki-board-wrap">
        <div
          className="gwiazdki-grid"
          style={{
            width: boardSize, height: boardSize,
            gridTemplateColumns: `repeat(${n}, ${cellSize}px)`,
            outline: '2px solid rgba(255,255,255,0.6)',
            borderRadius: 4,
          }}
        >
          {Array.from({ length: n * n }, (_, i) => {
            const row = Math.floor(i / n), col = i % n
            const regionIdx = level.regions[i]
            const color = REGION_COLORS[regionIdx % REGION_COLORS.length]
            const mark = board.marks[row][col]
            return (
              <div
                key={i}
                className="gwiazdki-cell"
                style={{
                  width: cellSize, height: cellSize,
                  background: `${color}55`,
                  fontSize: cellSize * 0.52,
                  ...getCellBorders(row, col),
                }}
                onPointerDown={(e) => { e.preventDefault(); handleTap(row, col) }}
              >
                {markContent(mark)}
              </div>
            )
          })}
        </div>
      </div>

      {board.isSolved && (
        <div className="success-overlay">
          <div className="success-box">
            <div className="success-emoji">⭐</div>
            <div className="success-title">Brawo!</div>
            <div className="success-sub">Poziom {levelId} ukończony!</div>
            <div className="success-time">⏱ {formatTime(elapsedRef.current)}</div>
            {bestTime !== null && bestTime < elapsedRef.current && (
              <div className="success-best">Najlepszy: {formatTime(bestTime)}</div>
            )}
            {bestTime !== null && bestTime >= elapsedRef.current && (
              <div className="success-best success-best-new">🏆 Nowy rekord!</div>
            )}
            <div className="success-btns">
              <button className="btn-secondary" onClick={onMenu}>Hub</button>
              <button className="btn-yellow" onClick={onBack}>Dalej →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
