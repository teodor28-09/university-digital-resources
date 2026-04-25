import React from 'react'
import AuthForm from '../components/AuthForm'
import styles from './Register.module.css'

const RegisterPage: React.FC = () => {
  const handleRegister = (data: { email: string; password: string; name?: string }) => {
    // TODO: connect with backend (Spring) — create account
    console.log('register', data)
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
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
