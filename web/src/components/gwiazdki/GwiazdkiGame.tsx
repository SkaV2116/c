import { useState, useCallback, useRef } from 'react'
import type { Level, BoardState, CellMark } from '../../games/gwiazdki'
import {
  emptyBoard, placeStar, removeStar, toggleManualX, checkSolved,
  markCompleted, saveBoardState, loadBoardState, clearBoardState
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
  onNext: () => void
  onMenu: () => void
}

export default function GwiazdkiGame({ levelId, onBack, onNext, onMenu }: Props) {
  const level = allLevels.find(l => l.id === levelId)!
  const [board, setBoard] = useState<BoardState>(() => loadBoardState(levelId) ?? emptyBoard(level.gridSize))
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPress = useRef(false)

  const n = level.gridSize
  const boardSize = Math.min(window.innerWidth - 28, window.innerHeight - 180)
  const cellSize = boardSize / n

  const handlePointerDown = useCallback((row: number, col: number) => {
    didLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true
      setBoard(b => {
        const mark = b.marks[row][col]
        if (mark === 'empty' || mark === 'manualX') {
          const nb = toggleManualX(b, row, col)
          saveBoardState(levelId, nb)
          return nb
        }
        return b
      })
    }, 420)
  }, [levelId])

  const handlePointerUp = useCallback((row: number, col: number) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
    if (didLongPress.current) return

    setBoard(b => {
      if (b.isSolved) return b
      const mark: CellMark = b.marks[row][col]
      let nb: BoardState
      if (mark === 'star') {
        nb = removeStar(b, row, col)
      } else if (mark === 'empty') {
        nb = placeStar(b, row, col, n)
        const solved = checkSolved(nb, level)
        if (solved) {
          nb = { ...nb, isSolved: true }
          markCompleted(levelId)
          clearBoardState(levelId)
          return nb
        }
      } else {
        return b
      }
      nb.moveCount++
      saveBoardState(levelId, nb)
      return nb
    })
  }, [n, level, levelId])

  const reset = () => {
    clearBoardState(levelId)
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
        <span>{board.moveCount} ruchów</span>
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
                onPointerDown={() => handlePointerDown(row, col)}
                onPointerUp={() => handlePointerUp(row, col)}
                onPointerLeave={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current) }}
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
            <div className="success-btns">
              <button className="btn-secondary" onClick={onMenu}>Menu</button>
              {levelId < 200 && (
                <button className="btn-yellow" onClick={onNext}>Dalej →</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
