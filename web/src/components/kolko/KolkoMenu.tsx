import type { Player } from '../../lib/auth'

interface Props {
  player: Player
  onBack: () => void
  onLocalGame: () => void
  onAIGame: () => void
  onOnline: () => void
  onRanking: () => void
}

export default function KolkoMenu({ player, onBack, onLocalGame, onAIGame, onOnline, onRanking }: Props) {
  return (
    <div className="screen kolko-screen">
      <div className="navbar">
        <button className="btn-back" onClick={onBack}>‹</button>
        <span className="navbar-title">KRZYŻYK &amp; KÓŁKO</span>
        <div className="navbar-right" />
      </div>

      <div className="kolko-menu-content">
        <div className="kolko-menu-logo">
          <div className="kolko-menu-logo-board">
            <span className="kolko-menu-x">X</span>
            <span className="kolko-menu-o">O</span>
            <span className="kolko-menu-x">X</span>
          </div>
        </div>

        <div className="kolko-menu-player">
          Grasz jako <strong>{player.username}</strong> #{player.playerId}
        </div>

        <div className="kolko-menu-buttons">
          <button className="kolko-menu-btn" onClick={onLocalGame}>
            <span className="kolko-menu-btn-icon">👥</span>
            <div className="kolko-menu-btn-text">
              <div className="kolko-menu-btn-title">Gracz vs Gracz</div>
              <div className="kolko-menu-btn-desc">Lokalna gra na jednym urządzeniu</div>
            </div>
            <span className="kolko-menu-btn-arrow">›</span>
          </button>

          <button className="kolko-menu-btn" onClick={onAIGame}>
            <span className="kolko-menu-btn-icon">🤖</span>
            <div className="kolko-menu-btn-text">
              <div className="kolko-menu-btn-title">Gracz vs Komputer</div>
              <div className="kolko-menu-btn-desc">Łatwy lub trudny poziom AI</div>
            </div>
            <span className="kolko-menu-btn-arrow">›</span>
          </button>

          <button className="kolko-menu-btn" onClick={onOnline}>
            <span className="kolko-menu-btn-icon">🌐</span>
            <div className="kolko-menu-btn-text">
              <div className="kolko-menu-btn-title">Online PvP</div>
              <div className="kolko-menu-btn-desc">Zagraj przeciwko innemu graczowi</div>
            </div>
            <span className="kolko-menu-btn-arrow">›</span>
          </button>

          <button className="kolko-menu-btn kolko-menu-btn-ranking" onClick={onRanking}>
            <span className="kolko-menu-btn-icon">🏆</span>
            <div className="kolko-menu-btn-text">
              <div className="kolko-menu-btn-title">Ranking</div>
              <div className="kolko-menu-btn-desc">Najlepsi gracze online</div>
            </div>
            <span className="kolko-menu-btn-arrow">›</span>
          </button>
        </div>
      </div>
    </div>
  )
}
