import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, professorApi, type CourseResponse } from '../../lib/api'
import styles from '../admin/AdminDashboard.module.css'

type NoticeState = { type: 'success' | 'error'; message: string } | null

const statusClassName = (status: CourseResponse['status']) => {
  if (status === 'ACTIVE') return styles.statusBadge
  if (status === 'CLOSED') return `${styles.statusBadge} ${styles.statusInactive}`
  return `${styles.statusBadge} ${styles.typeBadge}`
}

const CoursesPage: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<NoticeState>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxStudents: 30,
    tokensPerStudent: 0,
    vpsPerStudent: 0,
  })

  const load = async () => {
    setLoading(true)
    try {
      setCourses(await professorApi.listCourses())
    } catch (err) {
      if (err instanceof ApiError) {
        setNotice({ type: 'error', message: err.message })
      } else {
        setNotice({ type: 'error', message: 'Nu s-a putut încărca lista de cursuri.' })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const createCourse = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!formData.name.trim()) {
      setNotice({ type: 'error', message: 'Numele cursului este obligatoriu.' })
      return
    }

    if (formData.maxStudents < 1 || formData.tokensPerStudent < 0 || formData.vpsPerStudent < 0) {
      setNotice({ type: 'error', message: 'Verifică valorile numerice introduse.' })
      return
    }

    setBusy(true)
    setNotice(null)
    try {
      await professorApi.createCourse({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        maxStudents: formData.maxStudents,
        tokensPerStudent: formData.tokensPerStudent,
        vpsPerStudent: formData.vpsPerStudent,
      })

      setFormData({
        name: '',
        description: '',
        maxStudents: 30,
        tokensPerStudent: 0,
        vpsPerStudent: 0,
      })

      setNotice({ type: 'success', message: 'Curs creat. Așteaptă alocarea de resurse de către admin.' })
      await load()
    } catch (err) {
      if (err instanceof ApiError) {
        setNotice({ type: 'error', message: err.message })
      } else {
        setNotice({ type: 'error', message: 'Nu s-a putut crea cursul.' })
      }
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className={styles.empty}>Se încarcă...</div>

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Cursuri — Profesor</h1>
          <p className={styles.pageSubtitle}>Listează cursurile create de tine.</p>
        </div>
      </div>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Create Course</h2>
            <p className={styles.sectionHint}>Cursul va avea inițial status PENDING_RESOURCES până la alocarea adminului.</p>
          </div>
        </div>

        <form onSubmit={createCourse} className={styles.gridForm}>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Name</label>
            <input
              className={styles.input}
              value={formData.name}
              onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Introduction to AI"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Description</label>
            <input
              className={styles.input}
              value={formData.description}
              onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Optional"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Max Students</label>
            <input
              className={styles.input}
              type="number"
              min={1}
              value={formData.maxStudents}
              onChange={(event) => setFormData((prev) => ({ ...prev, maxStudents: Number(event.target.value) || 0 }))}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Tokens / Student</label>
            <input
              className={styles.input}
              type="number"
              min={0}
              value={formData.tokensPerStudent}
              onChange={(event) => setFormData((prev) => ({ ...prev, tokensPerStudent: Number(event.target.value) || 0 }))}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>VPS hours / Student</label>
            <input
              className={styles.input}
              type="number"
              min={0}
              value={formData.vpsPerStudent}
              onChange={(event) => setFormData((prev) => ({ ...prev, vpsPerStudent: Number(event.target.value) || 0 }))}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Action</label>
            <button type="submit" className={styles.buttonPrimary} disabled={busy}>Create Course</button>
          </div>
        </form>

        {notice && <div className={notice.type === 'success' ? styles.noticeSuccess : styles.noticeError}>{notice.message}</div>}
      </section>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nume</th>
              <th>Max studenți</th>
              <th>Tokens / student</th>
              <th>VPS hours / student</th>
              <th>Status</th>
              <th>Detalii</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.empty}>Nu ai cursuri create încă.</td>
              </tr>
            )}

            {courses.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.maxStudents}</td>
                <td>{c.tokensPerStudent}</td>
                <td>{c.vpsPerStudent}</td>
                <td><span className={statusClassName(c.status)}>{c.status}</span></td>
                <td>
                  <Link to={`/profesor/courses/${encodeURIComponent(c.id)}`} className={styles.buttonSecondary}>Vezi</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CoursesPage
