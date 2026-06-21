import { useState } from 'react'
import { logout, type Player } from '../lib/auth'

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
  onLogout: () => void
}

export default function PodręcznikHome({ player, onApp, onLogout }: Props) {
  const [showLogout, setShowLogout] = useState(false)

  const displayName = player.username.length > 16
    ? player.username.slice(0, 15) + '…'
    : player.username

  const handleLogout = async () => {
    await logout()
    onLogout()
  }

  return (
    <div className="screen podnik-screen">
      <div className="podnik-topbar">
        <span className="podnik-brand">Pod-Ręcznik</span>
        <div className="podnik-player" onClick={() => setShowLogout(v => !v)}>
          <div className="podnik-player-avatar">{player.username[0].toUpperCase()}</div>
          <div className="podnik-player-info">
            <div className="podnik-player-name">{displayName}</div>
            <div className="podnik-player-id">#{player.playerId}</div>
          </div>
        </div>
      </div>

      {showLogout && (
        <div className="podnik-logout-bar">
          <span className="podnik-logout-hint">{player.email}</span>
          <button className="podnik-logout-btn" onClick={handleLogout}>Wyloguj</button>
        </div>
      )}

      <div className="podnik-icons">
        {APPS.map(app => (
          <div
            key={app.id}
            className="podnik-icon-wrap"
            onClick={() => onApp(app.id)}
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
