import React, { useState } from 'react'
import type { Course, User } from '../../types'
import styles from './StudentDashboard.module.css'
import StatusBadge from '../../components/shared/StatusBadge'
import ResourceChip from '../../components/shared/ResourceChip'
import { useNavigate } from 'react-router-dom'

interface StudentDashboardProps {
  currentUser: User
  courses: Course[]
  onEnroll: (courseId: string) => void
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ currentUser, courses, onEnroll }) => {
  const navigate = useNavigate()
  const [notification, setNotification] = useState<string | null>(null)

  const enrolledCourses = courses.filter((c) => c.enrolledStudents.includes(currentUser.id))
  const availableCourses = courses.filter(
    (c) => !c.enrolledStudents.includes(currentUser.id) && c.status === 'active' && c.enrolledStudents.length < c.maxStudents,
  )

  const handleEnroll = (courseId: string, name: string) => {
    onEnroll(courseId)
    setNotification(`Te-ai înrolat cu succes la ${name}!`)
    setTimeout(() => setNotification(null), 3000)
  }

  if (!courses.length) {
    return <div className={styles.emptyState}>Nu există cursuri pentru afișare.</div>
  }

  return (
    <div style={{ padding: 28 }}>
      <h1 className={styles.pageTitle}>Cursurile mele</h1>
      <div className={styles.grid}>
        {enrolledCourses.length === 0 && <div className={styles.emptyState}>Nu ești înscris la niciun curs.</div>}
        {enrolledCourses.map((course) => {
          const tokenResource = (course.allocatedResources ?? course.resources).find((r) => r.type === 'tokens')
          const vpsResource = (course.allocatedResources ?? course.resources).find((r) => r.type === 'vps')
          const totalTokens = tokenResource ? tokenResource.amount : 0
          const usedTokens = 0 // placeholder — date despre consum nu sunt disponibile
          const percent = totalTokens > 0 ? Math.min(100, Math.round((usedTokens / totalTokens) * 100)) : 0

          return (
            <div key={course.id} className={styles.courseCard}>
              <div className={styles.courseName}>{course.name}</div>
              <div className={styles.professorName}>{course.professorName}</div>
              <div style={{ marginBottom: 8 }}><StatusBadge status={course.status} /></div>

              {tokenResource && (
                <div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{`${usedTokens} / ${totalTokens} tokeni folosiți`}</div>
                  <div className={styles.progressTrack}>
                    <div className={styles.progressFill} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              )}

              {vpsResource && (
                <div style={{ marginTop: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>{`${vpsResource.amount} VPS`}</div>
              )}

              <div className={styles.actions}>
                <button className={styles.btn} onClick={() => navigate(`/student/course/${course.id}`)}>Intră în curs</button>
              </div>
            </div>
          )
        })}
      </div>

      <div className={styles.sectionDivider} />

      <h2 className={styles.sectionTitle}>Cursuri disponibile</h2>
      <div className={styles.grid}>
        {availableCourses.length === 0 && <div className={styles.emptyState}>Nu sunt cursuri disponibile.</div>}
        {availableCourses.map((course) => {
          const spotsLeft = course.maxStudents - course.enrolledStudents.length
          const lowSpots = spotsLeft > 0 && spotsLeft < 5
          const full = spotsLeft === 0
          return (
            <div key={course.id} className={styles.courseCard}>
              <div className={styles.courseName}>{course.name}</div>
              <div className={styles.professorName}>{course.professorName}</div>
              <div className={`${styles.spotsText} ${lowSpots ? styles.spotsWarning : ''}`}>
                {full ? <span style={{ color: 'var(--color-error-text)', fontWeight: 600 }}>Complet</span> : `${spotsLeft} / ${course.maxStudents} locuri disponibile`}
              </div>

              <div style={{ marginBottom: 8 }}>
                {(course.resources || []).map((r) => (
                  <span key={r.type} className={styles.resourceChip}><ResourceChip type={r.type} amount={r.amount} /></span>
                ))}
              </div>

              <div className={styles.actions}>
                <button className={styles.btn} disabled={full} onClick={() => handleEnroll(course.id, course.name)}>Înrolează-te</button>
              </div>
            </div>
          )
        })}
      </div>

      {notification && <div className={styles.notification}>{notification}</div>}
    </div>
  )
}

export default StudentDashboard
