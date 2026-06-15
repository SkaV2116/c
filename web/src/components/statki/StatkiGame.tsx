import { useState, useEffect, useRef } from 'react'
import type { Player } from '../../lib/auth'
import {
  subscribeToStatkiGame,
  loadGrid,
  submitShot,
  validateShot,
  requestAbandon,
  acceptAbandon,
  declineAbandon,
  saveStatkiRanking,
  type StatkiGame as Game,
} from '../../lib/statkiOnline'
import type { Ship } from '../../games/statki'
import StatkiPlacement from './StatkiPlacement'

interface Props {
  gameId: string
  player: Player
  onBack: () => void
}

const COLS = 'ABCDEFGHIJ'
const ABANDON_MS = 90_000

export default function StatkiGame({ gameId, player, onBack }: Props) {
  const [game, setGame] = useState<Game | null>(null)
  const [myShips, setMyShips] = useState<Ship[] | null>(null)
  const [error, setError] = useState('')
  const [rankingSaved, setRankingSaved] = useState(false)
  const [now, setNow] = useState(Date.now())
  const unsubRef = useRef<(() => void) | null>(null)
  const validatingRef = useRef(false)
  const myShipsRef = useRef<Ship[] | null>(null)

  useEffect(() => { myShipsRef.current = myShips }, [myShips])

  useEffect(() => {
    unsubRef.current = subscribeToStatkiGame(gameId, setGame)
    return () => unsubRef.current?.()
  }, [gameId])

  // Load own grid once available (after placement). Re-attempt if not yet saved.
  useEffect(() => {
    if (!game) return
    if (myShips) return
    if (game.status !== 'battle' && game.status !== 'finished') return
    loadGrid(gameId, player.uid).then(ships => {
      if (ships) setMyShips(ships)
    }).catch(() => {})
  }, [game, gameId, player.uid, myShips])

  // Tick for abandon timer
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(t)
  }, [])

  // Defender auto-validates pending shots
  useEffect(() => {
    if (!game || game.status !== 'battle') return
    const pending = game.pendingShot
    if (!pending) return
    if (pending.shooterUid === player.uid) return // I'm the shooter, not defender
    const ships = myShipsRef.current
    if (!ships) return
    if (validatingRef.current) return
    validatingRef.current = true
    validateShot(gameId, game, ships, player.uid)
      .catch(() => {})
      .finally(() => { validatingRef.current = false })
  }, [game, gameId, player.uid])

  // Save ranking when finished
  useEffect(() => {
    if (!game || game.status !== 'finished' || rankingSaved) return
    setRankingSaved(true)
    const isCreator = game.creatorUid === player.uid
    const won = game.winnerUid === player.uid
    // hits = shots I made that hit; received = hits against me
    const hits = (game.shots ?? []).filter(s => s.shooterUid === player.uid && s.result === 'hit').length
    const received = (game.shots ?? []).filter(s => s.shooterUid !== player.uid && s.result === 'hit').length
    void isCreator
    saveStatkiRanking(player.uid, player.username, player.playerId, won, hits, received).catch(() => {})
  }, [game, player, rankingSaved])

  if (!game) {
    return (
      <div className="screen statki-screen">
        <div className="navbar">
          <button className="btn-back" onClick={onBack}>‹</button>
          <span className="navbar-title">STATKI</span>
          <div className="navbar-right" />
        </div>
        <div className="statki-game-content">
          <div className="kolko-loading">Łączenie z grą...</div>
        </div>
      </div>
    )
  }

  const g: Game = game
  const boardSize = g.settings.boardSize
  const isCreator = g.creatorUid === player.uid
  const opponentUsername = isCreator ? g.opponentUsername : g.creatorUsername
  const opponentPlayerId = isCreator ? g.opponentPlayerId : g.creatorPlayerId

  // Placement phase
  if (g.status === 'placement' || g.status === 'pending') {
    return (
      <div className="screen statki-screen">
        <div className="navbar">
          <button className="btn-back" onClick={onBack}>‹</button>
          <span className="navbar-title">STATKI</span>
          <div className="navbar-right" />
        </div>
        {g.status === 'placement' ? (
          <StatkiPlacement
            gameId={gameId}
            player={player}
            settings={g.settings}
            onBattleStart={() => { /* subscription will flip status to battle */ }}
          />
        ) : (
          <div className="statki-game-content">
            <div className="statki-status">Czekam na przeciwnika...</div>
          </div>
        )}
      </div>
    )
  }

  // Battle / finished phase
  const isMyTurn = g.currentTurnUid === player.uid && !g.pendingShot

  // shots I made (on opponent grid)
  const myShots = (g.shots ?? []).filter(s => s.shooterUid === player.uid)
  // shots against me (on my grid)
  const enemyShots = (g.shots ?? []).filter(s => s.shooterUid !== player.uid)

  const myShotMap = new Map<number, 'hit' | 'miss'>()
  for (const s of myShots) myShotMap.set(s.idx, s.result)
  const sunkOnOpponent = new Set<number>()
  for (const s of myShots) if (s.sunkShipCells) for (const c of s.sunkShipCells) sunkOnOpponent.add(c)

  const enemyShotMap = new Map<number, 'hit' | 'miss'>()
  for (const s of enemyShots) enemyShotMap.set(s.idx, s.result)

  const myHits = myShots.filter(s => s.result === 'hit').length
  const myLost = enemyShots.filter(s => s.result === 'hit').length

  // Abandon detection
  const opponentInactive =
    g.status === 'battle' &&
    !isMyTurn &&
    g.currentTurnUid !== player.uid &&
    !g.pendingShot &&
    (now - g.lastMoveAt) > ABANDON_MS &&
    g.abandonRequestUid === null

  const abandonByOpponent = g.abandonRequestUid !== null && g.abandonRequestUid !== player.uid
  const abandonByMe = g.abandonRequestUid === player.uid

  async function handleShoot(cell: number) {
    if (!isMyTurn || g.status !== 'battle') return
    if (myShotMap.has(cell)) return
    setError('')
    try {
      await submitShot(gameId, cell, player.uid)
    } catch {
      setError('Błąd strzału. Spróbuj ponownie.')
    }
  }

  async function handleRequestAbandon() {
    try {
      await requestAbandon(gameId, player.uid)
    } catch {
      setError('Błąd. Spróbuj ponownie.')
    }
  }

  async function handleAcceptAbandon() {
    try {
      // opponent (the one requesting) wins by inactivity claim? Per spec, the requester
      // claims victory because opponent is inactive; defender accepting confirms requester wins.
      await acceptAbandon(gameId, g.abandonRequestUid!, player.uid, g)
    } catch {
      setError('Błąd. Spróbuj ponownie.')
    }
  }

  async function handleDeclineAbandon() {
    try {
      await declineAbandon(gameId)
    } catch {
      setError('Błąd. Spróbuj ponownie.')
    }
  }

  const won = g.winnerUid === player.uid

  const cellPx = boardSize === 8 ? 34 : 28

  function renderGrid(opponent: boolean) {
    return (
      <div className="statki-grid-section">
        <div className="statki-grid-label">
          {opponent ? 'Plansza przeciwnika — strzelaj' : 'Twoja plansza'}
        </div>
        <div
          className="statki-grid-with-headers"
          style={{
            gridTemplateColumns: `${cellPx * 0.6}px repeat(${boardSize}, ${cellPx}px)`,
            justifyContent: 'center',
          }}
        >
          <div className="statki-corner" />
          {Array.from({ length: boardSize }).map((_, c) => (
            <div key={`col-${c}`} className="statki-col-header" style={{ height: cellPx * 0.6 }}>
              {COLS[c]}
            </div>
          ))}
          {Array.from({ length: boardSize }).map((_, r) => (
            <div key={`row-${r}`} style={{ display: 'contents' }}>
              <div className="statki-row-header" style={{ width: cellPx * 0.6 }}>{r + 1}</div>
              {Array.from({ length: boardSize }).map((_, c) => {
                const cell = r * boardSize + c
                let cls = 'statki-cell'
                let content = ''
                if (opponent) {
                  const res = myShotMap.get(cell)
                  if (res === 'hit') {
                    cls += sunkOnOpponent.has(cell) ? ' sunk' : ' hit'
                    content = '💥'
                  } else if (res === 'miss') {
                    cls += ' miss'
                    content = '💧'
                  } else if (!isMyTurn || g.status !== 'battle') {
                    cls += ' disabled'
                  }
                } else {
                  const hasShip = myShips?.some(s => s.cells.includes(cell)) ?? false
                  const res = enemyShotMap.get(cell)
                  if (res === 'hit') {
                    cls += ' hit'
                    content = '💥'
                  } else if (res === 'miss') {
                    cls += ' miss'
                    content = '💧'
                  } else if (hasShip) {
                    cls += ' ship'
                    content = '🚢'
                  }
                }
                return (
                  <div
                    key={cell}
                    className={cls}
                    style={{ width: cellPx, height: cellPx }}
                    onClick={opponent ? () => handleShoot(cell) : undefined}
                  >
                    {content}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="screen statki-screen">
      <div className="navbar">
        <button className="btn-back" onClick={onBack}>‹</button>
        <span className="navbar-title">STATKI</span>
        <div className="navbar-right" />
      </div>

      <div className="statki-game-content">
        <div className="statki-game-header">
          Przeciwnik: <strong>{opponentUsername}</strong> #{opponentPlayerId}
        </div>
        <div className="statki-score">
          <span>Trafienia: {myHits}</span>
          <span>Stracone: {myLost}</span>
        </div>

        {g.status === 'battle' && (
          <div className={`statki-status${isMyTurn ? ' statki-status-my-turn' : ''}`}>
            {g.pendingShot
              ? 'Rozstrzyganie strzału...'
              : isMyTurn ? 'Twoja tura — strzelaj!' : 'Tura przeciwnika'}
          </div>
        )}

        <div className="statki-board-wrap statki-grid-opponent">
          {renderGrid(true)}
        </div>

        <div className="statki-board-wrap">
          {renderGrid(false)}
        </div>

        {error && <div className="kolko-error">{error}</div>}

        {opponentInactive && (
          <button className="kolko-end-game-btn" onClick={handleRequestAbandon}>
            Przeciwnik nieaktywny — zgłoś nieobecność
          </button>
        )}

        {abandonByMe && (
          <div className="kolko-end-proposal">
            Czekam na odpowiedź przeciwnika ws. nieobecności...
          </div>
        )}
      </div>

      {/* Opponent requested abandon */}
      {abandonByOpponent && g.status === 'battle' && (
        <div className="kolko-overlay">
          <div className="kolko-result-box">
            <div className="kolko-result-emoji">🏳️</div>
            <div className="kolko-result-title">Przeciwnik prosi o zakończenie gry</div>
            <div className="kolko-result-score">
              Nieaktywność. Aktualny wynik — Twoje trafienia: {myHits}, Stracone: {myLost}
            </div>
            <div className="kolko-result-btns">
              <button className="btn-secondary" onClick={handleDeclineAbandon}>Odrzuć</button>
              <button className="btn-yellow" onClick={handleAcceptAbandon}>Przyjmij</button>
            </div>
          </div>
        </div>
      )}

      {/* Finished */}
      {g.status === 'finished' && (
        <div className="kolko-overlay">
          <div className="kolko-result-box">
            <div className="kolko-result-emoji">{won ? '🏆' : '😞'}</div>
            <div className="kolko-result-title">{won ? 'Zwycięstwo!' : 'Porażka'}</div>
            <div className="kolko-result-score">
              Trafienia: {myHits} | Stracone: {myLost}
            </div>
            <div className="kolko-result-points">
              {won ? '+1 wygrana do rankingu' : 'Powodzenia następnym razem!'}
            </div>
            <button className="btn-yellow" onClick={onBack} style={{ marginTop: 8 }}>Menu</button>
          </div>
        </div>
      )}

      {/* Declined */}
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
