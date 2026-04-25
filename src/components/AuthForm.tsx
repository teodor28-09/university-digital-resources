import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './AuthForm.module.css'

interface AuthFormProps {
  mode: 'login' | 'register'
  onSubmit?: (data: { email: string; password: string; firstName?: string; lastName?: string }) => Promise<void> | void
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onSubmit }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit?.({
        email,
        password,
        firstName: mode === 'register' ? firstName : undefined,
        lastName: mode === 'register' ? lastName : undefined,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.cardRoot}>
        <h2 className={styles.title}>{mode === 'login' ? 'Autentificare' : 'Înregistrare'}</h2>
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Prenume</label>
                <input className={styles.input} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ion" required />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Nume</label>
                <input className={styles.input} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Popescu" required />
              </div>
            </>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input className={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nume@universitate.ro" required />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Parolă</label>
            <input className={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} />
          </div>

          <div className={styles.actions}>
            <div className={styles.left}>
              <button type="submit" className={styles.submit} disabled={isSubmitting}>{mode === 'login' ? 'Conectează-te' : 'Înregistrează-te'}</button>
              <button type="button" className={styles.secondary} disabled={isSubmitting} onClick={() => { setEmail(''); setPassword(''); setFirstName(''); setLastName('') }}>Reset</button>
            </div>
            <div className={styles.hint}>
              {mode === 'login' ? 'Nu ai cont?' : 'Ai deja cont?'}
              <Link to={mode === 'login' ? '/register' : '/login'} className={styles.inlineLink}>
                {mode === 'login' ? ' Înregistrează-te.' : ' Autentifică-te.'}
              </Link>
            </div>
          </div>
        
        </form>
      </div>
    </div>
  )
}

export default AuthForm
