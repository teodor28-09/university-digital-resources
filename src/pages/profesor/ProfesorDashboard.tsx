import React, { useState } from 'react'
import { CheckCircle, Clock } from 'lucide-react'
import type { Course, User, DigitalResource } from '../../types'
import styles from './ProfesorDashboard.module.css'

interface ProfesorDashboardProps {
  currentUser: User
  courses: Course[]
  onCreateCourse: (
    course: Omit<
      Course,
      'id' | 'createdAt' | 'enrolledStudents' | 'materials'
    >,
  ) => void
}

export const ProfesorDashboard: React.FC<ProfesorDashboardProps> = ({ currentUser, courses, onCreateCourse }) => {
  const myCourses = courses.filter((c) => c.professorId === currentUser.id)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxStudents: 30,
    includeTokens: false,
    tokensPerStudent: 0,
    includeVps: false,
    vpsPerStudent: 0,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notification, setNotification] = useState<string | null>(null)

  const validate = () => {
    const err: Record<string, string> = {}
    if (!formData.name.trim()) err.name = 'Numele cursului este necesar.'
    if (formData.maxStudents < 1) err.maxStudents = 'Numărul maxim de studenți trebuie să fie cel puțin 1.'
    if (!formData.includeTokens && !formData.includeVps) err.resources = 'Selectează cel puțin un tip de resursă.'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const resources: DigitalResource[] = []
    if (formData.includeTokens) resources.push({ type: 'tokens', amount: formData.tokensPerStudent })
    if (formData.includeVps) resources.push({ type: 'vps', amount: formData.vpsPerStudent })

    const newCourse: Omit<Course, 'id' | 'createdAt' | 'enrolledStudents' | 'materials'> = {
      name: formData.name,
      description: formData.description,
      professorId: currentUser.id,
      professorName: currentUser.name,
      maxStudents: formData.maxStudents,
      resources,
      allocatedResources: undefined,
      professorBuffer: undefined,
      status: 'draft',
    }

    // Omit fields according to prop signature — remove id & createdAt & enrolledStudents & materials
    const payload: any = { ...newCourse }
    delete payload.id
    delete payload.createdAt
    delete payload.enrolledStudents
    delete payload.materials

    onCreateCourse(payload)
    setShowModal(false)
    setNotification('Curs creat cu succes (status draft).')
    setTimeout(() => setNotification(null), 3000)
  }

  const computeBuffer = (course: Course) => {
    const tokensPer = course.resources.find((r) => r.type === 'tokens')?.amount ?? 0
    const totalTokensNeeded = tokensPer * course.maxStudents
    const professorTokenBuffer = Math.ceil(totalTokensNeeded * 0.1)
    const vpsPer = course.resources.find((r) => r.type === 'vps')?.amount ?? 0
    const totalVpsNeeded = vpsPer * course.maxStudents
    const professorVpsBuffer = Math.ceil(totalVpsNeeded * 0.1)
    return { professorTokenBuffer, professorVpsBuffer }
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <div className={styles.kicker}>Profesor workspace</div>
          <h1 className={styles.pageTitle}>Cursurile mele</h1>
          <p className={styles.subtitle}>Gestionează cursurile, resursele și alocările.</p>
        </div>
        <button className={styles.buttonPrimary} onClick={() => setShowModal(true)}>Creează curs nou</button>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Cursuri totale</div>
          <div className={styles.statValue}>{myCourses.length}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Active</div>
          <div className={styles.statValue}>{myCourses.filter((course) => course.status === 'active').length}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Studenți înscriși</div>
          <div className={styles.statValue}>{myCourses.reduce((total, course) => total + course.enrolledStudents.length, 0)}</div>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th>Nume curs</th>
              <th>Studenți</th>
              <th>Resurse necesare</th>
              <th>Buffer 10%</th>
              <th>Status</th>
              <th>Acțiuni</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {myCourses.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.emptyState}>Nu ai creat niciun curs.</td>
              </tr>
            )}
            {myCourses.map((c) => {
              const { professorTokenBuffer, professorVpsBuffer } = computeBuffer(c)
              const allocated = c.allocatedResources !== undefined
              return (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.enrolledStudents.length}</td>
                  <td>
                    <div className={styles.resourceList}>
                      {c.resources.map((r) => (
                        <span key={r.type} className={styles.resourceBadge}>{r.type === 'tokens' ? `${r.amount} tokeni` : `${r.amount} VPS`}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {allocated ? (
                      <span className={styles.bufferBadge}><CheckCircle size={16} strokeWidth={1.5} /> {`+${professorTokenBuffer} tokeni | +${professorVpsBuffer} VPS`}</span>
                    ) : (
                      <span className={styles.pendingBadge}><Clock size={16} strokeWidth={1.5} /> În așteptare alocare</span>
                    )}
                  </td>
                  <td><span>{c.status === 'active' ? 'Activ' : c.status === 'closed' ? 'Închis' : 'Draft'}</span></td>
                  <td>
                    <div className={styles.actionsRow}>
                      <button className={styles.buttonSecondary}>Vizualizează</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Creează curs nou</div>
              <div>
                <button className={styles.buttonSecondary} onClick={() => setShowModal(false)}>Închide</button>
              </div>
            </div>
            <form onSubmit={handleCreate}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nume curs</label>
                  <input className={styles.formControl} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  {errors.name && <div className={styles.formError}>{errors.name}</div>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Descriere</label>
                  <textarea className={styles.formControl} rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Număr maxim studenți</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    className={styles.formControl}
                    value={formData.maxStudents}
                    onChange={(e) => {
                      const raw = e.target.value
                      const cleaned = raw.replace(/^0+(?=\d)/, '')
                      setFormData({ ...formData, maxStudents: cleaned === '' ? 0 : Number(cleaned) })
                    }}
                  />
                  {errors.maxStudents && <div className={styles.formError}>{errors.maxStudents}</div>}
                </div>

                <div className={styles.resourceSection}>
                  <div className={styles.checkboxGroup}>
                    <input type="checkbox" checked={formData.includeTokens} onChange={(e) => setFormData({ ...formData, includeTokens: e.target.checked })} />
                    <label>Include tokeni AI</label>
                  </div>
                  {formData.includeTokens && (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Număr tokeni per student</label>
                      <input
                        type="number"
                        min={0}
                        className={styles.formControl}
                        value={formData.tokensPerStudent}
                        onChange={(e) => {
                          const raw = e.target.value
                          const cleaned = raw.replace(/^0+(?=\d)/, '')
                          setFormData({ ...formData, tokensPerStudent: cleaned === '' ? 0 : Number(cleaned) })
                        }}
                      />
                    </div>
                  )}

                  <div className={styles.checkboxGroup}>
                    <input type="checkbox" checked={formData.includeVps} onChange={(e) => setFormData({ ...formData, includeVps: e.target.checked })} />
                    <label>Include abonamente VPS</label>
                  </div>
                  {formData.includeVps && (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Număr abonamente VPS per student</label>
                      <input
                        type="number"
                        min={0}
                        className={styles.formControl}
                        value={formData.vpsPerStudent}
                        onChange={(e) => {
                          const raw = e.target.value
                          const cleaned = raw.replace(/^0+(?=\d)/, '')
                          setFormData({ ...formData, vpsPerStudent: cleaned === '' ? 0 : Number(cleaned) })
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className={styles.alertInfo}>
                  La alocarea resurselor de către administrator, vei primi automat un buffer suplimentar de 10% din totalul resurselor cursului, disponibil pentru distribuire studenților care solicită resurse extra.
                </div>

                {errors.resources && <div className={styles.formError}>{errors.resources}</div>}
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.buttonSecondary} onClick={() => setShowModal(false)}>Anulează</button>
                <button type="submit" className={styles.buttonPrimary}>Creează curs</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notification && <div className={styles.notification}>{notification}</div>}
    </div>
  )
}

export default ProfesorDashboard
