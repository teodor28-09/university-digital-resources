import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthForm from '../components/AuthForm'
import styles from './Login.module.css'
import { ApiError, authApi } from '../lib/api'

interface LoginPageProps {
  onAuthenticated: () => Promise<void>
}

const rolePathMap: Record<string, string> = {
  STUDENT: '/student',
  PROFESSOR: '/profesor',
  ADMIN: '/admin',
  AUDIT: '/profesor',
}

const LoginPage: React.FC<LoginPageProps> = ({ onAuthenticated }) => {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (data: { email: string; password: string }) => {
    setError(null)

    try {
      const response = await authApi.login(data)
      await onAuthenticated()
      navigate(rolePathMap[response.role] ?? '/login', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.errors[0] ?? 'Autentificarea a eșuat.')
      } else {
        setError('A apărut o eroare neașteptată.')
      }
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <div>
          <div className={styles.kicker}>UniDigital Platform</div>
          <h1 className={styles.heroTitle}>Autentificare</h1>
          <p className={styles.heroSubtitle}>Conectează-te la platforma UniDigital pentru a accesa cursurile tale.</p>
          <div className={styles.heroPills}>
            <span className={styles.heroPill}>Academic Cloud</span>
            <span className={styles.heroPill}>Secure Access</span>
          </div>
        </div>
        <div>
          <AuthForm mode="login" onSubmit={handleLogin} />
          {error && <div className={styles.formError}>{error}</div>}
          <div className={styles.forgotWrap}>
            <Link to="/forgot-password" className={styles.forgotLink}>Ai uitat parola?</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
