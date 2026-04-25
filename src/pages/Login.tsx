import React from 'react'
import AuthForm from '../components/AuthForm'

const LoginPage: React.FC = () => {
  const handleLogin = (data: { email: string; password: string }) => {
    // TODO: connect with backend (Spring) — send credentials, handle response
    console.log('login', data)
  }

  return (
    <div style={{ padding: '28px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 980, display: 'flex', gap: 32, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <h1>Autentificare</h1>
          <p>Conectează-te la platforma UniDigital pentru a accesa cursurile tale.</p>
        </div>
        <div style={{ width: 420 }}>
          <AuthForm mode="login" onSubmit={handleLogin} />
        </div>
      </div>
    </div>
  )
}

export default LoginPage
