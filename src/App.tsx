import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { BookOpen, LayoutDashboard, LogOut, Mail, ShieldCheck, UserRoundPlus, Users, ClipboardList, Database } from 'lucide-react'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import StudentDashboard from './pages/student/StudentDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminActivityTypesPage from './pages/admin/AdminActivityTypesPage'
import AdminResourcePoolsPage from './pages/admin/AdminResourcePoolsPage'
import AdminCoursesPage from './pages/admin/AdminCoursesPage'
import AdminForwardedRequestsPage from './pages/admin/AdminForwardedRequestsPage'
import NotFound from './pages/NotFound'
import CoursesPage from './pages/profesor/CoursesPage'
import CourseDetailPage from './pages/profesor/CourseDetailPage'
import type { Course, User } from './types'
import { authApi } from './lib/api'

import styles from './App.module.css'

const iconProps = { size: 16, strokeWidth: 1.5 }

  const rolePathMap: Record<User['role'], string> = {
  student: '/student',
  profesor: '/profesor/courses',
  admin: '/admin/users',
  audit: '/profesor/courses',
}

const mapRoleToAppRole = (role: string): User['role'] => {
  if (role === 'STUDENT') return 'student'
  if (role === 'PROFESSOR') return 'profesor'
  if (role === 'ADMIN') return 'admin'
  return 'audit'
}

const toAppUser = (profile: { id: string; email: string; firstName: string; lastName: string; role: string }): User => ({
  id: profile.id,
  email: profile.email,
  name: `${profile.firstName} ${profile.lastName}`.trim(),
  role: mapRoleToAppRole(profile.role),
})

interface AuthenticatedLayoutProps {
  role: User['role']
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
      : role === 'admin'
        ? [
            { to: '/admin/users', label: 'Users', icon: Users },
            { to: '/admin/activity-types', label: 'Activity Types', icon: ClipboardList },
            { to: '/admin/courses', label: 'Courses', icon: BookOpen },
            { to: '/admin/forwarded-requests', label: 'Forwarded Requests', icon: ClipboardList },
            { to: '/admin/resources', label: 'Resource Pool', icon: Database },
          ]
        : [
            { to: '/profesor/courses', label: role === 'audit' ? 'Audit View' : 'Cursuri', icon: BookOpen },
          ]

  const portalLabel = role === 'student' ? 'Student Portal' : role === 'admin' ? 'Admin Portal' : role === 'audit' ? 'Audit Portal' : 'Profesor Portal'

  return (
    <div className={styles.authenticatedShell}>
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <div className={styles.logoTitle}>UniDigital</div>
          <div className={styles.logoHint}>{portalLabel}</div>
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
  onLogout: () => Promise<void>
  onAuthenticated: () => Promise<void>
}

const AppRoutes: React.FC<AppRoutesProps> = ({
  currentUser,
  authReady,
  courses,
  onEnroll,
  onLogout,
  onAuthenticated,
}) => {
  const location = useLocation()
  const navigate = useNavigate()
  const isAuthenticatedPath = location.pathname.startsWith('/student') || location.pathname.startsWith('/profesor') || location.pathname.startsWith('/admin')

  useEffect(() => {
    if (!authReady || !currentUser) {
      return
    }

    if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register') {
      navigate(rolePathMap[currentUser.role] ?? '/login', { replace: true })
    }
  }, [authReady, currentUser, location.pathname, navigate])

  if (!authReady && isAuthenticatedPath) {
    return <div className={styles.appShell}>Se încarcă sesiunea...</div>
  }

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
          element={authReady && (currentUser?.role === 'profesor' || currentUser?.role === 'audit')
            ? <Navigate to="/profesor/courses" replace />
            : <Navigate to="/login" replace />}
        />
        <Route
          path="/profesor/courses"
          element={authReady && (currentUser?.role === 'profesor' || currentUser?.role === 'audit')
            ? (
                <AuthenticatedLayout role={currentUser.role} onLogout={onLogout}>
                  <CoursesPage />
                </AuthenticatedLayout>
              )
            : <Navigate to="/login" replace />}
        />
        <Route
          path="/profesor/courses/:id"
          element={authReady && (currentUser?.role === 'profesor' || currentUser?.role === 'audit')
            ? (
                <AuthenticatedLayout role={currentUser.role} onLogout={onLogout}>
                  <CourseDetailPage />
                </AuthenticatedLayout>
              )
            : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin"
          element={authReady && currentUser?.role === 'admin'
            ? <Navigate to="/admin/users" replace />
            : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin/users"
          element={authReady && currentUser?.role === 'admin'
            ? (
                <AuthenticatedLayout role="admin" onLogout={onLogout}>
                  <AdminDashboard currentUser={currentUser} />
                </AuthenticatedLayout>
              )
            : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin/activity-types"
          element={authReady && currentUser?.role === 'admin'
            ? (
                <AuthenticatedLayout role="admin" onLogout={onLogout}>
                  <AdminActivityTypesPage currentUser={currentUser} />
                </AuthenticatedLayout>
              )
            : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin/courses"
          element={authReady && currentUser?.role === 'admin'
            ? (
                <AuthenticatedLayout role="admin" onLogout={onLogout}>
                  <AdminCoursesPage />
                </AuthenticatedLayout>
              )
            : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin/forwarded-requests"
          element={authReady && currentUser?.role === 'admin'
            ? (
                <AuthenticatedLayout role="admin" onLogout={onLogout}>
                  <AdminForwardedRequestsPage />
                </AuthenticatedLayout>
              )
            : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin/resources"
          element={authReady && currentUser?.role === 'admin'
            ? (
                <AuthenticatedLayout role="admin" onLogout={onLogout}>
                  <AdminResourcePoolsPage currentUser={currentUser} />
                </AuthenticatedLayout>
              )
            : <Navigate to="/login" replace />}
        />
        <Route path="/" element={<LoginPage onAuthenticated={onAuthenticated} />} />
        <Route path="*" element={<NotFound />} />
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

  return (
    <BrowserRouter>
      <AppRoutes
        currentUser={currentUser}
        authReady={authReady}
        courses={courses}
        onEnroll={handleEnroll}
        onLogout={handleLogout}
        onAuthenticated={refreshCurrentUser}
      />
    </BrowserRouter>
  )
}

export default App