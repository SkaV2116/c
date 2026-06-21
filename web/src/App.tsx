import { useState, useEffect } from 'react'
import PodręcznikHome from './components/PodręcznikHome'
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
import StatkiMenu from './components/statki/StatkiMenu'
import StatkiSetup from './components/statki/StatkiSetup'
import StatkiGame from './components/statki/StatkiGame'
import StatkiRanking from './components/statki/StatkiRanking'
import InvitationListener from './components/InvitationListener'
import { onAuthChange, loadPlayerProfile, isEmailVerificationPending, type Player } from './lib/auth'
import { setCurrentUid } from './lib/userStore'
import { loadProgressFromFirestore } from './lib/gameSync'

type Screen =
  | { id: 'podnik' }
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
  | { id: 'statki-menu' }
  | { id: 'statki-setup' }
  | { id: 'statki-game'; gameId: string }
  | { id: 'statki-ranking' }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ id: 'podnik' })
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
          <div className="auth-logo-icon">📖</div>
          <div className="auth-logo-title">Podręcznik</div>
        </div>
        <div className="auth-loading">Ładowanie…</div>
      </div>
    )
  }

  const handleAuth = async (p: Player) => {
    setCurrentUid(p.uid)
    await loadProgressFromFirestore(p.uid)
    setPlayer(p)
    setScreen({ id: 'podnik' })
  }

  if (!player) {
    return (
      <AuthScreen
        initialVerificationPending={isEmailVerificationPending()}
        onAuth={handleAuth}
      />
    )
  }

  const go = (s: Screen) => setScreen(s)
  const back = () => {
    if (screen.id === 'hub') setScreen({ id: 'podnik' })
    else if (screen.id === 'gwiazdki-game') setScreen({ id: 'gwiazdki-menu' })
    else if (
      screen.id === 'kolko-local' ||
      screen.id === 'kolko-ai' ||
      screen.id === 'kolko-online-setup' ||
      screen.id === 'kolko-online-game' ||
      screen.id === 'kolko-ranking'
    ) setScreen({ id: 'kolko-menu' })
    else if (
      screen.id === 'statki-setup' ||
      screen.id === 'statki-game' ||
      screen.id === 'statki-ranking'
    ) setScreen({ id: 'statki-menu' })
    else if (
      screen.id === 'kolko-menu' ||
      screen.id === 'gwiazdki-menu' ||
      screen.id === 'wyraz' ||
      screen.id === 'statki-menu'
    ) setScreen({ id: 'hub' })
    else setScreen({ id: 'podnik' })
  }

  return (
    <>
      <InvitationListener
        player={player}
        onGameAccepted={(id, type) => {
          if (type === 'kolko') go({ id: 'kolko-online-game', gameId: id })
          else if (type === 'statki') go({ id: 'statki-game', gameId: id })
        }}
      />
      {(() => {
        switch (screen.id) {
          case 'podnik':
            return (
              <PodręcznikHome
                player={player}
                onApp={(id) => {
                  if (id === 'minigamesiq') go({ id: 'hub' })
                }}
              />
            )
          case 'hub':
            return (
              <Hub
                player={player}
                onBack={() => go({ id: 'podnik' })}
                onWyraz={() => go({ id: 'wyraz' })}
                onGwiazdki={() => go({ id: 'gwiazdki-menu' })}
                onKolko={() => go({ id: 'kolko-menu' })}
                onStatki={() => go({ id: 'statki-menu' })}
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
                onBack={back}
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
          case 'statki-menu':
            return (
              <StatkiMenu
                player={player}
                onBack={back}
                onSetup={() => go({ id: 'statki-setup' })}
                onRanking={() => go({ id: 'statki-ranking' })}
              />
            )
          case 'statki-setup':
            return (
              <StatkiSetup
                player={player}
                onBack={() => go({ id: 'statki-menu' })}
                onGameStarted={(id) => go({ id: 'statki-game', gameId: id })}
              />
            )
          case 'statki-game':
            return (
              <StatkiGame
                gameId={screen.gameId}
                player={player}
                onBack={() => go({ id: 'statki-menu' })}
              />
            )
          case 'statki-ranking':
            return (
              <StatkiRanking
                player={player}
                onBack={() => go({ id: 'statki-menu' })}
              />
            )
        }
      })()}
    </>
  )
}
