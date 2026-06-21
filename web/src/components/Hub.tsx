import { loadStreak, loadBoard, todayKey } from '../games/wyraz'
import { loadCompleted } from '../games/gwiazdki'

interface Props {
  player?: unknown
  onBack: () => void
  onWyraz: () => void
  onGwiazdki: () => void
  onKolko: () => void
  onStatki: () => void
}

export default function Hub({ onBack, onWyraz, onGwiazdki, onKolko, onStatki }: Props) {
  const streak = loadStreak()
  const board = loadBoard()
  const completedToday = board?.gameState !== 'playing' && board?.dateKey === todayKey()
  const completed = loadCompleted()
  const progress = completed.size

  const today = new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="screen hub">
      <div className="hub-topbar">
        <button className="hub-back-to-podnik" onClick={onBack}>‹ Pod-Ręcznik</button>
        <div className="hub-date-inline">{today}</div>
      </div>

      <div className="hub-header">
        <div className="hub-title">MiniGamesIQ</div>
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
