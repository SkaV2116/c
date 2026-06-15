import { useState, useEffect } from 'react'
import type { Player } from '../../lib/auth'
import { fetchRanking, type RankingEntry } from '../../lib/kolkoOnline'

interface Props {
  player: Player
  onBack: () => void
}

export default function KolkoRanking({ player, onBack }: Props) {
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRanking()
      .then(entries => {
        setRanking(entries)
        setLoading(false)
      })
      .catch(() => {
        setError('Błąd ładowania rankingu')
        setLoading(false)
      })
  }, [])

  return (
    <div className="screen kolko-screen">
      <div className="navbar">
        <button className="btn-back" onClick={onBack}>‹</button>
        <span className="navbar-title">RANKING</span>
        <div className="navbar-right" />
      </div>

      <div className="kolko-ranking-content">
        {loading && <div className="kolko-loading">Ładowanie...</div>}
        {error && <div className="kolko-error">{error}</div>}
        {!loading && !error && ranking.length === 0 && (
          <div className="kolko-ranking-empty">Brak danych rankingu</div>
        )}
        {!loading && ranking.length > 0 && (
          <div className="ranking-table-wrap">
            <table className="ranking-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Gracz</th>
                  <th>ID</th>
                  <th>Pkt</th>
                  <th>Gier</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((entry, idx) => (
                  <tr
                    key={entry.uid}
                    className={entry.uid === player.uid ? 'ranking-row-me' : ''}
                  >
                    <td className="ranking-place">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </td>
                    <td className="ranking-username">{entry.username}</td>
                    <td className="ranking-playerid">#{entry.playerId}</td>
                    <td className="ranking-points">{entry.totalPoints}</td>
                    <td className="ranking-games">{entry.gamesPlayed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
