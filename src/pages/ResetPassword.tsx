import React, { useEffect, useState } from 'react'
import styles from './ResetPassword.module.css'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { ApiError, authApi } from '../lib/api'

function useQuery() {
  return new URLSearchParams(useLocation().search)
}

const ResetPassword: React.FC = () => {
  const navigate = useNavigate()
  const query = useQuery()
  const token = query.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [tokenValid, setTokenValid] = useState(false)
  const [validating, setValidating] = useState(true)

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Tokenul de resetare lipsește.')
        setValidating(false)
        return
      }

      try {
        await authApi.validateResetToken(token)
        setTokenValid(true)
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.errors[0] ?? 'Tokenul de resetare nu este valid.')
        } else {
          setError('A apărut o eroare neașteptată la validarea tokenului.')
        }
      } finally {
        setValidating(false)
      }
    }

    void validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Parola trebuie să aibă cel puțin 8 caractere.')
      return
    }
    if (password !== confirm) {
      setError('Parolele nu coincid.')
      return
    }

    try {
      await authApi.resetPassword(token, password)
      setNotification('Parola a fost schimbată cu succes. Vei fi redirecționat către autentificare.')
      setTimeout(() => navigate('/login', { replace: true }), 1800)
      setPassword('')
      setConfirm('')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.errors[0] ?? 'Resetarea parolei a eșuat.')
      } else {
        setError('A apărut o eroare neașteptată.')
      }
    }
  }

  if (validating) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.hint}>Validăm tokenul de resetare...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.title}>Setează o parolă nouă</div>
        <div className={styles.hint}>Introdu noua parolă și confirm-o. Linkul de reset poate expira — verifică email-ul dacă primești erori.</div>

        {!tokenValid ? (
          <div className={styles.errorBlock}>
            <div className={styles.error}>{error ?? 'Token invalid sau expirat.'}</div>
            <div className={styles.actions}>
              <Link to="/forgot-password" className={styles.cancelLink}>Solicită link nou</Link>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Parolă nouă</label>
            <input className={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Parola nouă" required />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Confirmă parola</label>
            <input className={styles.input} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirmă parola" required />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <Link to="/login" className={styles.cancelLink}>Anulează</Link>
            <button type="submit" className={styles.submit}>Schimbă parola</button>
          </div>
        </form>
        )}

        {notification && <div className={styles.notification}>{notification}</div>}
      </div>
    </div>
  )
}

export default ResetPassword
