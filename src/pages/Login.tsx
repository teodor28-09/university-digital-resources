import React from 'react'
import { Link } from 'react-router-dom'
import AuthForm from '../components/AuthForm'
import styles from './Login.module.css'

const LoginPage: React.FC = () => {
  const handleLogin = (data: { email: string; password: string }) => {
    // TODO: connect with backend (Spring) — send credentials, handle response
    console.log('login', data)
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
          <div className={styles.forgotWrap}>
            <Link to="/forgot-password" className={styles.forgotLink}>Ai uitat parola?</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
