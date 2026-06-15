import { useState, useEffect, useRef } from 'react'
import { emptyBoard, checkWinner, getAIMove, type Mark, type GameResult } from '../../games/kolko'

interface Props {
  onBack: () => void
}

type Difficulty = 'easy' | 'hard'

interface Score {
  player: number
  ai: number
  draws: number
}

export default function KolkoAIGame({ onBack }: Props) {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [board, setBoard] = useState<Mark[]>(emptyBoard())
  const [playerMark] = useState<Mark>('X')
  const aiMark: Mark = playerMark === 'X' ? 'O' : 'X'
  const [currentMark, setCurrentMark] = useState<Mark>('X')
  const [result, setResult] = useState<GameResult>(null)
  const [score, setScore] = useState<Score>({ player: 0, ai: 0, draws: 0 })
  const [aiThinking, setAiThinking] = useState(false)
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (difficulty === null) return
    if (result !== null) return
    if (currentMark !== aiMark) return

    setAiThinking(true)
    aiTimerRef.current = setTimeout(() => {
      setBoard(prev => {
        const newBoard = [...prev] as Mark[]
        const move = getAIMove(newBoard, aiMark, difficulty)
        if (move === -1) return prev
        newBoard[move] = aiMark
        const winner = checkWinner(newBoard)
        if (winner !== null) {
          setResult(winner)
          setScore(s => ({
            player: s.player + (winner === playerMark ? 1 : 0),
            ai: s.ai + (winner === aiMark ? 1 : 0),
            draws: s.draws + (winner === 'draw' ? 1 : 0),
          }))
        } else {
          setCurrentMark(playerMark)
        }
        setAiThinking(false)
        return newBoard
      })
    }, 400)
  }, [currentMark, difficulty, result, aiMark, playerMark])

  function handleCellClick(idx: number) {
    if (difficulty === null) return
    if (board[idx] !== '' || result !== null || aiThinking || currentMark !== playerMark) return

    const newBoard = [...board] as Mark[]
    newBoard[idx] = playerMark
    const winner = checkWinner(newBoard)

    setBoard(newBoard)

    if (winner !== null) {
      setResult(winner)
      setScore(s => ({
        player: s.player + (winner === playerMark ? 1 : 0),
        ai: s.ai + (winner === aiMark ? 1 : 0),
        draws: s.draws + (winner === 'draw' ? 1 : 0),
      }))
    } else {
      setCurrentMark(aiMark)
    }
  }

  function newGame() {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current)
    setBoard(emptyBoard())
    setCurrentMark('X')
    setResult(null)
    setAiThinking(false)
  }

  function getResultText(): string {
    if (result === playerMark) return 'Wygrywasz!'
    if (result === aiMark) return 'Komputer wygrywa!'
    return 'Remis!'
  }

  function getResultEmoji(): string {
    if (result === playerMark) return '🎉'
    if (result === aiMark) return '🤖'
    return '🤝'
  }

  function getStatusText(): string {
    if (aiThinking) return 'Komputer myśli...'
    if (currentMark === playerMark) return 'Twoja tura'
    return 'Tura komputera'
  }

  if (difficulty === null) {
    return (
      <div className="screen kolko-screen">
        <div className="navbar">
          <button className="btn-back" onClick={onBack}>‹</button>
          <span className="navbar-title">GRACZ VS KOMPUTER</span>
          <div className="navbar-right" />
        </div>
        <div className="kolko-game-content">
          <div className="kolko-difficulty-select">
            <div className="kolko-difficulty-title">Wybierz poziom trudności</div>
            <button
              className="kolko-difficulty-btn kolko-difficulty-easy"
              onClick={() => setDifficulty('easy')}
            >
              <span className="kolko-difficulty-btn-icon">😊</span>
              <div>
                <div className="kolko-difficulty-btn-title">Łatwy</div>
                <div className="kolko-difficulty-btn-desc">Komputer gra losowo</div>
              </div>
            </button>
            <button
              className="kolko-difficulty-btn kolko-difficulty-hard"
              onClick={() => setDifficulty('hard')}
            >
              <span className="kolko-difficulty-btn-icon">🧠</span>
              <div>
                <div className="kolko-difficulty-btn-title">Trudny</div>
                <div className="kolko-difficulty-btn-desc">Komputer gra optymalnie (minimax)</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen kolko-screen">
      <div className="navbar">
        <button className="btn-back" onClick={onBack}>‹</button>
        <span className="navbar-title">{difficulty === 'easy' ? 'ŁATWY' : 'TRUDNY'}</span>
        <div className="navbar-right" />
      </div>

      <div className="kolko-game-content">
        <div className="kolko-session-score">
          <span className="kolko-session-x">Ty: {score.player}</span>
          <span className="kolko-session-draws">Remisy: {score.draws}</span>
          <span className="kolko-session-o">AI: {score.ai}</span>
        </div>

        {result === null && (
          <div className={`kolko-status${aiThinking ? ' kolko-status-thinking' : ''}`}>
            {getStatusText()}
          </div>
        )}

        <div className="kolko-board">
          {board.map((cell, idx) => (
            <button
              key={idx}
              className={`kolko-cell${cell === 'X' ? ' kolko-cell-x' : cell === 'O' ? ' kolko-cell-o' : ''}${cell === '' && result === null && currentMark === playerMark && !aiThinking ? ' kolko-cell-empty' : ''}`}
              onClick={() => handleCellClick(idx)}
              disabled={cell !== '' || result !== null || aiThinking || currentMark !== playerMark}
            >
              {cell}
            </button>
          ))}
        </div>

        <div className="kolko-player-info">
          Ty = <span className="kolko-x-color">X</span> | Komputer = <span className="kolko-o-color">O</span>
        </div>
      </div>

      {result !== null && (
        <div className="kolko-overlay">
          <div className="kolko-result-box">
            <div className="kolko-result-emoji">{getResultEmoji()}</div>
            <div className="kolko-result-title">{getResultText()}</div>
            <div className="kolko-result-score">
              Ty: {score.player} | Remisy: {score.draws} | AI: {score.ai}
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
