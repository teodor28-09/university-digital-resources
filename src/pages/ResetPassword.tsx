import React, { useState } from 'react'
import styles from './ResetPassword.module.css'
import { useLocation, Link } from 'react-router-dom'

function useQuery() {
  return new URLSearchParams(useLocation().search)
}

const ResetPassword: React.FC = () => {
  const query = useQuery()
  const token = query.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
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

    // TODO: call backend to perform reset using `token` and new password
    console.log('reset password token=', token, 'newPassword=', password)
    setNotification('Parola a fost schimbată cu succes. Poți să te autentifici cu noua parolă.')
    setTimeout(() => setNotification(null), 4000)
    setPassword('')
    setConfirm('')
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.title}>Setează o parolă nouă</div>
        <div className={styles.hint}>Introdu noua parolă și confirm-o. Linkul de reset poate expira — verifică email-ul dacă primești erori.</div>

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

        {notification && <div className={styles.notification}>{notification}</div>}
      </div>
    </div>
  )
}

export default ResetPassword
