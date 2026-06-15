import { useState, useEffect, useRef } from 'react'
import type { Player } from '../../lib/auth'
import {
  createStatkiGame,
  cancelStatkiGame,
  subscribeToStatkiGame,
  lookupPlayerById,
  type GameSettings,
} from '../../lib/statkiOnline'
import { CONFIGS, type BoardSize, type ShipDef } from '../../games/statki'

interface Props {
  player: Player
  onBack: () => void
  onGameStarted: (gameId: string) => void
}

type ConfigName = 'standard' | 'simplified' | 'custom'

const SIZES = [1, 2, 3, 4, 5] as const

function fleetLabel(ships: ShipDef[]): string {
  return ships
    .filter(s => s.count > 0)
    .sort((a, b) => b.size - a.size)
    .map(s => `${s.count}×${s.size}🚢`)
    .join('  ')
}

function totalCells(ships: ShipDef[]): number {
  return ships.reduce((sum, s) => sum + s.size * s.count, 0)
}

export default function StatkiSetup({ player, onBack, onGameStarted }: Props) {
  const [opponentId, setOpponentId] = useState('')
  const [boardSize, setBoardSize] = useState<BoardSize>(10)
  const [configName, setConfigName] = useState<ConfigName>('standard')
  const [customCounts, setCustomCounts] = useState<Record<number, number>>({
    1: 2, 2: 2, 3: 1, 4: 1, 5: 0,
  })
  const [waiting, setWaiting] = useState(false)
  const [error, setError] = useState('')
  const [gameId, setGameId] = useState<string | null>(null)
  const unsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => { unsubRef.current?.() }
  }, [])

  const maxCells = Math.floor(boardSize * boardSize * 0.4)

  function currentShips(): ShipDef[] {
    if (configName === 'custom') {
      return SIZES.map(size => ({ size, count: customCounts[size] ?? 0 })).filter(s => s.count > 0)
    }
    return CONFIGS[configName]
  }

  const ships = currentShips()
  const usedCells = totalCells(ships)

  function changeCustom(size: number, delta: number) {
    setCustomCounts(prev => {
      const next = { ...prev }
      const newVal = Math.max(0, (prev[size] ?? 0) + delta)
      const candidate = { ...prev, [size]: newVal }
      const candidateCells = SIZES.reduce((sum, s) => sum + s * (candidate[s] ?? 0), 0)
      if (delta > 0 && candidateCells > maxCells) return prev
      next[size] = newVal
      return next
    })
  }

  function validateCustom(): string {
    const c = currentShips()
    const total = c.reduce((sum, s) => sum + s.count, 0)
    if (total < 1) return 'Dodaj co najmniej jeden statek'
    if (totalCells(c) > maxCells) return `Za dużo statków (max ${maxCells} pól)`
    // ensure ship size fits
    for (const s of c) {
      if (s.size > boardSize) return 'Statek nie mieści się na planszy'
    }
    return ''
  }

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
    if (configName === 'custom') {
      const v = validateCustom()
      if (v) { setError(v); return }
    }

    try {
      const opponent = await lookupPlayerById(trimmedId)
      if (!opponent) {
        setError('Nie znaleziono gracza o tym ID')
        return
      }

      const settings: GameSettings = {
        boardSize,
        configName,
        ships: currentShips(),
      }

      const id = await createStatkiGame(
        player,
        opponent.uid,
        opponent.username,
        trimmedId,
        settings,
      )
      setGameId(id)
      setWaiting(true)

      unsubRef.current = subscribeToStatkiGame(id, (game) => {
        if (game.status === 'placement' || game.status === 'battle') {
          unsubRef.current?.()
          onGameStarted(id)
        } else if (game.status === 'declined') {
          unsubRef.current?.()
          setWaiting(false)
          setGameId(null)
          setError(`Gracz ${opponent.username} odrzucił zaproszenie`)
        }
      })
    } catch (e: any) {
      console.error('createStatkiGame error:', e)
      if (e?.code === 'permission-denied') {
        setError('Brak uprawnień — administrator musi zaktualizować reguły Firestore.')
      } else {
        setError('Błąd wysyłania zaproszenia. Spróbuj ponownie.')
      }
    }
  }

  async function handleCancel() {
    if (!gameId) {
      setWaiting(false)
      return
    }
    unsubRef.current?.()
    try {
      const opponent = await lookupPlayerById(opponentId.trim())
      if (opponent) await cancelStatkiGame(gameId, opponent.uid)
    } catch {
      // ignore
    }
    setWaiting(false)
    setGameId(null)
    setError('')
  }

  return (
    <div className="screen statki-screen">
      <div className="navbar">
        <button className="btn-back" onClick={waiting ? undefined : onBack} style={waiting ? { opacity: 0.3 } : {}}>‹</button>
        <span className="navbar-title">NOWA GRA</span>
        <div className="navbar-right" />
      </div>

      <div className="statki-game-content">
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
              <div className="online-setup-label">Rozmiar planszy</div>
              <div className="statki-size-btns">
                {([8, 10] as BoardSize[]).map(s => (
                  <button
                    key={s}
                    className={`statki-size-btn${boardSize === s ? ' statki-size-btn-active' : ''}`}
                    onClick={() => setBoardSize(s)}
                  >
                    {s}×{s}
                  </button>
                ))}
              </div>
            </div>

            <div className="online-setup-section">
              <div className="online-setup-label">Flota</div>
              <div className="statki-config-btns">
                <button
                  className={`statki-config-btn${configName === 'standard' ? ' statki-config-btn-active' : ''}`}
                  onClick={() => setConfigName('standard')}
                >
                  Polski Standard
                </button>
                <button
                  className={`statki-config-btn${configName === 'simplified' ? ' statki-config-btn-active' : ''}`}
                  onClick={() => setConfigName('simplified')}
                >
                  Uproszczony
                </button>
                <button
                  className={`statki-config-btn${configName === 'custom' ? ' statki-config-btn-active' : ''}`}
                  onClick={() => setConfigName('custom')}
                >
                  Własna
                </button>
              </div>

              {configName !== 'custom' && (
                <div className="statki-fleet-display">{fleetLabel(ships)}</div>
              )}

              {configName === 'custom' && (
                <div>
                  {SIZES.map(size => (
                    <div className="statki-custom-row" key={size}>
                      <span className="statki-custom-label">Statek {size}-polowy</span>
                      <div className="statki-counter">
                        <button onClick={() => changeCustom(size, -1)} disabled={(customCounts[size] ?? 0) <= 0}>−</button>
                        <span className="statki-counter-val">{customCounts[size] ?? 0}</span>
                        <button onClick={() => changeCustom(size, 1)} disabled={size > boardSize}>+</button>
                      </div>
                    </div>
                  ))}
                  <div className="statki-custom-hint">
                    Zajęte pola: {usedCells} / {maxCells}
                  </div>
                </div>
              )}
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
