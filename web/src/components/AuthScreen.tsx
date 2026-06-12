import { useState } from 'react'
import { register, login, type Player } from '../lib/auth'

interface Props {
  onAuth: (player: Player) => void
}

type Mode = 'login' | 'register'

export default function AuthScreen({ onAuth }: Props) {
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const usernameValid = username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username)
  const passwordValid = password.length >= 8
  const canSubmit = usernameValid && passwordValid && !loading

  const handleSubmit = async () => {
    if (!canSubmit) return
    setError(null)
    setLoading(true)
    try {
      const player = mode === 'register'
        ? await register(username.trim(), password)
        : await login(username.trim(), password)
      onAuth(player)
    } catch (e: any) {
      setError(e.message ?? 'Wystąpił błąd. Spróbuj ponownie.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m: Mode) => {
    setMode(m)
    setError(null)
    setUsername('')
    setPassword('')
  }

  return (
    <div className="screen auth-screen">
      <div className="auth-logo">
        <div className="auth-logo-icon">🎮</div>
        <div className="auth-logo-title">Mini Gry</div>
      </div>

      <div className="auth-card">
        <div className="auth-tabs">
          <button
            className={`auth-tab${mode === 'login' ? ' auth-tab-active' : ''}`}
            onClick={() => switchMode('login')}
          >Zaloguj się</button>
          <button
            className={`auth-tab${mode === 'register' ? ' auth-tab-active' : ''}`}
            onClick={() => switchMode('register')}
          >Zarejestruj się</button>
        </div>

        <div className="auth-fields">
          <div className="auth-field-wrap">
            <label className="auth-label">Login</label>
            <input
              className="auth-input"
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              placeholder="min. 3 znaki, litery/cyfry/_"
              value={username}
              maxLength={20}
              onChange={e => { setUsername(e.target.value); setError(null) }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            {mode === 'register' && username.length > 0 && !usernameValid && (
              <div className="auth-hint">3–20 znaków, tylko litery, cyfry i _</div>
            )}
          </div>

          <div className="auth-field-wrap">
            <label className="auth-label">Hasło</label>
            <input
              className="auth-input"
              type="password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              placeholder="min. 8 znaków"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(null) }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            {mode === 'register' && password.length > 0 && !passwordValid && (
              <div className="auth-hint">Hasło musi mieć co najmniej 8 znaków</div>
            )}
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button
          className={`auth-btn${canSubmit ? '' : ' auth-btn-disabled'}`}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {loading
            ? 'Proszę czekać…'
            : mode === 'register' ? 'Zarejestruj się' : 'Zaloguj się'
          }
        </button>
      </div>
    </div>
  )
}
