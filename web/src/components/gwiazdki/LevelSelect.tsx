import { loadCompleted, loadAllLevelTimes, formatTime } from '../../games/gwiazdki'
import levelsData from '../../data/gwiazdki_levels.json'

const levels = (levelsData as any).levels as { id: number; gridSize: number }[]

interface Props {
  onBack: () => void
  onLevel: (id: number) => void
}

export default function LevelSelect({ onBack, onLevel }: Props) {
  const completed = loadCompleted()
  const times = loadAllLevelTimes()
  const total = levels.length

  return (
    <div className="screen level-select">
      <div className="navbar">
        <button className="btn-back" onClick={onBack}>‹</button>
        <div style={{ textAlign: 'center' }}>
          <div className="navbar-title">GWIAZDKI</div>
          <div className="progress-sub">{completed.size}/{total} ukończonych</div>
        </div>
        <div className="navbar-right" />
      </div>

      <div className="level-grid-wrap">
        <div className="level-grid">
          {levels.map(level => {
            const done = completed.has(level.id)
            const unlocked = level.id === 1 || completed.has(level.id - 1)
            return (
              <button
                key={level.id}
                className={`level-btn ${done ? 'level-btn-completed' : unlocked ? 'level-btn-unlocked' : 'level-btn-locked'}`}
                onClick={() => unlocked && onLevel(level.id)}
                disabled={!unlocked}
              >
                {done ? '⭐' : unlocked ? level.id : '🔒'}
                <span className="level-btn-size">{level.gridSize}×{level.gridSize}</span>
                {done && times[level.id] !== undefined && (
                  <span className="level-btn-time">{formatTime(times[level.id])}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
