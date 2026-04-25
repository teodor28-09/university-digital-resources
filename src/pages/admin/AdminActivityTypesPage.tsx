import React, { useEffect, useState } from 'react'
import type { User } from '../../types'
import { adminApi, ApiError, type ActivityType } from '../../lib/api'
import styles from './AdminDashboard.module.css'

interface AdminActivityTypesPageProps {
  currentUser: User
}

type NoticeState = { type: 'success' | 'error'; message: string } | null

interface ActivityFormState {
  name: string
  tokensRequired: number
}

const initialActivityForm: ActivityFormState = {
  name: '',
  tokensRequired: 1,
}

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof ApiError) {
    return err.message || fallback
  }

  return fallback
}

const AdminActivityTypesPage: React.FC<AdminActivityTypesPageProps> = ({ currentUser }) => {
  const [loading, setLoading] = useState(true)
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([])
  const [activityForm, setActivityForm] = useState<ActivityFormState>(initialActivityForm)
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null)
  const [notice, setNotice] = useState<NoticeState>(null)
  const [busy, setBusy] = useState(false)

  const loadActivities = async () => {
    setLoading(true)
    try {
      setActivityTypes(await adminApi.listActivityTypes())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadActivities()
  }, [])

  const handleSubmitActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setNotice(null)

    try {
      if (editingActivityId) {
        await adminApi.updateActivityType(editingActivityId, activityForm)
        setNotice({ type: 'success', message: 'Tipul de activitate a fost actualizat.' })
      } else {
        await adminApi.createActivityType(activityForm)
        setNotice({ type: 'success', message: 'Tipul de activitate a fost creat.' })
      }

      setActivityTypes(await adminApi.listActivityTypes())
      setEditingActivityId(null)
      setActivityForm(initialActivityForm)
    } catch (err) {
      setNotice({ type: 'error', message: getErrorMessage(err, 'Nu s-a putut salva tipul de activitate.') })
    } finally {
      setBusy(false)
    }
  }

  const handleEditActivity = (activity: ActivityType) => {
    setEditingActivityId(activity.id)
    setActivityForm({ name: activity.name, tokensRequired: activity.tokensRequired })
    setNotice(null)
  }

  const handleDeleteActivity = async (id: string) => {
    setBusy(true)
    setNotice(null)

    try {
      await adminApi.deleteActivityType(id)
      setActivityTypes(await adminApi.listActivityTypes())
      if (editingActivityId === id) {
        setEditingActivityId(null)
        setActivityForm(initialActivityForm)
      }
      setNotice({ type: 'success', message: 'Tipul de activitate a fost dezactivat.' })
    } catch (err) {
      setNotice({ type: 'error', message: getErrorMessage(err, 'Nu s-a putut dezactiva tipul de activitate.') })
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className={styles.empty}>Se încarcă activity types...</div>
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Activity Types</h1>
          <p className={styles.pageSubtitle}>Bun venit, {currentUser.name}. Configurează activitățile consumatoare de tokeni.</p>
        </div>
        <span className={styles.badge}>ACTIVITY</span>
      </div>

      <div className={styles.stack}>
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Manage Activity Types</h2>
              <p className={styles.sectionHint}>Poți crea, edita și dezactiva tipuri de activități.</p>
            </div>
          </div>

          <form className={styles.gridForm} onSubmit={handleSubmitActivity}>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Nume activitate</label>
              <input className={styles.input} value={activityForm.name} onChange={(e) => setActivityForm((prev) => ({ ...prev, name: e.target.value }))} required />
            </div>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Tokeni necesari</label>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={activityForm.tokensRequired}
                onChange={(e) => {
                  const raw = e.target.value
                  const cleaned = raw.replace(/^0+(?=\d)/, '')
                  setActivityForm((prev) => ({ ...prev, tokensRequired: cleaned === '' ? 0 : Number(cleaned) }))
                }}
                required
              />
            </div>
            <div className={styles.actions}>
              <button type="submit" className={styles.buttonPrimary} disabled={busy}>{editingActivityId ? 'Salvează modificările' : 'Adaugă activitate'}</button>
              {editingActivityId && (
                <button type="button" className={styles.buttonSecondary} onClick={() => { setEditingActivityId(null); setActivityForm(initialActivityForm) }}>
                  Anulează editarea
                </button>
              )}
            </div>
          </form>

          {notice && <div className={notice.type === 'success' ? styles.noticeSuccess : styles.noticeError}>{notice.message}</div>}

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nume</th>
                  <th>Tokeni</th>
                  <th>Status</th>
                  <th>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {activityTypes.map((activity) => (
                  <tr key={activity.id} className={activity.isActive ? '' : styles.inactiveRow}>
                    <td>{activity.name}</td>
                    <td>{activity.tokensRequired}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${activity.isActive ? '' : styles.statusInactive}`}>
                        {activity.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button type="button" className={styles.buttonGhost} disabled={busy} onClick={() => handleEditActivity(activity)}>Editează</button>
                        {activity.isActive && (
                          <button type="button" className={styles.buttonDanger} disabled={busy} onClick={() => handleDeleteActivity(activity.id)}>Dezactivează</button>
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

export default AdminActivityTypesPage
