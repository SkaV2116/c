import { useState } from 'react'
import { register, login, checkVerified, resendVerification, logout, type Player } from '../lib/auth'

interface Props {
  initialVerificationPending?: boolean
  onAuth: (player: Player) => void
}

type Mode = 'login' | 'register' | 'verify'

export default function AuthScreen({ initialVerificationPending, onAuth }: Props) {
  const [mode, setMode] = useState<Mode>(initialVerificationPending ? 'verify' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resentSuccess, setResentSuccess] = useState(false)

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const passwordValid = password.length >= 8
  const confirmValid = mode !== 'register' || password === confirmPw
  const canSubmit = emailValid && passwordValid && confirmValid && !loading

  const handleSubmit = async () => {
    if (!canSubmit) return
    setError(null)
    setLoading(true)
    try {
      if (mode === 'register') {
        await register(email.trim(), password)
        setMode('verify')
      } else {
        try {
          const player = await login(email.trim(), password)
          onAuth(player)
        } catch (e: any) {
          if (e.message === 'UNVERIFIED') {
            setMode('verify')
          } else {
            throw e
          }
        }
      }
    } catch (e: any) {
      setError(e.message ?? 'Wystąpił błąd. Spróbuj ponownie.')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckVerified = async () => {
    setLoading(true)
    setError(null)
    try {
      const player = await checkVerified()
      if (player) {
        onAuth(player)
      } else {
        setError('Email nie został jeszcze potwierdzony. Kliknij link w wiadomości.')
      }
    } catch {
      setError('Błąd sprawdzania statusu. Spróbuj ponownie.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setLoading(true)
    setError(null)
    setResentSuccess(false)
    try {
      await resendVerification()
      setResentSuccess(true)
    } catch (e: any) {
      setError(e.message ?? 'Nie udało się wysłać emaila.')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = async () => {
    await logout()
    setMode('login')
    setError(null)
    setEmail('')
    setPassword('')
    setConfirmPw('')
    setResentSuccess(false)
  }

  if (mode === 'verify') {
    return (
      <div className="screen auth-screen">
        <div className="auth-logo">
          <div className="auth-logo-icon">📬</div>
          <div className="auth-logo-title">Pod-Ręcznik</div>
        </div>

        <div className="auth-card">
          <div className="auth-verify-info">
            <div className="auth-verify-title">Sprawdź swój email</div>
            <div className="auth-verify-desc">
              Wysłaliśmy link aktywacyjny na Twój adres. Kliknij go, a następnie wróć tutaj.
            </div>
          </div>

          {resentSuccess && (
            <div className="auth-success">Link wysłany ponownie — sprawdź skrzynkę.</div>
          )}
          {error && <div className="auth-error">{error}</div>}

          <button
            className={`auth-btn${loading ? ' auth-btn-disabled' : ''}`}
            onClick={handleCheckVerified}
            disabled={loading}
          >
            {loading ? 'Sprawdzam…' : 'Już potwierdziłem — zaloguj mnie'}
          </button>

          <button className="auth-link-btn" onClick={handleResend} disabled={loading}>
            Wyślij link ponownie
          </button>

          <button className="auth-link-btn auth-link-btn-muted" onClick={handleBackToLogin}>
            ← Wróć do logowania
          </button>
        </div>
      </div>
    )
  }

  const switchMode = (m: 'login' | 'register') => {
    setMode(m)
    setError(null)
    setEmail('')
    setPassword('')
    setConfirmPw('')
  }

  return (
    <div className="screen auth-screen">
      <div className="auth-logo">
        <div className="auth-logo-icon">📖</div>
        <div className="auth-logo-title">Pod-Ręcznik</div>
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
            <label className="auth-label">Adres email</label>
            <input
              className="auth-input"
              type="email"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="email"
              placeholder="twoj@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(null) }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
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

          {mode === 'register' && (
            <div className="auth-field-wrap">
              <label className="auth-label">Potwierdź hasło</label>
              <input
                className="auth-input"
                type="password"
                autoComplete="new-password"
                placeholder="powtórz hasło"
                value={confirmPw}
                onChange={e => { setConfirmPw(e.target.value); setError(null) }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
              {confirmPw.length > 0 && !confirmValid && (
                <div className="auth-hint">Hasła nie są identyczne</div>
              )}
            </div>
          )}
        </div>

        {error && <div className="auth-error">{error}</div>}

        {mode === 'register' && (
          <div className="auth-register-info">
            Wyślemy link aktywacyjny na Twój adres. Jeden adres = jedno konto.
          </div>
        )}

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
