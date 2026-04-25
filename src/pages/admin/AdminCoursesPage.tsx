import React, { useEffect, useState } from 'react'
import { adminCoursesApi, ApiError, type CourseResponse } from '../../lib/api'
import styles from './AdminDashboard.module.css'

const AdminCoursesPage: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [filter, setFilter] = useState<'ALL' | 'PENDING'>('ALL')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const list = filter === 'PENDING' ? await adminCoursesApi.listCourses('PENDING_RESOURCES') : await adminCoursesApi.listCourses()
      setCourses(list)
    } catch (err) {
      // swallow
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [filter])

  const allocate = async (courseId: string) => {
    setBusy(true)
    setNotice(null)
    try {
      await adminCoursesApi.allocateCourse(courseId)
      await load()
      setNotice('Resursele au fost alocate.')
    } catch (err) {
      if (err instanceof ApiError) setNotice(err.message)
      else setNotice('Eroare la alocare')
    } finally { setBusy(false) }
  }

  if (loading) return <div className={styles.empty}>Se încarcă...</div>

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Admin — Courses</h1>
          <p className={styles.pageSubtitle}>Listează cursurile și alocă resursele necesare.</p>
        </div>
        <span className={styles.badge}>COURSES</span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <button className={styles.buttonSecondary} onClick={() => setFilter('ALL')} disabled={filter === 'ALL'}>All</button>
        <button className={styles.buttonSecondary} onClick={() => setFilter('PENDING')} disabled={filter === 'PENDING'} style={{ marginLeft: 8 }}>Pending Allocation</button>
      </div>

      {notice && <div style={{ marginBottom: 12 }}>{notice}</div>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nume</th>
              <th>Profesor</th>
              <th>Necesare (tokens)</th>
              <th>Buffer 10% (tokens)</th>
              <th>Necesare (VPS)</th>
              <th>Buffer 10% (VPS)</th>
              <th>Status</th>
              <th>Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => {
              const totalTokensNeeded = c.tokensPerStudent * c.maxStudents
              const bufferTokens = Math.ceil(totalTokensNeeded * 0.1)
              const totalVpsNeeded = c.vpsPerStudent * c.maxStudents
              const bufferVps = Math.ceil(totalVpsNeeded * 0.1)
              return (
                <tr key={c.id} className={c.status !== 'ACTIVE' ? '' : ''}>
                  <td>{c.name}</td>
                  <td>{c.professorName}</td>
                  <td>{totalTokensNeeded.toLocaleString()}</td>
                  <td>{bufferTokens.toLocaleString()}</td>
                  <td>{totalVpsNeeded.toLocaleString()}</td>
                  <td>{bufferVps.toLocaleString()}</td>
                  <td><span className={`${styles.statusBadge} ${c.status === 'ACTIVE' ? '' : ''}`}>{c.status}</span></td>
                  <td>
                    {c.status === 'PENDING_RESOURCES' && (
                      <button className={styles.buttonPrimary} disabled={busy} onClick={() => allocate(c.id)}>Allocate Resources</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminCoursesPage
