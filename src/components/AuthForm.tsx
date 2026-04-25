import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './AuthForm.module.css'

interface AuthFormProps {
  mode: 'login' | 'register'
  onSubmit?: (data: { email: string; password: string; name?: string }) => void
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onSubmit }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.({ email, password, name: mode === 'register' ? name : undefined })
  }

  return (
    <div className={styles.container}>
      <div className={styles.cardRoot}>
        <h2 className={styles.title}>{mode === 'login' ? 'Autentificare' : 'Înregistrare'}</h2>
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className={styles.field}>
              <label className={styles.label}>Nume complet</label>
              <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ion Popescu" />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nume@universitate.ro" />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Parolă</label>
            <input className={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          <div className={styles.actions}>
            <div className={styles.left}>
              <button type="submit" className={styles.submit}>{mode === 'login' ? 'Conectează-te' : 'Înregistrează-te'}</button>
              <button type="button" className={styles.secondary} onClick={() => { setEmail(''); setPassword(''); setName('') }}>Reset</button>
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
