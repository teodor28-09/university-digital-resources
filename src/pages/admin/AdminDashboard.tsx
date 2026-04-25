import React, { useEffect, useState } from 'react'
import type { User } from '../../types'
import { adminApi, ApiError, type AdminManageableRole, type AdminUser } from '../../lib/api'
import styles from './AdminDashboard.module.css'

interface AdminDashboardProps {
  currentUser: User
}

type NoticeState = { type: 'success' | 'error'; message: string } | null

interface CreateUserFormState {
  email: string
  firstName: string
  lastName: string
  role: AdminManageableRole
}

const initialCreateUserForm: CreateUserFormState = {
  email: '',
  firstName: '',
  lastName: '',
  role: 'PROFESSOR',
}

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof ApiError) {
    return err.message || fallback
  }

  return fallback
}

const roleLabelMap: Record<string, string> = {
  ADMIN: 'ADMIN',
  PROFESSOR: 'PROFESOR',
  STUDENT: 'STUDENT',
  AUDIT: 'AUDIT',
}

const getRoleLabel = (role: string) => roleLabelMap[role] ?? role

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [createUserForm, setCreateUserForm] = useState<CreateUserFormState>(initialCreateUserForm)
  const [notice, setNotice] = useState<NoticeState>(null)
  const [busy, setBusy] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    try {
      setUsers(await adminApi.listUsers())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setNotice(null)

    try {
      await adminApi.createUser(createUserForm)
      setNotice({ type: 'success', message: 'Account created. Credentials have been emailed to the user.' })
      setCreateUserForm(initialCreateUserForm)
      setUsers(await adminApi.listUsers())
    } catch (err) {
      setNotice({ type: 'error', message: getErrorMessage(err, 'Nu s-a putut crea utilizatorul.') })
    } finally {
      setBusy(false)
    }
  }

  const handleChangeUserRole = async (userId: string, role: AdminManageableRole) => {
    setBusy(true)
    setNotice(null)

    try {
      const updated = await adminApi.updateUserRole(userId, { role })
      setUsers((prev) => prev.map((user) => (user.id === userId ? updated : user)))
      setNotice({ type: 'success', message: 'Rolul a fost actualizat.' })
    } catch (err) {
      setNotice({ type: 'error', message: getErrorMessage(err, 'Nu s-a putut actualiza rolul.') })
    } finally {
      setBusy(false)
    }
  }

  const handleToggleUser = async (user: AdminUser) => {
    setBusy(true)
    setNotice(null)

    try {
      if (user.isActive) {
        await adminApi.deactivateUser(user.id)
      } else {
        await adminApi.reactivateUser(user.id)
      }
      setUsers(await adminApi.listUsers())
      setNotice({ type: 'success', message: user.isActive ? 'Utilizatorul a fost dezactivat.' : 'Utilizatorul a fost reactivat.' })
    } catch (err) {
      setNotice({ type: 'error', message: getErrorMessage(err, 'Nu s-a putut actualiza utilizatorul.') })
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className={styles.empty}>Se încarcă utilizatorii...</div>
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Admin Panel</h1>
          <p className={styles.pageSubtitle}>Bun venit, {currentUser.name}. Gestionează conturile platformei.</p>
        </div>
        <span className={styles.badge}>USERS</span>
      </div>

      <div className={styles.stack}>
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>User Management</h2>
              <p className={styles.sectionHint}>Creează conturi PROFESOR/AUDIT și gestionează activarea lor.</p>
            </div>
          </div>

          <form className={styles.gridForm} onSubmit={handleCreateUser}>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Email</label>
              <input className={styles.input} type="email" value={createUserForm.email} onChange={(e) => setCreateUserForm((prev) => ({ ...prev, email: e.target.value }))} required />
            </div>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Prenume</label>
              <input className={styles.input} value={createUserForm.firstName} onChange={(e) => setCreateUserForm((prev) => ({ ...prev, firstName: e.target.value }))} required />
            </div>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Nume</label>
              <input className={styles.input} value={createUserForm.lastName} onChange={(e) => setCreateUserForm((prev) => ({ ...prev, lastName: e.target.value }))} required />
            </div>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Rol</label>
              <select className={styles.select} value={createUserForm.role} onChange={(e) => setCreateUserForm((prev) => ({ ...prev, role: e.target.value as AdminManageableRole }))}>
                <option value="PROFESSOR">PROFESOR</option>
                <option value="AUDIT">AUDIT</option>
              </select>
            </div>
            <div>
              <button type="submit" className={styles.buttonPrimary} disabled={busy}>Creează cont</button>
            </div>
          </form>

          {notice && <div className={notice.type === 'success' ? styles.noticeSuccess : styles.noticeError}>{notice.message}</div>}

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nume</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Status</th>
                  <th>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className={user.isActive ? '' : styles.inactiveRow}>
                    <td>{`${user.firstName} ${user.lastName}`}</td>
                    <td>{user.email}</td>
                    <td><span className={styles.roleBadge}>{getRoleLabel(user.role)}</span></td>
                    <td><span className={`${styles.statusBadge} ${user.isActive ? '' : styles.statusInactive}`}>{user.isActive ? 'ACTIVE' : 'INACTIVE'}</span></td>
                    <td>
                      <div className={styles.actions}>
                        {user.role !== 'ADMIN' && (
                          <>
                            <div className={styles.roleActions}>
                              <button
                                type="button"
                                className={`${styles.roleButton} ${styles.roleButtonAudit}`}
                                disabled={busy || user.role === 'AUDIT'}
                                onClick={() => handleChangeUserRole(user.id, 'AUDIT')}
                              >
                                Setează AUDIT
                              </button>
                              <button
                                type="button"
                                className={`${styles.roleButton} ${styles.roleButtonProfesor}`}
                                disabled={busy || user.role === 'PROFESSOR'}
                                onClick={() => handleChangeUserRole(user.id, 'PROFESSOR')}
                              >
                                Setează PROFESOR
                              </button>
                            </div>
                            <button type="button" className={user.isActive ? styles.buttonDanger : styles.buttonSecondary} disabled={busy} onClick={() => handleToggleUser(user)}>
                              {user.isActive ? 'Deactivatează' : 'Reactivează'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

export default AdminDashboard
