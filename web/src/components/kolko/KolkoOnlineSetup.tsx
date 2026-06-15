import { useState, useEffect, useRef } from 'react'
import type { Player } from '../../lib/auth'
import { createOnlineGame, cancelGame, subscribeToGame, lookupPlayerById } from '../../lib/kolkoOnline'

interface Props {
  player: Player
  onBack: () => void
  onGameStarted: (gameId: string) => void
}

type RoundOption = 1 | 3 | 5 | 10 | 0  // 0 = unlimited

const ROUND_OPTIONS: { value: RoundOption; label: string }[] = [
  { value: 1, label: '1 runda' },
  { value: 3, label: '3 rundy' },
  { value: 5, label: '5 rund' },
  { value: 10, label: '10 rund' },
  { value: 0, label: 'Bez limitu' },
]

export default function KolkoOnlineSetup({ player, onBack, onGameStarted }: Props) {
  const [opponentId, setOpponentId] = useState('')
  const [totalRounds, setTotalRounds] = useState<RoundOption>(3)
  const [waiting, setWaiting] = useState(false)
  const [error, setError] = useState('')
  const [gameId, setGameId] = useState<string | null>(null)
  const unsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => {
      unsubRef.current?.()
    }
  }, [])

  async function handleSendInvite() {
    setError('')
    const trimmedId = opponentId.trim()
    if (!/^\d{4}$/.test(trimmedId)) {
      setError('Wpisz 4-cyfrowe ID gracza')
      return
    }
    if (trimmedId === player.playerId) {
      setError('Nie możesz zaprosić siebie')
      return
    }

    try {
      const opponent = await lookupPlayerById(trimmedId)
      if (!opponent) {
        setError('Nie znaleziono gracza o tym ID')
        return
      }

      const id = await createOnlineGame(
        player,
        opponent.uid,
        opponent.username,
        trimmedId,
        totalRounds,
      )
      setGameId(id)
      setWaiting(true)

      // Listen for status change
      unsubRef.current = subscribeToGame(id, (game) => {
        if (game.status === 'active') {
          unsubRef.current?.()
          onGameStarted(id)
        } else if (game.status === 'declined') {
          unsubRef.current?.()
          setWaiting(false)
          setGameId(null)
          setError(`Gracz ${opponent.username} odrzucił zaproszenie`)
        }
      })
    } catch (e) {
      setError('Błąd wysyłania zaproszenia. Spróbuj ponownie.')
    }
  }

  async function handleCancel() {
    if (!gameId) {
      setWaiting(false)
      return
    }
    unsubRef.current?.()
    try {
      // Look up opponent uid to delete invitation doc
      const opponent = await lookupPlayerById(opponentId.trim())
      if (opponent) {
        await cancelGame(gameId, opponent.uid)
      }
    } catch {
      // ignore
    }
    setWaiting(false)
    setGameId(null)
    setError('')
  }

  return (
    <div className="screen kolko-screen">
      <div className="navbar">
        <button className="btn-back" onClick={waiting ? undefined : onBack} style={waiting ? { opacity: 0.3 } : {}}>‹</button>
        <span className="navbar-title">ONLINE PVP</span>
        <div className="navbar-right" />
      </div>

      <div className="kolko-game-content">
        {!waiting ? (
          <div className="online-setup-form">
            <div className="online-setup-section">
              <div className="online-setup-label">ID przeciwnika (4 cyfry)</div>
              <input
                className="online-setup-input"
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="np. 1234"
                value={opponentId}
                onChange={e => {
                  setOpponentId(e.target.value.replace(/\D/g, ''))
                  setError('')
                }}
              />
              <div className="online-setup-hint">Twoje ID: #{player.playerId}</div>
            </div>

            <div className="online-setup-section">
              <div className="online-setup-label">Liczba rund</div>
              <div className="online-setup-rounds">
                {ROUND_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`online-setup-round-btn${totalRounds === opt.value ? ' online-setup-round-btn-active' : ''}`}
                    onClick={() => setTotalRounds(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="kolko-error">{error}</div>}

            <button
              className="btn-yellow"
              onClick={handleSendInvite}
              disabled={opponentId.length !== 4}
              style={opponentId.length !== 4 ? { opacity: 0.4 } : {}}
            >
              Wyślij zaproszenie
            </button>
          </div>
        ) : (
          <div className="online-setup-waiting">
            <div className="online-setup-spinner" />
            <div className="online-setup-waiting-text">Czekam na odpowiedź...</div>
            <div className="online-setup-waiting-sub">
              Zaproszenie wysłane do gracza #{opponentId}
            </div>
            <button className="btn-secondary" onClick={handleCancel} style={{ marginTop: 24 }}>
              Anuluj
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
