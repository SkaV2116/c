import { db } from './firebase'
import {
  doc, setDoc, updateDoc, onSnapshot, getDoc, runTransaction,
  collection, query, orderBy, limit, getDocs, increment, deleteDoc,
} from 'firebase/firestore'
import type { Player } from './auth'
import type { Ship, ShipDef, BoardSize } from '../games/statki'
import type { Invitation } from './kolkoOnline'

export type GameStatus = 'pending' | 'placement' | 'battle' | 'finished' | 'declined'

export interface GameSettings {
  boardSize: BoardSize
  configName: 'standard' | 'simplified' | 'custom'
  ships: ShipDef[]  // fleet composition
}

export interface ShotRecord {
  idx: number
  shooterUid: string
  result: 'hit' | 'miss'
  sunkShipCells?: number[]
}

export interface StatkiGame {
  id: string
  creatorUid: string
  creatorUsername: string
  creatorPlayerId: string
  opponentUid: string
  opponentUsername: string
  opponentPlayerId: string
  status: GameStatus
  settings: GameSettings

  // Who is ready in placement phase
  readyUids: string[]

  // Shots — each entry is a shot by the SHOOTER on DEFENDER's grid
  shots: ShotRecord[]

  // Pending shot waiting for defender to validate
  pendingShot: { idx: number; shooterUid: string } | null

  // How many ship cells each player has remaining (cells not yet hit)
  creatorShipsLeft: number
  opponentShipsLeft: number

  currentTurnUid: string  // who shoots next
  winnerUid: string | null

  // Disconnect handling
  abandonRequestUid: string | null
  lastMoveAt: number

  createdAt: number
  updatedAt: number
}

export interface StatkiRankingEntry {
  uid: string
  username: string
  playerId: string
  wins: number
  hits: number
  received: number
  gamesPlayed: number
}

function generateGameId(): string {
  return 'statki_' + Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function totalShipCells(ships: ShipDef[]): number {
  return ships.reduce((sum, s) => sum + s.size * s.count, 0)
}

function settingsDisplay(settings: GameSettings): string {
  const sizeLabel = `${settings.boardSize}×${settings.boardSize}`
  const fleetLabel =
    settings.configName === 'standard' ? 'Polski Standard'
    : settings.configName === 'simplified' ? 'Uproszczony'
    : 'Własna flota'
  return `${sizeLabel} · ${fleetLabel}`
}

export async function createStatkiGame(
  creator: Player,
  opponentUid: string,
  opponentUsername: string,
  opponentPlayerId: string,
  settings: GameSettings,
): Promise<string> {
  const gameId = generateGameId()
  const now = Date.now()
  const cells = totalShipCells(settings.ships)

  const game: Omit<StatkiGame, 'id'> = {
    creatorUid: creator.uid,
    creatorUsername: creator.username,
    creatorPlayerId: creator.playerId,
    opponentUid,
    opponentUsername,
    opponentPlayerId,
    status: 'pending',
    settings,
    readyUids: [],
    shots: [],
    pendingShot: null,
    creatorShipsLeft: cells,
    opponentShipsLeft: cells,
    currentTurnUid: opponentUid,  // invited player goes first
    winnerUid: null,
    abandonRequestUid: null,
    lastMoveAt: now,
    createdAt: now,
    updatedAt: now,
  }

  await setDoc(doc(db, 'battleshipGames', gameId), game)

  const invitation: Invitation = {
    gameId,
    gameType: 'statki',
    creatorUid: creator.uid,
    creatorUsername: creator.username,
    creatorPlayerId: creator.playerId,
    settingsDisplay: settingsDisplay(settings),
    createdAt: now,
  }
  await setDoc(doc(db, 'invitations', opponentUid, 'pending', gameId), invitation)

  return gameId
}

export async function acceptStatkiInvitation(gameId: string, opponentUid: string): Promise<void> {
  await updateDoc(doc(db, 'battleshipGames', gameId), {
    status: 'placement',
    updatedAt: Date.now(),
  })
  await deleteDoc(doc(db, 'invitations', opponentUid, 'pending', gameId))
}

export async function declineStatkiInvitation(gameId: string, opponentUid: string): Promise<void> {
  await updateDoc(doc(db, 'battleshipGames', gameId), {
    status: 'declined',
    updatedAt: Date.now(),
  })
  await deleteDoc(doc(db, 'invitations', opponentUid, 'pending', gameId))
}

export async function saveGrid(gameId: string, uid: string, ships: Ship[]): Promise<void> {
  await setDoc(doc(db, 'battleshipGames', gameId, 'grids', uid), {
    ships: ships.map(s => ({
      cells: s.cells,
      size: s.size,
      horizontal: s.horizontal,
      sunk: s.sunk,
    })),
    savedAt: Date.now(),
  })
}

export async function loadGrid(gameId: string, uid: string): Promise<Ship[] | null> {
  const snap = await getDoc(doc(db, 'battleshipGames', gameId, 'grids', uid))
  if (!snap.exists()) return null
  const data = snap.data()
  return (data.ships as Ship[]) ?? null
}

export async function setReady(gameId: string, uid: string, totalShips: number): Promise<void> {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, 'battleshipGames', gameId)
    const snap = await tx.get(ref)
    if (!snap.exists()) return
    const game = snap.data() as Omit<StatkiGame, 'id'>
    const ready = new Set(game.readyUids ?? [])
    ready.add(uid)
    const readyUids = Array.from(ready)

    const update: Record<string, unknown> = {
      readyUids,
      // keep ship-cell counts in sync with actual fleet
      ...(uid === game.creatorUid ? { creatorShipsLeft: totalShips } : { opponentShipsLeft: totalShips }),
      updatedAt: Date.now(),
    }

    if (readyUids.length === 2) {
      update.status = 'battle'
      update.currentTurnUid = game.opponentUid  // invited goes first
      update.lastMoveAt = Date.now()
    }

    tx.update(ref, update)
  })
}

export async function submitShot(gameId: string, cellIdx: number, shooterUid: string): Promise<void> {
  await updateDoc(doc(db, 'battleshipGames', gameId), {
    pendingShot: { idx: cellIdx, shooterUid },
    lastMoveAt: Date.now(),
    updatedAt: Date.now(),
  })
}

export async function validateShot(
  gameId: string,
  _game: StatkiGame,
  defenderShips: Ship[],
  defenderUid: string,
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, 'battleshipGames', gameId)
    const snap = await tx.get(ref)
    if (!snap.exists()) return
    const game = snap.data() as Omit<StatkiGame, 'id'>

    const pending = game.pendingShot
    if (!pending) return
    // only defender validates, and only once
    if (pending.shooterUid === defenderUid) return

    const idx = pending.idx
    const shooterUid = pending.shooterUid
    const now = Date.now()

    // Build set of already-hit cells on the defender's grid from past shots
    const hitCells = new Set<number>()
    for (const s of game.shots ?? []) {
      if (s.shooterUid === shooterUid && s.result === 'hit') hitCells.add(s.idx)
    }

    // Find which ship (if any) this shot hits
    const hitShip = defenderShips.find(sh => sh.cells.includes(idx))
    const result: 'hit' | 'miss' = hitShip ? 'hit' : 'miss'

    let sunkShipCells: number[] | undefined
    if (hitShip) {
      hitCells.add(idx)
      const sunk = hitShip.cells.every(c => hitCells.has(c))
      if (sunk) sunkShipCells = hitShip.cells
    }

    const record: ShotRecord = { idx, shooterUid, result }
    if (sunkShipCells) record.sunkShipCells = sunkShipCells

    const newShots = [...(game.shots ?? []), record]

    // Decrement defender's remaining ship cells on a hit
    const defenderIsCreator = defenderUid === game.creatorUid
    let creatorShipsLeft = game.creatorShipsLeft
    let opponentShipsLeft = game.opponentShipsLeft
    if (result === 'hit') {
      if (defenderIsCreator) creatorShipsLeft = Math.max(0, creatorShipsLeft - 1)
      else opponentShipsLeft = Math.max(0, opponentShipsLeft - 1)
    }

    const defenderShipsLeft = defenderIsCreator ? creatorShipsLeft : opponentShipsLeft
    const allDefenderSunk = result === 'hit' && defenderShipsLeft === 0

    const update: Record<string, unknown> = {
      shots: newShots,
      pendingShot: null,
      creatorShipsLeft,
      opponentShipsLeft,
      lastMoveAt: now,
      updatedAt: now,
    }

    if (allDefenderSunk) {
      update.status = 'finished'
      update.winnerUid = shooterUid
    } else if (result === 'hit') {
      // shooter shoots again
      update.currentTurnUid = shooterUid
    } else {
      // miss: turn passes to defender
      update.currentTurnUid = defenderUid
    }

    tx.update(ref, update)
  })
}

export async function requestAbandon(gameId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'battleshipGames', gameId), {
    abandonRequestUid: uid,
    updatedAt: Date.now(),
  })
}

export async function acceptAbandon(
  gameId: string,
  winnerUid: string,
  _loserUid: string,
  _game: StatkiGame,
): Promise<void> {
  await updateDoc(doc(db, 'battleshipGames', gameId), {
    status: 'finished',
    winnerUid,
    abandonRequestUid: null,
    updatedAt: Date.now(),
  })
}

export async function declineAbandon(gameId: string): Promise<void> {
  await updateDoc(doc(db, 'battleshipGames', gameId), {
    abandonRequestUid: null,
    updatedAt: Date.now(),
  })
}

export async function saveStatkiRanking(
  uid: string,
  username: string,
  playerId: string,
  won: boolean,
  hits: number,
  received: number,
): Promise<void> {
  await setDoc(
    doc(db, 'statkiRanking', uid),
    {
      uid,
      username,
      playerId,
      wins: increment(won ? 1 : 0),
      hits: increment(hits),
      received: increment(received),
      gamesPlayed: increment(1),
    },
    { merge: true },
  )
}

export async function fetchStatkiRanking(): Promise<StatkiRankingEntry[]> {
  const q = query(
    collection(db, 'statkiRanking'),
    orderBy('wins', 'desc'),
    limit(50),
  )
  const snap = await getDocs(q)
  const entries = snap.docs.map(d => d.data() as StatkiRankingEntry)
  // tiebreaker: hits desc
  entries.sort((a, b) => (b.wins - a.wins) || (b.hits - a.hits))
  return entries
}

export function subscribeToStatkiGame(gameId: string, cb: (game: StatkiGame) => void): () => void {
  return onSnapshot(doc(db, 'battleshipGames', gameId), snap => {
    if (snap.exists()) {
      cb({ id: snap.id, ...snap.data() } as StatkiGame)
    }
  })
}

export async function lookupPlayerById(playerId: string): Promise<{ uid: string; username: string } | null> {
  const snap = await getDoc(doc(db, 'playerIds', playerId))
  if (!snap.exists()) return null
  return snap.data() as { uid: string; username: string }
}

export async function cancelStatkiGame(gameId: string, opponentUid: string): Promise<void> {
  await updateDoc(doc(db, 'battleshipGames', gameId), {
    status: 'declined',
    updatedAt: Date.now(),
  })
  try {
    await deleteDoc(doc(db, 'invitations', opponentUid, 'pending', gameId))
  } catch {
    // ignore
  }
}
