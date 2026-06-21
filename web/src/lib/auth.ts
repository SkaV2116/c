import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  type User,
} from 'firebase/auth'
import {
  doc, getDoc, runTransaction, serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from './firebase'

export interface Player {
  uid: string
  email: string
  username: string   // email prefix before @, kept for game compat
  playerId: string
}

function emailPrefix(email: string): string {
  return email.split('@')[0]
}

async function generatePlayerId(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const id = String(Math.floor(1000 + Math.random() * 9000))
    const snap = await getDoc(doc(db, 'playerIds', id))
    if (!snap.exists()) return id
  }
  throw new Error('Nie udało się wygenerować unikalnego ID')
}

export async function register(email: string, password: string): Promise<void> {
  let userCred
  try {
    userCred = await createUserWithEmailAndPassword(auth, email, password)
  } catch (e: any) {
    if (e.code === 'auth/email-already-in-use') throw new Error('Ten adres email jest już zajęty')
    if (e.code === 'auth/weak-password') throw new Error('Hasło musi mieć co najmniej 8 znaków')
    if (e.code === 'auth/invalid-email') throw new Error('Nieprawidłowy adres email')
    throw new Error('Błąd rejestracji. Spróbuj ponownie.')
  }

  const uid = userCred.user.uid
  const username = emailPrefix(email)
  const playerId = await generatePlayerId()

  await runTransaction(db, async (tx) => {
    tx.set(doc(db, 'players', uid), {
      email,
      username,
      playerId,
      createdAt: serverTimestamp(),
    })
    tx.set(doc(db, 'playerIds', playerId), { uid, username })
  })

  await sendEmailVerification(userCred.user)
}

export async function login(email: string, password: string): Promise<Player> {
  let userCred
  try {
    userCred = await signInWithEmailAndPassword(auth, email, password)
  } catch {
    throw new Error('Nieprawidłowy email lub hasło')
  }

  if (!userCred.user.emailVerified) {
    throw new Error('UNVERIFIED')
  }

  const snap = await getDoc(doc(db, 'players', userCred.user.uid))
  if (!snap.exists()) throw new Error('Nie znaleziono profilu gracza')
  const data = snap.data()
  return {
    uid: userCred.user.uid,
    email: data.email ?? email,
    username: data.username ?? emailPrefix(email),
    playerId: data.playerId,
  }
}

export async function resendVerification(): Promise<void> {
  const user = auth.currentUser
  if (!user) throw new Error('Nie jesteś zalogowany')
  await sendEmailVerification(user)
}

export async function checkVerified(): Promise<Player | null> {
  const user = auth.currentUser
  if (!user) return null
  await user.reload()
  if (!user.emailVerified) return null
  return loadPlayerProfile(user)
}

export function isEmailVerificationPending(): boolean {
  const u = auth.currentUser
  return !!(u && !u.emailVerified)
}

export async function logout() {
  await signOut(auth)
}

export async function loadPlayerProfile(user: User): Promise<Player | null> {
  if (!user.emailVerified) return null
  const snap = await getDoc(doc(db, 'players', user.uid))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    uid: user.uid,
    email: data.email ?? '',
    username: data.username ?? emailPrefix(data.email ?? ''),
    playerId: data.playerId,
  }
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}
