import { useState } from 'react'
import { loadStreak, loadBoard, todayKey } from '../games/wyraz'
import { loadCompleted } from '../games/gwiazdki'
import { logout, type Player } from '../lib/auth'

interface Props {
  player: Player
  onBack: () => void
  onWyraz: () => void
  onGwiazdki: () => void
  onKolko: () => void
  onStatki: () => void
  onLogout: () => void
}

export default function Hub({ player, onBack, onWyraz, onGwiazdki, onKolko, onStatki, onLogout }: Props) {
  const [showLogout, setShowLogout] = useState(false)

  const streak = loadStreak()
  const board = loadBoard()
  const completedToday = board?.gameState !== 'playing' && board?.dateKey === todayKey()
  const completed = loadCompleted()
  const progress = completed.size

  const today = new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })

  const handleLogout = async () => {
    await logout()
    onLogout()
  }

  const displayName = player.username.length > 14
    ? player.username.slice(0, 13) + '…'
    : player.username

  return (
    <div className="screen hub">
      <div className="hub-topbar">
        <button className="hub-back-to-podnik" onClick={onBack}>‹ Podręcznik</button>
        <div className="hub-player" onClick={() => setShowLogout(v => !v)}>
          <div className="hub-player-avatar">{player.username[0].toUpperCase()}</div>
          <div className="hub-player-info">
            <div className="hub-player-name">{displayName}</div>
            <div className="hub-player-id">#{player.playerId}</div>
          </div>
        </div>
      </div>

      {showLogout && (
        <div className="hub-logout-bar">
          <span className="hub-logout-hint">{player.email} #{player.playerId}</span>
          <button className="hub-logout-btn" onClick={handleLogout}>Wyloguj</button>
        </div>
      )}

      <div className="hub-header">
        <div className="hub-title">MiniGamesIQ</div>
        <div className="hub-date">{today}</div>
      </div>

      <div className="hub-cards">
        <button className="game-card" onClick={onWyraz}>
          <div className="card-icon" style={{ background: 'rgba(83,141,78,0.18)' }}>🔤</div>
          <div className="card-text">
            <div className="card-title">
              Wyraz
              {streak > 1 && (
                <span className="card-badge" style={{ background: 'rgba(83,141,78,0.2)', color: '#99d98c' }}>
                  {streak} 🔥
                </span>
              )}
            </div>
            <div className="card-subtitle" style={{ color: '#99d98c' }}>
              {completedToday ? 'Zagrane dziś ✓' : 'Codzienne słowo'}
            </div>
            <div className="card-desc">
              {completedToday ? 'Wróć jutro po nowe słowo' : 'Zgadnij słowo w 6 próbach'}
            </div>
          </div>
          <span className="card-arrow">›</span>
        </button>

        <button className="game-card" onClick={onGwiazdki}>
          <div className="card-icon" style={{ background: 'rgba(255,214,10,0.15)' }}>⭐</div>
          <div className="card-text">
            <div className="card-title">Gwiazdki</div>
            <div className="card-subtitle" style={{ color: '#ffd60a' }}>{progress}/200 poziomów</div>
            <div className="card-desc">Umieszczaj gwiazdki na planszy</div>
          </div>
          <span className="card-arrow">›</span>
        </button>

        <button className="game-card" onClick={onKolko}>
          <div className="card-icon" style={{ background: 'rgba(255,214,10,0.12)' }}>❌</div>
          <div className="card-text">
            <div className="card-title">Krzyżyk &amp; Kółko</div>
            <div className="card-subtitle" style={{ color: '#ffd60a' }}>Lokalna gra, AI, Online PvP</div>
            <div className="card-desc">Zagraj ze znajomym lub komputerem</div>
          </div>
          <span className="card-arrow">›</span>
        </button>

        <button className="game-card" onClick={onStatki}>
          <div className="card-icon" style={{ background: 'rgba(30,144,255,0.15)' }}>🚢</div>
          <div className="card-text">
            <div className="card-title">Statki</div>
            <div className="card-subtitle" style={{ color: '#1e90ff' }}>Online PvP</div>
            <div className="card-desc">Zatop flotę przeciwnika</div>
          </div>
          <span className="card-arrow">›</span>
        </button>
      </div>
    </div>
  )
}
