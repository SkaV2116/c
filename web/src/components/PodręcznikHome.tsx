import type { Player } from '../lib/auth'

interface AppIcon {
  id: string
  label: string
  emoji: string
  gradient: string
}

const APPS: AppIcon[] = [
  {
    id: 'minigamesiq',
    label: 'MiniGamesIQ',
    emoji: '🎮',
    gradient: 'linear-gradient(145deg, #667eea 0%, #764ba2 100%)',
  },
]

interface Props {
  player: Player
  onApp: (id: string) => void
}

export default function PodręcznikHome({ player, onApp }: Props) {
  return (
    <div className="screen podnik-screen">
      <div className="podnik-topbar">
        <span className="podnik-brand">Pod-ręcznik</span>
        <span className="podnik-uid">#{player.playerId}</span>
      </div>

      <div className="podnik-icons">
        {APPS.map(app => (
          <div
            key={app.id}
            className="podnik-icon-wrap"
            onPointerDown={() => onApp(app.id)}
          >
            <div
              className="podnik-icon"
              style={{ background: app.gradient }}
            >
              {app.emoji}
            </div>
            <div className="podnik-icon-label">{app.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
