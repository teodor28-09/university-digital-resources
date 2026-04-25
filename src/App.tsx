import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'

import './App.css'

function App() {
  return (
    <BrowserRouter>
      <header style={{ padding: 14, borderBottom: '1px solid var(--color-border-light)', background: 'var(--color-bg-surface)' }}>
        <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/login" style={{ textDecoration: 'none', color: 'var(--color-text-secondary)' }}>Conectare</Link>
          <Link to="/register" style={{ textDecoration: 'none', color: 'var(--color-text-secondary)' }}>Înregistrare</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<LoginPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
