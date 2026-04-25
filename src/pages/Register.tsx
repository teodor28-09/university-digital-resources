import React, { useState } from 'react'
import AuthForm from '../components/AuthForm'
import styles from './Register.module.css'
import { ApiError, authApi } from '../lib/api'
import { useNavigate } from 'react-router-dom'

interface RegisterPageProps {
  onAuthenticated: () => Promise<void>
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onAuthenticated }) => {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const handleRegister = async (data: { email: string; password: string; firstName?: string; lastName?: string }) => {
    setError(null)

    if (!data.firstName || !data.lastName) {
      setError('Completează prenumele și numele.')
      return
    }

    try {
      await authApi.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      })
      await onAuthenticated()
      navigate('/student', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.errors[0] ?? 'Înregistrarea a eșuat.')
      } else {
        setError('A apărut o eroare neașteptată.')
      }
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <div>
          <div className={styles.kicker}>UniDigital Onboarding</div>
          <h1 className={styles.heroTitle}>Înregistrare</h1>
          <p className={styles.heroSubtitle}>Creează un cont pe UniDigital pentru a începe.</p>
          <div className={styles.heroPills}>
            <span className={styles.heroPill}>Courses</span>
            <span className={styles.heroPill}>Resources</span>
            <span className={styles.heroPill}>Audit Ready</span>
          </div>
        </div>
        <div>
          <AuthForm mode="register" onSubmit={handleRegister} />
          {error && <div className={styles.formError}>{error}</div>}
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
