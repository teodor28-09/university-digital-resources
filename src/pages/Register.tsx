import React from 'react'
import AuthForm from '../components/AuthForm'

const RegisterPage: React.FC = () => {
  const handleRegister = (data: { email: string; password: string; name?: string }) => {
    // TODO: connect with backend (Spring) — create account
    console.log('register', data)
  }

  return (
    <div style={{ padding: '28px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 980, display: 'flex', gap: 32, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <h1>Înregistrare</h1>
          <p>Creează un cont pe UniDigital pentru a începe.</p>
        </div>
        <div style={{ width: 420 }}>
          <AuthForm mode="register" onSubmit={handleRegister} />
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
