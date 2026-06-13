import { useState, useEffect } from 'react'
import Hub from './components/Hub'
import WyrazView from './components/wyraz/WyrazView'
import LevelSelect from './components/gwiazdki/LevelSelect'
import GwiazdkiGame from './components/gwiazdki/GwiazdkiGame'
import AuthScreen from './components/AuthScreen'
import { onAuthChange, loadPlayerProfile, type Player } from './lib/auth'
import { setCurrentUid } from './lib/userStore'
import { loadProgressFromFirestore } from './lib/gameSync'

type Screen =
  | { id: 'hub' }
  | { id: 'wyraz' }
  | { id: 'gwiazdki-menu' }
  | { id: 'gwiazdki-game'; levelId: number }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ id: 'hub' })
  const [player, setPlayer] = useState<Player | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (user) {
        const p = await loadPlayerProfile(user)
        if (p) {
          setCurrentUid(p.uid)
          await loadProgressFromFirestore(p.uid)
        }
        setPlayer(p)
      } else {
        setCurrentUid('')
        setPlayer(null)
      }
      setAuthLoading(false)
    })
    return unsub
  }, [])

  if (authLoading) {
    return (
      <div className="screen auth-screen">
        <div className="auth-logo">
          <div className="auth-logo-icon">🎮</div>
          <div className="auth-logo-title">Mini Gry</div>
        </div>
        <div className="auth-loading">Ładowanie…</div>
      </div>
    )
  }

  const handleAuth = async (p: Player) => {
    setCurrentUid(p.uid)
    await loadProgressFromFirestore(p.uid)
    setPlayer(p)
  }

  if (!player) {
    return <AuthScreen onAuth={handleAuth} />
  }

  const go = (s: Screen) => setScreen(s)
  const back = () => {
    if (screen.id === 'gwiazdki-game') setScreen({ id: 'gwiazdki-menu' })
    else setScreen({ id: 'hub' })
  }

  switch (screen.id) {
    case 'hub':
      return <Hub player={player} onWyraz={() => go({ id: 'wyraz' })} onGwiazdki={() => go({ id: 'gwiazdki-menu' })} onLogout={() => setPlayer(null)} />
    case 'wyraz':
      return <WyrazView uid={player.uid} onBack={back} />
    case 'gwiazdki-menu':
      return <LevelSelect onBack={back} onLevel={(id) => go({ id: 'gwiazdki-game', levelId: id })} />
    case 'gwiazdki-game':
      return (
        <GwiazdkiGame
          uid={player.uid}
          levelId={screen.levelId}
          onBack={back}
          onMenu={() => go({ id: 'hub' })}
        />
      )
  }
}
