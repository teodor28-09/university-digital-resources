import { BrowserRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, Mail, ShieldCheck, UserRoundPlus } from 'lucide-react'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import StudentDashboard from './pages/student/StudentDashboard'
import ProfesorDashboard from './pages/profesor/ProfesorDashboard'
import type { Course, User } from './types'

import styles from './App.module.css'

const iconProps = { size: 16, strokeWidth: 1.5 }

type Role = 'student' | 'profesor'

interface AuthenticatedLayoutProps {
  role: Role
  children: React.ReactNode
}

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ role, children }) => {
  const sidebarItems =
    role === 'student'
      ? [
          { to: '/student', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/student', label: 'Cursuri', icon: BookOpen },
        ]
      : [
          { to: '/profesor', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/profesor', label: 'Cursuri', icon: BookOpen },
          { to: '/profesor', label: 'Profesor', icon: GraduationCap },
        ]

  return (
    <div className={styles.authenticatedShell}>
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <div className={styles.logoTitle}>UniDigital</div>
          <div className={styles.logoHint}>{role === 'student' ? 'Student Portal' : 'Professor Portal'}</div>
        </div>

        <nav className={styles.sidebarNav}>
          {sidebarItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={`${role}-${item.label}`}
                to={item.to}
                className={({ isActive }) => `${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ''}`.trim()}
              >
                <Icon {...iconProps} />
                {item.label}
              </NavLink>
            )
          })}
          <Link to="/login" className={styles.sidebarItem}>
            <LogOut {...iconProps} />
            Logout
          </Link>
        </nav>
      </aside>

      <main className={styles.mainArea}>
        <div className={styles.contentWrap}>{children}</div>
      </main>
    </div>
  )
}

interface AppRoutesProps {
  studentUser: User
  profesorUser: User
  courses: Course[]
  onEnroll: (courseId: string) => void
  onCreateCourse: (courseData: Omit<Course, 'id' | 'createdAt' | 'enrolledStudents' | 'materials'>) => void
}

const AppRoutes: React.FC<AppRoutesProps> = ({ studentUser, profesorUser, courses, onEnroll, onCreateCourse }) => {
  const location = useLocation()
  const isAuthenticatedPath = location.pathname.startsWith('/student') || location.pathname.startsWith('/profesor')

  return (
    <div className={styles.appShell}>
      {!isAuthenticatedPath && (
        <header className={styles.publicNav}>
          <NavLink to="/login" className={({ isActive }) => `${styles.publicNavLink} ${isActive ? styles.publicNavLinkActive : ''}`.trim()}>
            <Mail {...iconProps} />
            Conectare
          </NavLink>
          <NavLink to="/register" className={({ isActive }) => `${styles.publicNavLink} ${isActive ? styles.publicNavLinkActive : ''}`.trim()}>
            <UserRoundPlus {...iconProps} />
            Inregistrare
          </NavLink>
          <NavLink to="/student" className={({ isActive }) => `${styles.publicNavLink} ${isActive ? styles.publicNavLinkActive : ''}`.trim()}>
            <LayoutDashboard {...iconProps} />
            Student
          </NavLink>
          <NavLink to="/profesor" className={({ isActive }) => `${styles.publicNavLink} ${isActive ? styles.publicNavLinkActive : ''}`.trim()}>
            <ShieldCheck {...iconProps} />
            Profesor
          </NavLink>
        </header>
      )}

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/student"
          element={(
            <AuthenticatedLayout role="student">
              <StudentDashboard currentUser={studentUser} courses={courses} onEnroll={onEnroll} />
            </AuthenticatedLayout>
          )}
        />
        <Route
          path="/profesor"
          element={(
            <AuthenticatedLayout role="profesor">
              <ProfesorDashboard currentUser={profesorUser} courses={courses} onCreateCourse={onCreateCourse} />
            </AuthenticatedLayout>
          )}
        />
        <Route path="/" element={<LoginPage />} />
        <Route path="*" element={<div>Pagina nu a fost gasita (404)</div>} />
      </Routes>
    </div>
  )
}

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
      <AppRoutes
        studentUser={studentUser}
        profesorUser={profesorUser}
        courses={courses}
        onEnroll={handleEnroll}
        onCreateCourse={handleCreateCourse}
      />
    </BrowserRouter>
  )
}

export default App
