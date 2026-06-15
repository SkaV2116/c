import { useState } from 'react'
import { emptyBoard, checkWinner, type Mark, type GameResult } from '../../games/kolko'

interface Props {
  onBack: () => void
}

interface Score {
  x: number
  o: number
  draws: number
}

export default function KolkoLocalGame({ onBack }: Props) {
  const [board, setBoard] = useState<Mark[]>(emptyBoard())
  const [currentMark, setCurrentMark] = useState<'X' | 'O'>('X')
  const [result, setResult] = useState<GameResult>(null)
  const [score, setScore] = useState<Score>({ x: 0, o: 0, draws: 0 })

  function handleCellClick(idx: number) {
    if (board[idx] !== '' || result !== null) return

    const newBoard = [...board] as Mark[]
    newBoard[idx] = currentMark
    const winner = checkWinner(newBoard)

    setBoard(newBoard)

    if (winner !== null) {
      setResult(winner)
      setScore(prev => ({
        x: prev.x + (winner === 'X' ? 1 : 0),
        o: prev.o + (winner === 'O' ? 1 : 0),
        draws: prev.draws + (winner === 'draw' ? 1 : 0),
      }))
    } else {
      setCurrentMark(currentMark === 'X' ? 'O' : 'X')
    }
  }

  function newGame() {
    setBoard(emptyBoard())
    setCurrentMark('X')
    setResult(null)
  }

  function getResultText(): string {
    if (result === 'X') return 'Gracz X wygrywa!'
    if (result === 'O') return 'Gracz O wygrywa!'
    return 'Remis!'
  }

  function getResultEmoji(): string {
    if (result === 'draw') return '🤝'
    return '🎉'
  }

  return (
    <div className="screen kolko-screen">
      <div className="navbar">
        <button className="btn-back" onClick={onBack}>‹</button>
        <span className="navbar-title">GRACZ VS GRACZ</span>
        <div className="navbar-right" />
      </div>

      <div className="kolko-game-content">
        <div className="kolko-session-score">
          <span className="kolko-session-x">X: {score.x}</span>
          <span className="kolko-session-draws">Remisy: {score.draws}</span>
          <span className="kolko-session-o">O: {score.o}</span>
        </div>

        {result === null && (
          <div className="kolko-status">
            Tura: Gracz <span className={currentMark === 'X' ? 'kolko-x-color' : 'kolko-o-color'}>{currentMark}</span>
          </div>
        )}

        <div className="kolko-board">
          {board.map((cell, idx) => (
            <button
              key={idx}
              className={`kolko-cell${cell === 'X' ? ' kolko-cell-x' : cell === 'O' ? ' kolko-cell-o' : ''}${cell === '' && result === null ? ' kolko-cell-empty' : ''}`}
              onClick={() => handleCellClick(idx)}
              disabled={cell !== '' || result !== null}
            >
              {cell}
            </button>
          ))}
        </div>
      </div>

      {result !== null && (
        <div className="kolko-overlay">
          <div className="kolko-result-box">
            <div className="kolko-result-emoji">{getResultEmoji()}</div>
            <div className="kolko-result-title">{getResultText()}</div>
            <div className="kolko-result-score">
              X: {score.x} | Remisy: {score.draws} | O: {score.o}
            </div>
            <div className="kolko-result-btns">
              <button className="btn-secondary" onClick={newGame}>Nowa gra</button>
              <button className="btn-yellow" onClick={onBack}>Menu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
