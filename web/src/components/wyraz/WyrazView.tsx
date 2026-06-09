import { useState, useEffect, useCallback } from 'react'
import type { WyrazBoard, TileState } from '../../games/wyraz'
import {
  freshBoard, evaluateGuess, isValidWord, todaysSolution,
  loadBoard, saveBoard, updateStreak
} from '../../games/wyraz'

const KEYBOARD_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L','Ó'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
  ['Ą','Ć','Ę','Ł','Ń','Ś','Ź','Ż'],
]

interface Props { onBack: () => void }

export default function WyrazView({ onBack }: Props) {
  const solution = todaysSolution()
  const [board, setBoard] = useState<WyrazBoard>(() => loadBoard() ?? freshBoard())
  const [toast, setToast] = useState<string | null>(null)
  const [shakeRow, setShakeRow] = useState<number | null>(null)
  const [flippingRow, setFlippingRow] = useState<number | null>(null)
  const [_flippingStates, setFlippingStates] = useState<TileState[]>([])
  const [showResult, setShowResult] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  const handleKey = useCallback((key: string) => {
    if (board.gameState !== 'playing' || isAnimating) return
    if (key === '⌫') {
      if (board.currentCol === 0) return
      setBoard(b => {
        const nb = structuredClone(b)
        nb.currentCol--
        nb.rows[nb.currentRow][nb.currentCol] = { letter: '', state: 'empty' }
        return nb
      })
      return
    }
    if (key === 'ENTER') {
      const guess = board.rows[board.currentRow].map(t => t.letter).join('')
      if (guess.length < 5) { setShakeRow(board.currentRow); showToast('Za mało liter'); return }
      if (!isValidWord(guess)) { setShakeRow(board.currentRow); showToast('Nieznane słowo'); return }

      const states = evaluateGuess(guess, solution)
      const row = board.currentRow
      const won = states.every(s => s === 'correct')

      setIsAnimating(true)
      setFlippingRow(row)
      setFlippingStates(states)

      setTimeout(() => {
        setBoard(b => {
          const nb = structuredClone(b)
          states.forEach((s, i) => { nb.rows[row][i].state = s })
          nb.currentRow = row + 1
          nb.currentCol = 0
          if (won) nb.gameState = 'won'
          else if (row + 1 >= 6) nb.gameState = 'lost'
          saveBoard(nb)
          return nb
        })
        setFlippingRow(null)
        setIsAnimating(false)
        if (won) {
          updateStreak(true)
          setTimeout(() => setShowResult(true), 400)
        } else if (row + 1 >= 6) {
          showToast(solution)
          setTimeout(() => setShowResult(true), 2500)
        }
      }, 5 * 110 + 180) // flip delay

      return
    }
    if (board.currentCol >= 5) return
    setBoard(b => {
      const nb = structuredClone(b)
      nb.rows[nb.currentRow][nb.currentCol] = { letter: key, state: 'typed' }
      nb.currentCol++
      return nb
    })
  }, [board, isAnimating, solution])

  // Physical keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') { handleKey('⌫'); return }
      if (e.key === 'Enter') { handleKey('ENTER'); return }
      const l = e.key.toUpperCase()
      if (l.length === 1 && /[A-ZĄĆĘŁŃÓŚŹŻ]/.test(l)) handleKey(l)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleKey])

  const letterStates = (): Record<string, TileState> => {
    const result: Record<string, TileState> = {}
    const priority: Record<TileState, number> = { correct: 3, present: 2, absent: 1, typed: 0, empty: -1 }
    for (const row of board.rows) {
      for (const tile of row) {
        if (!tile.letter || tile.state === 'empty' || tile.state === 'typed') continue
        if (!result[tile.letter] || priority[tile.state] > priority[result[tile.letter]]) {
          result[tile.letter] = tile.state
        }
      }
    }
    return result
  }
  const ls = letterStates()

  const tileSize = Math.min(56, (Math.min(window.innerWidth, 400) - 32 - 24) / 5)

  return (
    <div className="screen wyraz">
      <div className="navbar">
        <button className="btn-back" onClick={onBack}>‹</button>
        <span className="navbar-title">WYRAZ</span>
        <div className="navbar-right" />
      </div>

      {toast && <div key={toast + Date.now()} className="toast">{toast}</div>}

      <div className="wyraz-board-wrap">
        <div className="wyraz-board">
          {board.rows.map((row, ri) => (
            <div
              key={ri}
              className={`wyraz-row${shakeRow === ri ? ' row-shake' : ''}`}
              onAnimationEnd={() => setShakeRow(null)}
            >
              {row.map((tile, ci) => {
                const isFlipping = flippingRow === ri
                const delay = ci * 110
                let displayState = tile.state
                if (isFlipping) displayState = 'typed'

                return (
                  <div
                    key={ci}
                    className={`tile tile-${displayState}${isFlipping ? ' tile-flipping' : ''}`}
                    style={{
                      width: tileSize, height: tileSize,
                      fontSize: tileSize * 0.46,
                      animationDelay: isFlipping ? `${delay}ms` : undefined,
                    }}
                    onAnimationEnd={isFlipping && ci === 4 ? () => {
                      setFlippingRow(null)
                    } : undefined}
                  >
                    {tile.letter}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="keyboard">
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="kb-row">
            {row.map(k => (
              <button
                key={k}
                className={`kb-key${k === 'ENTER' || k === '⌫' ? ' kb-key-wide' : ''} ${ls[k] ?? ''}`}
                onPointerDown={(e) => { e.preventDefault(); handleKey(k) }}
              >{k}</button>
            ))}
          </div>
        ))}
      </div>

      {showResult && (
        <div className="modal-backdrop" onClick={() => setShowResult(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-pill" />
            <div className="modal-emoji">{board.gameState === 'won' ? '🎉' : '😔'}</div>
            <div className="modal-title">{board.gameState === 'won' ? 'Brawo!' : 'Następnym razem!'}</div>
            <div className="modal-word">{solution}</div>
            {board.gameState === 'won' && (
              <div className="modal-sub">Rozwiązano w {board.currentRow} {board.currentRow === 1 ? 'próbie' : 'próbach'}</div>
            )}
            <div className="modal-sub">Wróć jutro po kolejne słowo</div>
            <button className="btn-primary" onClick={() => setShowResult(false)}>Zamknij</button>
          </div>
        </div>
      )}
    </div>
  )
}
