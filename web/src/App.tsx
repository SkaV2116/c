import { useState } from 'react'
import Hub from './components/Hub'
import WyrazView from './components/wyraz/WyrazView'
import LevelSelect from './components/gwiazdki/LevelSelect'
import GwiazdkiGame from './components/gwiazdki/GwiazdkiGame'

type Screen =
  | { id: 'hub' }
  | { id: 'wyraz' }
  | { id: 'gwiazdki-menu' }
  | { id: 'gwiazdki-game'; levelId: number }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ id: 'hub' })

  const go = (s: Screen) => setScreen(s)
  const back = () => {
    if (screen.id === 'gwiazdki-game') setScreen({ id: 'gwiazdki-menu' })
    else setScreen({ id: 'hub' })
  }

  switch (screen.id) {
    case 'hub':
      return <Hub onWyraz={() => go({ id: 'wyraz' })} onGwiazdki={() => go({ id: 'gwiazdki-menu' })} />
    case 'wyraz':
      return <WyrazView onBack={back} />
    case 'gwiazdki-menu':
      return <LevelSelect onBack={back} onLevel={(id) => go({ id: 'gwiazdki-game', levelId: id })} />
    case 'gwiazdki-game':
      return (
        <GwiazdkiGame
          levelId={screen.levelId}
          onBack={back}
          onNext={() => go({ id: 'gwiazdki-game', levelId: screen.levelId + 1 })}
          onMenu={() => go({ id: 'hub' })}
        />
      )
  }
}
