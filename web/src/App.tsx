import { useState, useEffect } from 'react'
import Hub from './components/Hub'
import WyrazView from './components/wyraz/WyrazView'
import LevelSelect from './components/gwiazdki/LevelSelect'
import GwiazdkiGame from './components/gwiazdki/GwiazdkiGame'
import AuthScreen from './components/AuthScreen'
import KolkoMenu from './components/kolko/KolkoMenu'
import KolkoLocalGame from './components/kolko/KolkoLocalGame'
import KolkoAIGame from './components/kolko/KolkoAIGame'
import KolkoOnlineSetup from './components/kolko/KolkoOnlineSetup'
import KolkoOnlineGame from './components/kolko/KolkoOnlineGame'
import KolkoRanking from './components/kolko/KolkoRanking'
import InvitationListener from './components/InvitationListener'
import { onAuthChange, loadPlayerProfile, type Player } from './lib/auth'
import { setCurrentUid } from './lib/userStore'
import { loadProgressFromFirestore } from './lib/gameSync'

type Screen =
  | { id: 'hub' }
  | { id: 'wyraz' }
  | { id: 'gwiazdki-menu' }
  | { id: 'gwiazdki-game'; levelId: number }
  | { id: 'kolko-menu' }
  | { id: 'kolko-local' }
  | { id: 'kolko-ai' }
  | { id: 'kolko-online-setup' }
  | { id: 'kolko-online-game'; gameId: string }
  | { id: 'kolko-ranking' }

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
          <div className="auth-logo-title">MiniGamesIQ</div>
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
    else if (
      screen.id === 'kolko-local' ||
      screen.id === 'kolko-ai' ||
      screen.id === 'kolko-online-setup' ||
      screen.id === 'kolko-online-game' ||
      screen.id === 'kolko-ranking'
    ) setScreen({ id: 'kolko-menu' })
    else setScreen({ id: 'hub' })
  }

  return (
    <>
      <InvitationListener
        player={player}
        onGameAccepted={(id) => go({ id: 'kolko-online-game', gameId: id })}
      />
      {(() => {
        switch (screen.id) {
          case 'hub':
            return (
              <Hub
                player={player}
                onWyraz={() => go({ id: 'wyraz' })}
                onGwiazdki={() => go({ id: 'gwiazdki-menu' })}
                onKolko={() => go({ id: 'kolko-menu' })}
                onLogout={() => setPlayer(null)}
              />
            )
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
          case 'kolko-menu':
            return (
              <KolkoMenu
                player={player}
                onBack={() => go({ id: 'hub' })}
                onLocalGame={() => go({ id: 'kolko-local' })}
                onAIGame={() => go({ id: 'kolko-ai' })}
                onOnline={() => go({ id: 'kolko-online-setup' })}
                onRanking={() => go({ id: 'kolko-ranking' })}
              />
            )
          case 'kolko-local':
            return <KolkoLocalGame onBack={() => go({ id: 'kolko-menu' })} />
          case 'kolko-ai':
            return <KolkoAIGame onBack={() => go({ id: 'kolko-menu' })} />
          case 'kolko-online-setup':
            return (
              <KolkoOnlineSetup
                player={player}
                onBack={() => go({ id: 'kolko-menu' })}
                onGameStarted={(id) => go({ id: 'kolko-online-game', gameId: id })}
              />
            )
          case 'kolko-online-game':
            return (
              <KolkoOnlineGame
                gameId={screen.gameId}
                player={player}
                onBack={() => go({ id: 'kolko-menu' })}
              />
            )
          case 'kolko-ranking':
            return (
              <KolkoRanking
                player={player}
                onBack={() => go({ id: 'kolko-menu' })}
              />
            )
        }
      })()}
    </>
  )
}
