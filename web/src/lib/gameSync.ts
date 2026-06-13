import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

export async function loadProgressFromFirestore(uid: string): Promise<void> {
  try {
    const [gSnap, wSnap] = await Promise.all([
      getDoc(doc(db, 'players', uid, 'progress', 'gwiazdki')),
      getDoc(doc(db, 'players', uid, 'progress', 'wyraz')),
    ])

    if (gSnap.exists()) {
      const d = gSnap.data()
      localStorage.setItem(`${uid}:gwiazdki_completed`, JSON.stringify(d.completed ?? []))
      localStorage.setItem(`${uid}:gwiazdki_times`,    JSON.stringify(d.times ?? {}))
    }

    if (wSnap.exists()) {
      const d = wSnap.data()
      localStorage.setItem(`${uid}:wyraz_streak`,  String(d.streakCount ?? 0))
      localStorage.setItem(`${uid}:wyraz_lastwin`, d.lastWin ?? '')
    }
  } catch (e) {
    console.warn('loadProgress failed (offline?):', e)
  }
}

export async function syncGwiazdkiProgress(uid: string): Promise<void> {
  try {
    const completed = JSON.parse(localStorage.getItem(`${uid}:gwiazdki_completed`) ?? '[]')
    const times     = JSON.parse(localStorage.getItem(`${uid}:gwiazdki_times`)     ?? '{}')
    await setDoc(doc(db, 'players', uid, 'progress', 'gwiazdki'), { completed, times })
  } catch (e) {
    console.warn('syncGwiazdki failed:', e)
  }
}

export async function syncWyrazProgress(uid: string): Promise<void> {
  try {
    const streakCount = parseInt(localStorage.getItem(`${uid}:wyraz_streak`)  ?? '0', 10)
    const lastWin     = localStorage.getItem(`${uid}:wyraz_lastwin`) ?? ''
    await setDoc(doc(db, 'players', uid, 'progress', 'wyraz'), { streakCount, lastWin })
  } catch (e) {
    console.warn('syncWyraz failed:', e)
  }
}
