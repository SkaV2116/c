import { db } from './firebase'
import {
  doc, setDoc, updateDoc, onSnapshot, getDoc,
  collection, query, orderBy, limit, getDocs,
  increment, deleteDoc,
} from 'firebase/firestore'
import type { Player } from './auth'
import { emptyBoard, checkWinner, type Mark } from '../games/kolko'

export interface OnlineGame {
  id: string
  creatorUid: string
  creatorUsername: string
  creatorPlayerId: string
  opponentUid: string
  opponentUsername: string
  opponentPlayerId: string
  status: 'pending' | 'active' | 'finished' | 'declined'
  totalRounds: number  // 0 = unlimited
  currentRound: number
  roundsWon: Record<string, number>  // uid -> rounds won
  board: Mark[]
  currentTurnUid: string
  xUid: string  // who plays X this round
  endGameRequestUid: string | null
  createdAt: number
  updatedAt: number
}

export interface Invitation {
  gameId: string
  creatorUid: string
  creatorUsername: string
  creatorPlayerId: string
  totalRounds: number
  createdAt: number
}

export interface RankingEntry {
  uid: string
  username: string
  playerId: string
  totalPoints: number
  gamesPlayed: number
}

function generateGameId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export async function createOnlineGame(
  creator: Player,
  opponentUid: string,
  opponentUsername: string,
  opponentPlayerId: string,
  totalRounds: number,
): Promise<string> {
  const gameId = generateGameId()
  const now = Date.now()

  const game: Omit<OnlineGame, 'id'> = {
    creatorUid: creator.uid,
    creatorUsername: creator.username,
    creatorPlayerId: creator.playerId,
    opponentUid,
    opponentUsername,
    opponentPlayerId,
    status: 'pending',
    totalRounds,
    currentRound: 1,
    roundsWon: { [creator.uid]: 0, [opponentUid]: 0 },
    board: emptyBoard(),
    currentTurnUid: creator.uid,
    xUid: creator.uid,  // creator is X in round 1
    endGameRequestUid: null,
    createdAt: now,
    updatedAt: now,
  }

  await setDoc(doc(db, 'games', gameId), game)

  // Create invitation
  const invitation: Invitation = {
    gameId,
    creatorUid: creator.uid,
    creatorUsername: creator.username,
    creatorPlayerId: creator.playerId,
    totalRounds,
    createdAt: now,
  }
  await setDoc(doc(db, 'invitations', opponentUid, 'pending', gameId), invitation)

  return gameId
}

export async function acceptInvitation(gameId: string, opponentUid: string): Promise<void> {
  await updateDoc(doc(db, 'games', gameId), {
    status: 'active',
    updatedAt: Date.now(),
  })
  await deleteDoc(doc(db, 'invitations', opponentUid, 'pending', gameId))
}

export async function declineInvitation(gameId: string, opponentUid: string): Promise<void> {
  await updateDoc(doc(db, 'games', gameId), {
    status: 'declined',
    updatedAt: Date.now(),
  })
  await deleteDoc(doc(db, 'invitations', opponentUid, 'pending', gameId))
}

export async function makeMove(
  gameId: string,
  cellIndex: number,
  game: OnlineGame,
  playerUid: string,
): Promise<void> {
  const newBoard = [...game.board] as Mark[]
  const mark: Mark = game.xUid === playerUid ? 'X' : 'O'
  newBoard[cellIndex] = mark

  const result = checkWinner(newBoard)

  if (result !== null) {
    // Round ended
    const newRoundsWon = { ...game.roundsWon }
    if (result === 'X') {
      newRoundsWon[game.xUid] = (newRoundsWon[game.xUid] ?? 0) + 1
    } else if (result === 'O') {
      const oUid = game.xUid === game.creatorUid ? game.opponentUid : game.creatorUid
      newRoundsWon[oUid] = (newRoundsWon[oUid] ?? 0) + 1
    }
    // draw: nobody gets a point

    const nextRound = game.currentRound + 1
    const isGameOver = game.totalRounds !== 0 && nextRound > game.totalRounds

    if (isGameOver) {
      await updateDoc(doc(db, 'games', gameId), {
        board: newBoard,
        roundsWon: newRoundsWon,
        status: 'finished',
        updatedAt: Date.now(),
      })
    } else {
      // Next round: swap xUid
      const newXUid = game.xUid === game.creatorUid ? game.opponentUid : game.creatorUid
      // In odd rounds: opponent goes first; in even rounds: creator goes first
      const newCurrentTurnUid = nextRound % 2 !== 0 ? game.opponentUid : game.creatorUid

      await updateDoc(doc(db, 'games', gameId), {
        board: emptyBoard(),
        roundsWon: newRoundsWon,
        currentRound: nextRound,
        xUid: newXUid,
        currentTurnUid: newCurrentTurnUid,
        updatedAt: Date.now(),
      })
    }
  } else {
    // Normal move: switch turn
    const nextTurnUid = game.currentTurnUid === game.creatorUid
      ? game.opponentUid
      : game.creatorUid

    await updateDoc(doc(db, 'games', gameId), {
      board: newBoard,
      currentTurnUid: nextTurnUid,
      updatedAt: Date.now(),
    })
  }
}

export async function proposeEndGame(gameId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'games', gameId), {
    endGameRequestUid: uid,
    updatedAt: Date.now(),
  })
}

export async function acceptEndGame(gameId: string): Promise<void> {
  await updateDoc(doc(db, 'games', gameId), {
    status: 'finished',
    endGameRequestUid: null,
    updatedAt: Date.now(),
  })
}

export async function declineEndGame(gameId: string): Promise<void> {
  await updateDoc(doc(db, 'games', gameId), {
    endGameRequestUid: null,
    updatedAt: Date.now(),
  })
}

export async function saveRankingResult(
  uid: string,
  username: string,
  playerId: string,
  roundsWon: number,
): Promise<void> {
  await setDoc(
    doc(db, 'ranking', uid),
    {
      uid,
      username,
      playerId,
      totalPoints: increment(roundsWon),
      gamesPlayed: increment(1),
    },
    { merge: true },
  )
}

export async function fetchRanking(): Promise<RankingEntry[]> {
  const q = query(
    collection(db, 'ranking'),
    orderBy('totalPoints', 'desc'),
    limit(50),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as RankingEntry)
}

export function subscribeToGame(gameId: string, cb: (game: OnlineGame) => void): () => void {
  return onSnapshot(doc(db, 'games', gameId), snap => {
    if (snap.exists()) {
      cb({ id: snap.id, ...snap.data() } as OnlineGame)
    }
  })
}

export function subscribeToInvitations(uid: string, cb: (invs: Invitation[]) => void): () => void {
  const q = query(collection(db, 'invitations', uid, 'pending'))
  return onSnapshot(q, snap => {
    const invs = snap.docs.map(d => d.data() as Invitation)
    cb(invs)
  })
}

// Lookup opponent by playerId
export async function lookupPlayerById(playerId: string): Promise<{ uid: string; username: string } | null> {
  const snap = await getDoc(doc(db, 'playerIds', playerId))
  if (!snap.exists()) return null
  return snap.data() as { uid: string; username: string }
}

// Cancel a pending game (creator cancels before opponent responds)
export async function cancelGame(gameId: string, opponentUid: string): Promise<void> {
  await updateDoc(doc(db, 'games', gameId), {
    status: 'declined',
    updatedAt: Date.now(),
  })
  try {
    await deleteDoc(doc(db, 'invitations', opponentUid, 'pending', gameId))
  } catch {
    // Ignore if already deleted
  }
}
