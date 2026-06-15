import { useState, useEffect } from 'react'
import type { Player } from '../../lib/auth'
import { fetchStatkiRanking, type StatkiRankingEntry } from '../../lib/statkiOnline'

interface Props {
  player: Player
  onBack: () => void
}

export default function StatkiRanking({ player, onBack }: Props) {
  const [ranking, setRanking] = useState<StatkiRankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStatkiRanking()
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
    <div className="screen statki-screen">
      <div className="navbar">
        <button className="btn-back" onClick={onBack}>‹</button>
        <span className="navbar-title">RANKING</span>
        <div className="navbar-right" />
      </div>

      <div className="statki-ranking-content">
        {loading && <div className="kolko-loading">Ładowanie...</div>}
        {error && <div className="kolko-error">{error}</div>}
        {!loading && !error && ranking.length === 0 && (
          <div className="kolko-ranking-empty">Brak danych rankingu</div>
        )}
        {!loading && ranking.length > 0 && (
          <div className="statki-ranking-wrap">
            <table className="statki-ranking-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Gracz</th>
                  <th>ID</th>
                  <th>Wygrane</th>
                  <th>Trafienia</th>
                  <th>Stracone</th>
                  <th>Gier</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((entry, idx) => (
                  <tr
                    key={entry.uid}
                    className={entry.uid === player.uid ? 'statki-ranking-row-me' : ''}
                  >
                    <td>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}</td>
                    <td>{entry.username}</td>
                    <td>#{entry.playerId}</td>
                    <td>{entry.wins}</td>
                    <td>{entry.hits}</td>
                    <td>{entry.received}</td>
                    <td>{entry.gamesPlayed}</td>
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
