import React, { useState } from 'react'
import styles from './ForgotPassword.module.css'
import { Link } from 'react-router-dom'
import { ApiError, authApi } from '../lib/api'

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('')
  const [notification, setNotification] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await authApi.forgotPassword(email)
      setNotification('Dacă există un cont asociat, vei primi un email cu instrucțiuni.')
      setTimeout(() => setNotification(null), 4000)
      setEmail('')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.errors[0] ?? 'Nu s-a putut trimite cererea de resetare.')
      } else {
        setError('A apărut o eroare neașteptată.')
      }
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.title}>Resetare parolă</div>
        <div className={styles.hint}>Introdu email-ul asociat contului și îți vom trimite un link pentru resetarea parolei.</div>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input className={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nume@universitate.ro" required />
          </div>
          <div className={styles.actions}>
            <Link to="/login" className={styles.hintLink}>Anulează</Link>
            <button type="submit" className={styles.submit}>Trimite link reset</button>
          </div>

          {error && <div className={styles.error}>{error}</div>}
        </form>

        {notification && <div className={styles.notification}>{notification}</div>}
      </div>
    </div>
  )
}

export default ForgotPassword
