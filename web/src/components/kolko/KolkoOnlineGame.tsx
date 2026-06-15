import { useState, useEffect, useRef } from 'react'
import type { Player } from '../../lib/auth'
import {
  subscribeToGame,
  makeMove,
  proposeEndGame,
  acceptEndGame,
  declineEndGame,
  saveRankingResult,
  type OnlineGame,
} from '../../lib/kolkoOnline'
import type { Mark } from '../../games/kolko'

interface Props {
  gameId: string
  player: Player
  onBack: () => void
}

export default function KolkoOnlineGame({ gameId, player, onBack }: Props) {
  const [game, setGame] = useState<OnlineGame | null>(null)
  const [error, setError] = useState('')
  const [rankingSaved, setRankingSaved] = useState(false)
  const unsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    unsubRef.current = subscribeToGame(gameId, setGame)
    return () => unsubRef.current?.()
  }, [gameId])

  // Save ranking when game finishes
  useEffect(() => {
    if (!game || g.status !== 'finished' || rankingSaved) return
    setRankingSaved(true)
    const myRoundsWon = game.roundsWon[player.uid] ?? 0
    saveRankingResult(player.uid, player.username, player.playerId, myRoundsWon).catch(() => {})
  }, [game, player, rankingSaved])

  if (!game) {
    return (
      <div className="screen kolko-screen">
        <div className="navbar">
          <button className="btn-back" onClick={onBack}>‹</button>
          <span className="navbar-title">ONLINE PVP</span>
          <div className="navbar-right" />
        </div>
        <div className="kolko-game-content">
          <div className="kolko-loading">Łączenie z grą...</div>
        </div>
      </div>
    )
  }

  // game is guaranteed non-null here (returned early above if null)
  const g: OnlineGame = game

  const isCreator = g.creatorUid === player.uid
  const opponentUid = isCreator ? g.opponentUid : g.creatorUid
  const opponentUsername = isCreator ? g.opponentUsername : g.creatorUsername
  const opponentPlayerId = isCreator ? g.opponentPlayerId : g.creatorPlayerId

  const myMark: Mark = g.xUid === player.uid ? 'X' : 'O'
  const opponentMark: Mark = myMark === 'X' ? 'O' : 'X'
  const isMyTurn = g.currentTurnUid === player.uid

  const myRoundsWon = g.roundsWon[player.uid] ?? 0
  const opponentRoundsWon = g.roundsWon[opponentUid] ?? 0

  const endGameProposedByMe = g.endGameRequestUid === player.uid
  const endGameProposedByOpponent = g.endGameRequestUid !== null && g.endGameRequestUid !== player.uid

  async function handleCellClick(idx: number) {
    if (!isMyTurn || g.board[idx] !== '' || g.status !== 'active') return
    setError('')
    try {
      await makeMove(gameId, idx, g, player.uid)
    } catch {
      setError('Błąd ruchu. Spróbuj ponownie.')
    }
  }

  async function handleProposeEnd() {
    try {
      await proposeEndGame(gameId, player.uid)
    } catch {
      setError('Błąd. Spróbuj ponownie.')
    }
  }

  async function handleAcceptEnd() {
    try {
      await acceptEndGame(gameId)
    } catch {
      setError('Błąd. Spróbuj ponownie.')
    }
  }

  async function handleDeclineEnd() {
    try {
      await declineEndGame(gameId)
    } catch {
      setError('Błąd. Spróbuj ponownie.')
    }
  }

  function getRoundLabel(): string {
    if (g.totalRounds === 0) return `Runda ${g.currentRound}`
    return `Runda ${g.currentRound}/${g.totalRounds}`
  }

  function getFinalResultText(): string {
    if (myRoundsWon > opponentRoundsWon) return 'Wygrywasz!'
    if (opponentRoundsWon > myRoundsWon) return 'Przegrywasz!'
    return 'Remis!'
  }

  function getFinalResultEmoji(): string {
    if (myRoundsWon > opponentRoundsWon) return '🏆'
    if (opponentRoundsWon > myRoundsWon) return '😞'
    return '🤝'
  }

  return (
    <div className="screen kolko-screen">
      <div className="navbar">
        <button className="btn-back" onClick={onBack}>‹</button>
        <span className="navbar-title">ONLINE PVP</span>
        <div className="navbar-right" />
      </div>

      <div className="kolko-game-content">
        <div className="kolko-online-header">
          <div className="kolko-online-vs">
            <div className="kolko-online-player">
              <span className={`kolko-online-mark ${myMark === 'X' ? 'kolko-x-color' : 'kolko-o-color'}`}>{myMark}</span>
              <span className="kolko-online-name">Ty ({player.username})</span>
            </div>
            <div className="kolko-online-score">
              <span className={myRoundsWon >= opponentRoundsWon ? 'kolko-score-leading' : ''}>{myRoundsWon}</span>
              <span className="kolko-score-sep">-</span>
              <span className={opponentRoundsWon > myRoundsWon ? 'kolko-score-leading' : ''}>{opponentRoundsWon}</span>
            </div>
            <div className="kolko-online-player">
              <span className={`kolko-online-mark ${opponentMark === 'X' ? 'kolko-x-color' : 'kolko-o-color'}`}>{opponentMark}</span>
              <span className="kolko-online-name">{opponentUsername} #{opponentPlayerId}</span>
            </div>
          </div>
          <div className="kolko-round-label">{getRoundLabel()}</div>
        </div>

        {g.status === 'active' && (
          <div className={`kolko-status${isMyTurn ? ' kolko-status-my-turn' : ''}`}>
            {isMyTurn ? 'Twoja tura' : 'Tura przeciwnika'}
          </div>
        )}

        {g.status === 'pending' && (
          <div className="kolko-status">Czekam na przeciwnika...</div>
        )}

        <div className="kolko-board">
          {g.board.map((cell, idx) => (
            <button
              key={idx}
              className={`kolko-cell${cell === 'X' ? ' kolko-cell-x' : cell === 'O' ? ' kolko-cell-o' : ''}${cell === '' && isMyTurn && g.status === 'active' ? ' kolko-cell-empty' : ''}`}
              onClick={() => handleCellClick(idx)}
              disabled={!isMyTurn || cell !== '' || g.status !== 'active'}
            >
              {cell}
            </button>
          ))}
        </div>

        {error && <div className="kolko-error">{error}</div>}

        {g.status === 'active' && g.totalRounds === 0 && !endGameProposedByMe && !endGameProposedByOpponent && (
          <button className="kolko-end-game-btn" onClick={handleProposeEnd}>
            Zakończ grę
          </button>
        )}

        {endGameProposedByMe && (
          <div className="kolko-end-proposal">
            Czekam na odpowiedź przeciwnika ws. zakończenia...
          </div>
        )}
      </div>

      {/* End game proposal from opponent */}
      {endGameProposedByOpponent && (
        <div className="kolko-overlay">
          <div className="kolko-result-box">
            <div className="kolko-result-emoji">🏳️</div>
            <div className="kolko-result-title">Przeciwnik chce zakończyć grę</div>
            <div className="kolko-result-score">
              Aktualny wynik: Ty {myRoundsWon} - Oponent {opponentRoundsWon}
            </div>
            <div className="kolko-result-btns">
              <button className="btn-secondary" onClick={handleDeclineEnd}>Odrzuć</button>
              <button className="btn-yellow" onClick={handleAcceptEnd}>Zaakceptuj</button>
            </div>
          </div>
        </div>
      )}

      {/* Game finished */}
      {g.status === 'finished' && (
        <div className="kolko-overlay">
          <div className="kolko-result-box">
            <div className="kolko-result-emoji">{getFinalResultEmoji()}</div>
            <div className="kolko-result-title">{getFinalResultText()}</div>
            <div className="kolko-result-score">
              Ty: {myRoundsWon} rund | Oponent: {opponentRoundsWon} rund
            </div>
            <div className="kolko-result-points">
              +{myRoundsWon} pkt do rankingu
            </div>
            <button className="btn-yellow" onClick={onBack}>Menu</button>
          </div>
        </div>
      )}

      {/* Declined / disconnected */}
      {g.status === 'declined' && (
        <div className="kolko-overlay">
          <div className="kolko-result-box">
            <div className="kolko-result-emoji">❌</div>
            <div className="kolko-result-title">Gra anulowana</div>
            <button className="btn-yellow" onClick={onBack} style={{ marginTop: 8 }}>Menu</button>
          </div>
        </div>
      )}
    </div>
  )
}
