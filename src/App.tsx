import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, Mail, ShieldCheck, UserRoundPlus } from 'lucide-react'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import StudentDashboard from './pages/student/StudentDashboard'
import ProfesorDashboard from './pages/profesor/ProfesorDashboard'
import type { Course, User } from './types'
import { authApi } from './lib/api'

import styles from './App.module.css'

const iconProps = { size: 16, strokeWidth: 1.5 }

type Role = 'student' | 'profesor'

const rolePathMap: Record<string, string> = {
  STUDENT: '/student',
  PROFESSOR: '/profesor',
  ADMIN: '/profesor',
  AUDIT: '/profesor',
}

const mapRoleToAppRole = (role: string): Role => (role === 'STUDENT' ? 'student' : 'profesor')

const toAppUser = (profile: { id: string; email: string; firstName: string; lastName: string; role: string }): User => ({
  id: profile.id,
  email: profile.email,
  name: `${profile.firstName} ${profile.lastName}`.trim(),
  role: mapRoleToAppRole(profile.role),
})

interface AuthenticatedLayoutProps {
  role: Role
  onLogout: () => Promise<void>
  children: React.ReactNode
}

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ role, onLogout, children }) => {
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
          <button type="button" className={`${styles.sidebarItem} ${styles.sidebarButton}`} onClick={onLogout}>
            <LogOut {...iconProps} />
            Logout
          </button>
        </nav>
      </aside>

      <main className={styles.mainArea}>
        <div className={styles.contentWrap}>{children}</div>
      </main>
    </div>
  )
}

interface AppRoutesProps {
  currentUser: User | null
  authReady: boolean
  courses: Course[]
  onEnroll: (courseId: string) => void
  onCreateCourse: (courseData: Omit<Course, 'id' | 'createdAt' | 'enrolledStudents' | 'materials'>) => void
  onLogout: () => Promise<void>
  onAuthenticated: () => Promise<void>
}

const AppRoutes: React.FC<AppRoutesProps> = ({
  currentUser,
  authReady,
  courses,
  onEnroll,
  onCreateCourse,
  onLogout,
  onAuthenticated,
}) => {
  const location = useLocation()
  const navigate = useNavigate()
  const isAuthenticatedPath = location.pathname.startsWith('/student') || location.pathname.startsWith('/profesor')

  useEffect(() => {
    if (!authReady || !currentUser) {
      return
    }

    if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register') {
      navigate(rolePathMap[currentUser.role.toUpperCase()] ?? '/login', { replace: true })
    }
  }, [authReady, currentUser, location.pathname, navigate])

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
        <Route path="/login" element={<LoginPage onAuthenticated={onAuthenticated} />} />
        <Route path="/register" element={<RegisterPage onAuthenticated={onAuthenticated} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/student"
          element={authReady && currentUser?.role === 'student'
            ? (
                <AuthenticatedLayout role="student" onLogout={onLogout}>
                  <StudentDashboard currentUser={currentUser} courses={courses} onEnroll={onEnroll} />
                </AuthenticatedLayout>
              )
            : <Navigate to="/login" replace />}
        />
        <Route
          path="/profesor"
          element={authReady && currentUser?.role === 'profesor'
            ? (
                <AuthenticatedLayout role="profesor" onLogout={onLogout}>
                  <ProfesorDashboard currentUser={currentUser} courses={courses} onCreateCourse={onCreateCourse} />
                </AuthenticatedLayout>
              )
            : <Navigate to="/login" replace />}
        />
        <Route path="/" element={<LoginPage onAuthenticated={onAuthenticated} />} />
        <Route path="*" element={<div>Pagina nu a fost gasita (404)</div>} />
      </Routes>
    </div>
  )
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)

  const refreshCurrentUser = useCallback(async () => {
    try {
      const profile = await authApi.getMe()
      setCurrentUser(toAppUser(profile))
    } catch {
      setCurrentUser(null)
    } finally {
      setAuthReady(true)
    }
  }, [])

  useEffect(() => {
    void refreshCurrentUser()
  }, [refreshCurrentUser])

  const [courses, setCourses] = useState<Course[]>([
    {
      id: 'c1',
      name: 'Introducere în AI',
      description: 'Bazele inteligenței artificiale',
      professorId: 'u-prof-1',
      professorName: 'Prof. Ionescu',
      maxStudents: 30,
      enrolledStudents: [],
      resources: [{ type: 'tokens', amount: 500 }, { type: 'vps', amount: 1 }],
      status: 'active',
      createdAt: new Date().toISOString(),
      materials: [],
    },
    {
      id: 'c2',
      name: 'Sisteme distribuite',
      description: 'Tehnici pentru sisteme distribuite',
      professorId: 'u-prof-1',
      professorName: 'Prof. Ionescu',
      maxStudents: 25,
      enrolledStudents: [],
      resources: [{ type: 'tokens', amount: 300 }],
      status: 'active',
      createdAt: new Date().toISOString(),
      materials: [],
    },
  ])

  const handleEnroll = (courseId: string) => {
    if (!currentUser) {
      return
    }

    setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, enrolledStudents: Array.from(new Set([...c.enrolledStudents, currentUser.id])) } : c)))
  }

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } finally {
      setCurrentUser(null)
    }
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
        currentUser={currentUser}
        authReady={authReady}
        courses={courses}
        onEnroll={handleEnroll}
        onCreateCourse={handleCreateCourse}
        onLogout={handleLogout}
        onAuthenticated={refreshCurrentUser}
      />
    </BrowserRouter>
  )
}

export default App
