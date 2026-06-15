import { useState, useMemo, useEffect, useRef } from 'react'
import type { Player } from '../../lib/auth'
import {
  saveGrid,
  setReady,
  subscribeToStatkiGame,
  type GameSettings,
} from '../../lib/statkiOnline'
import {
  canPlace,
  shipCells,
  randomPlacement,
  type Ship,
  type ShipDef,
} from '../../games/statki'

interface Props {
  gameId: string
  player: Player
  settings: GameSettings
  onBattleStart: () => void
}

interface PendingShip {
  id: number
  size: number
}

const COLS = 'ABCDEFGHIJ'

export default function StatkiPlacement({ gameId, player, settings, onBattleStart }: Props) {
  const boardSize = settings.boardSize

  // Build a flat list of ships to place (each with a unique id)
  const allShips: PendingShip[] = useMemo(() => {
    const list: PendingShip[] = []
    let id = 0
    const defs = [...settings.ships].sort((a, b) => b.size - a.size)
    for (const def of defs as ShipDef[]) {
      for (let i = 0; i < def.count; i++) list.push({ id: id++, size: def.size })
    }
    return list
  }, [settings.ships])

  const [placed, setPlaced] = useState<Record<number, Ship>>({})
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [horizontal, setHorizontal] = useState(true)
  const [previewCell, setPreviewCell] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const unsubRef = useRef<(() => void) | null>(null)

  const placedShips = useMemo(() => Object.values(placed), [placed])
  const allPlaced = placedShips.length === allShips.length

  // Select first unplaced ship on mount / change
  useEffect(() => {
    if (selectedId === null || placed[selectedId]) {
      const next = allShips.find(s => !placed[s.id])
      setSelectedId(next ? next.id : null)
    }
  }, [placed, allShips, selectedId])

  // After submitting, wait for battle to start
  useEffect(() => {
    if (!submitted) return
    unsubRef.current = subscribeToStatkiGame(gameId, game => {
      if (game.status === 'battle') {
        unsubRef.current?.()
        onBattleStart()
      }
    })
    return () => unsubRef.current?.()
  }, [submitted, gameId, onBattleStart])

  const selectedSize = selectedId !== null ? allShips.find(s => s.id === selectedId)?.size ?? 0 : 0

  function previewCells(originCell: number): number[] | null {
    if (selectedSize === 0) return null
    const row = Math.floor(originCell / boardSize)
    const col = originCell % boardSize
    return shipCells(row, col, selectedSize, horizontal, boardSize)
  }

  function handleCellClick(cell: number) {
    setError('')
    // Clicking a placed ship cell removes it
    const owner = placedShips.find(s => s.cells.includes(cell))
    if (owner) {
      const entry = Object.entries(placed).find(([, s]) => s.cells.includes(cell))
      if (entry) {
        const idNum = Number(entry[0])
        setPlaced(prev => {
          const next = { ...prev }
          delete next[idNum]
          return next
        })
        setSelectedId(idNum)
      }
      return
    }

    if (selectedId === null) return
    const cells = previewCells(cell)
    if (!cells) return
    // canPlace against other placed ships
    const others = placedShips
    if (!canPlace(others, cells, boardSize)) return

    const ship: Ship = { cells, size: selectedSize, horizontal, sunk: false }
    setPlaced(prev => ({ ...prev, [selectedId]: ship }))
  }

  function handleRandom() {
    setError('')
    const ships = randomPlacement(settings.ships, boardSize)
    if (ships.length === 0) {
      setError('Nie udało się rozmieścić losowo. Spróbuj ponownie.')
      return
    }
    // assign ships to ids by matching sizes
    const next: Record<number, Ship> = {}
    const pool = [...ships]
    for (const ps of allShips) {
      const idx = pool.findIndex(s => s.size === ps.size)
      if (idx >= 0) {
        next[ps.id] = pool[idx]
        pool.splice(idx, 1)
      }
    }
    setPlaced(next)
  }

  async function handleReady() {
    if (!allPlaced || submitted) return
    setError('')
    try {
      const ships = placedShips
      const totalShips = ships.reduce((sum, s) => sum + s.size, 0)
      await saveGrid(gameId, player.uid, ships)
      await setReady(gameId, player.uid, totalShips)
      setSubmitted(true)
    } catch {
      setError('Błąd zapisu. Spróbuj ponownie.')
    }
  }

  // Build cell state for rendering
  const occupiedByShip = new Set<number>()
  for (const s of placedShips) for (const c of s.cells) occupiedByShip.add(c)

  const preview = previewCell !== null ? previewCells(previewCell) : null
  const previewValid = preview ? canPlace(placedShips, preview, boardSize) : false
  const previewSet = new Set(preview ?? [])

  if (submitted) {
    return (
      <div className="online-setup-waiting">
        <div className="online-setup-spinner" />
        <div className="online-setup-waiting-text">Czekam na przeciwnika...</div>
        <div className="online-setup-waiting-sub">Flota gotowa do bitwy</div>
      </div>
    )
  }

  const cellPx = boardSize === 8 ? 34 : 30

  return (
    <div className="statki-game-content">
      <div className="statki-status">ROZMIESZCZANIE FLOTY</div>

      <div className="statki-ship-list">
        {allShips.map(s => (
          <div
            key={s.id}
            className={`statki-ship-item${selectedId === s.id ? ' selected' : ''}${placed[s.id] ? ' placed' : ''}`}
            onClick={() => { if (!placed[s.id]) setSelectedId(s.id) }}
          >
            {Array.from({ length: s.size }).map((_, i) => (
              <div key={i} className="statki-ship-cell" />
            ))}
          </div>
        ))}
      </div>

      <div className="statki-board-wrap">
        <div
          className="statki-grid-with-headers"
          style={{
            gridTemplateColumns: `${cellPx * 0.6}px repeat(${boardSize}, ${cellPx}px)`,
            justifyContent: 'center',
          }}
          onPointerLeave={() => setPreviewCell(null)}
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
                const isShip = occupiedByShip.has(cell)
                const isPreview = previewSet.has(cell)
                let cls = 'statki-cell'
                if (isShip) cls += ' ship'
                if (isPreview) cls += previewValid ? ' preview-valid' : ' preview-invalid'
                return (
                  <div
                    key={cell}
                    className={cls}
                    style={{ width: cellPx, height: cellPx }}
                    onPointerEnter={() => { if (selectedId !== null) setPreviewCell(cell) }}
                    onClick={() => handleCellClick(cell)}
                  >
                    {isShip ? '🚢' : ''}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <div className="statki-grid-label">Stuknij w pole, aby postawić statek. Stuknij w statek, aby go usunąć.</div>
      </div>

      {error && <div className="kolko-error">{error}</div>}

      <div className="statki-placement-controls">
        <button
          className="btn-secondary"
          onClick={() => setHorizontal(h => !h)}
          disabled={selectedId === null}
        >
          Obróć ({horizontal ? 'poziomo' : 'pionowo'})
        </button>
        <button className="btn-secondary" onClick={handleRandom}>Losuj</button>
        <button className="btn-yellow" onClick={handleReady} disabled={!allPlaced}>
          Gotowy
        </button>
      </div>
    </div>
  )
}
