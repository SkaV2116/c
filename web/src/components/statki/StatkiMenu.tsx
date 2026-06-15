import { useState } from 'react'
import type { Player } from '../../lib/auth'
import StatkiInstrukcja from './StatkiInstrukcja'

interface Props {
  player: Player
  onBack: () => void
  onSetup: () => void
  onRanking: () => void
}

export default function StatkiMenu({ player, onBack, onSetup, onRanking }: Props) {
  const [showInstr, setShowInstr] = useState(false)

  return (
    <div className="screen statki-screen">
      <div className="navbar">
        <button className="btn-back" onClick={onBack}>‹</button>
        <span className="navbar-title">STATKI</span>
        <div className="navbar-right">
          <button className="btn-back" onClick={() => setShowInstr(true)}>?</button>
        </div>
      </div>

      <div className="statki-menu-content">
        <div className="statki-menu-logo">🚢</div>

        <div className="statki-menu-player">
          Grasz jako <strong>{player.username}</strong> #{player.playerId}
        </div>

        <div className="statki-menu-buttons">
          <button className="statki-menu-btn" onClick={onSetup}>
            <span className="statki-menu-btn-icon">🌐</span>
            <div className="statki-menu-btn-text">
              <div className="statki-menu-btn-title">Graj online</div>
              <div className="statki-menu-btn-desc">Zagraj przeciwko innemu graczowi</div>
            </div>
            <span className="statki-menu-btn-arrow">›</span>
          </button>

          <button className="statki-menu-btn" onClick={onRanking}>
            <span className="statki-menu-btn-icon">🏆</span>
            <div className="statki-menu-btn-text">
              <div className="statki-menu-btn-title">Ranking</div>
              <div className="statki-menu-btn-desc">Najlepsi gracze online</div>
            </div>
            <span className="statki-menu-btn-arrow">›</span>
          </button>

          <button className="statki-menu-btn" onClick={() => setShowInstr(true)}>
            <span className="statki-menu-btn-icon">📖</span>
            <div className="statki-menu-btn-text">
              <div className="statki-menu-btn-title">Instrukcja</div>
              <div className="statki-menu-btn-desc">Zasady gry</div>
            </div>
            <span className="statki-menu-btn-arrow">›</span>
          </button>
        </div>
      </div>

      {showInstr && <StatkiInstrukcja onClose={() => setShowInstr(false)} />}
    </div>
  )
}
