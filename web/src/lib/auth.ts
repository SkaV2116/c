import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import {
  doc, getDoc, runTransaction, serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from './firebase'

export interface Player {
  uid: string
  username: string
  playerId: string  // e.g. "4839"
}

// Internal: convert username → fake email used in Firebase Auth
function toEmail(username: string) {
  return `${username.toLowerCase()}@iq-minigames.local`
}

// Generate a random 4-digit string, unique in Firestore
async function generatePlayerId(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const id = String(Math.floor(1000 + Math.random() * 9000))
    const snap = await getDoc(doc(db, 'playerIds', id))
    if (!snap.exists()) return id
  }
  throw new Error('Nie udało się wygenerować unikalnego ID gracza')
}

export async function register(username: string, password: string): Promise<Player> {
  // Check username uniqueness first
  const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()))
  if (usernameDoc.exists()) {
    throw new Error('Ta nazwa jest już zajęta')
  }

  // Create Firebase Auth account
  let userCred
  try {
    userCred = await createUserWithEmailAndPassword(auth, toEmail(username), password)
  } catch (e: any) {
    if (e.code === 'auth/email-already-in-use') throw new Error('Ta nazwa jest już zajęta')
    throw new Error('Błąd rejestracji. Spróbuj ponownie.')
  }

  const uid = userCred.user.uid
  const playerId = await generatePlayerId()

  // Save player data in a transaction
  await runTransaction(db, async (tx) => {
    tx.set(doc(db, 'players', uid), {
      username,
      playerId,
      createdAt: serverTimestamp(),
    })
    tx.set(doc(db, 'usernames', username.toLowerCase()), { uid, playerId })
    tx.set(doc(db, 'playerIds', playerId), { uid, username })
  })

  return { uid, username, playerId }
}

export async function login(username: string, password: string): Promise<Player> {
  let userCred
  try {
    userCred = await signInWithEmailAndPassword(auth, toEmail(username), password)
  } catch {
    throw new Error('Nieprawidłowy login lub hasło')
  }

  const uid = userCred.user.uid
  const snap = await getDoc(doc(db, 'players', uid))
  if (!snap.exists()) throw new Error('Nie znaleziono profilu gracza')

  const data = snap.data()
  return { uid, username: data.username, playerId: data.playerId }
}

export async function logout() {
  await signOut(auth)
}

export async function loadPlayerProfile(user: User): Promise<Player | null> {
  const snap = await getDoc(doc(db, 'players', user.uid))
  if (!snap.exists()) return null
  const data = snap.data()
  return { uid: user.uid, username: data.username, playerId: data.playerId }
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}
