import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyB0lQ1cCZnJhs-gEYZqrenNkSSzsc7_FqM",
  authDomain: "iq---minigames.firebaseapp.com",
  projectId: "iq---minigames",
  storageBucket: "iq---minigames.firebasestorage.app",
  messagingSenderId: "249460611255",
  appId: "1:249460611255:web:3ecda7f06e5a2ed7139532",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
