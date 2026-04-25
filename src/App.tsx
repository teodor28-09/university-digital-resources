import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useState } from 'react'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import StudentDashboard from './pages/student/StudentDashboard'
import ProfesorDashboard from './pages/profesor/ProfesorDashboard'
import type { Course, User } from './types'

import './App.css'

function App() {
  // mock users for demo; replace with real auth in future
  const studentUser: User = { id: 'u-student-1', name: 'Maria Student', email: 'maria@student.local', role: 'student' }
  const profesorUser: User = { id: 'u-prof-1', name: 'Prof. Ionescu', email: 'ionescu@uni.local', role: 'profesor' }

  const [courses, setCourses] = useState<Course[]>([
    {
      id: 'c1',
      name: 'Introducere în AI',
      description: 'Bazele inteligenței artificiale',
      professorId: profesorUser.id,
      professorName: profesorUser.name,
      maxStudents: 30,
      enrolledStudents: [studentUser.id],
      resources: [{ type: 'tokens', amount: 500 }, { type: 'vps', amount: 1 }],
      status: 'active',
      createdAt: new Date().toISOString(),
      materials: [],
    },
    {
      id: 'c2',
      name: 'Sisteme distribuite',
      description: 'Tehnici pentru sisteme distribuite',
      professorId: profesorUser.id,
      professorName: profesorUser.name,
      maxStudents: 25,
      enrolledStudents: [],
      resources: [{ type: 'tokens', amount: 300 }],
      status: 'active',
      createdAt: new Date().toISOString(),
      materials: [],
    },
  ])

  const handleEnroll = (courseId: string) => {
    setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, enrolledStudents: Array.from(new Set([...c.enrolledStudents, studentUser.id])) } : c)))
  }

  const handleCreateCourse = (courseData: Omit<Course, 'id' | 'createdAt' | 'enrolledStudents' | 'materials'>) => {
    const newCourse: Course = {
      ...courseData,
      id: `c-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
      enrolledStudents: [],
      materials: [],
    }
    setCourses((prev) => [newCourse, ...prev])
  }

  return (
    <BrowserRouter>
      <header style={{ padding: 14, borderBottom: '1px solid var(--color-border-light)', background: 'var(--color-bg-surface)' }}>
        <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/login" style={{ textDecoration: 'none', color: 'var(--color-text-secondary)' }}>Conectare</Link>
          <Link to="/register" style={{ textDecoration: 'none', color: 'var(--color-text-secondary)' }}>Înregistrare</Link>
          <Link to="/student" style={{ textDecoration: 'none', color: 'var(--color-text-secondary)' }}>Student</Link>
          <Link to="/profesor" style={{ textDecoration: 'none', color: 'var(--color-text-secondary)' }}>Profesor</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/student" element={<StudentDashboard currentUser={studentUser} courses={courses} onEnroll={handleEnroll} />} />
          <Route path="/profesor" element={<ProfesorDashboard currentUser={profesorUser} courses={courses} onCreateCourse={handleCreateCourse} />} />
          <Route path="/" element={<LoginPage />} />
          <Route path="*" element={<div>Pagina nu a fost găsită (404)</div>} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
