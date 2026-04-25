import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import styles from './StudentDashboard.module.css'
import {
  ApiError,
  studentApi,
  type EnrollmentResponse,
  type StudentCourseBrowseResponse,
  type StudentResourceBalanceResponse,
} from '../../lib/api'

const balanceByCourse = (balances: StudentResourceBalanceResponse[]) => {
  return balances.reduce<Record<string, StudentResourceBalanceResponse>>((acc, item) => {
    acc[item.courseId] = item
    return acc
  }, {})
}

const StudentDashboard: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const mode = location.pathname === '/student/courses' ? 'mine' : 'available'
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [availableCourses, setAvailableCourses] = useState<StudentCourseBrowseResponse[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<EnrollmentResponse[]>([])
  const [balances, setBalances] = useState<Record<string, StudentResourceBalanceResponse>>({})

  const load = async () => {
    setLoading(true)
    try {
      const [available, enrolled] = await Promise.all([studentApi.listAvailableCourses(), studentApi.listEnrolledCourses()])
      setAvailableCourses(available)
      setEnrolledCourses(enrolled)

      const balanceList = await Promise.all(
        enrolled.map(async (item) => {
          try {
            return await studentApi.getBalance(item.courseId)
          } catch {
            return null
          }
        }),
      )

      setBalances(balanceByCourse(balanceList.filter((item): item is StudentResourceBalanceResponse => item !== null)))
    } catch (err) {
      if (err instanceof ApiError) {
        setNotice(err.message)
      } else {
        setNotice('Nu s-au putut încărca cursurile.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const handleEnroll = async (courseId: string, name: string) => {
    setBusy(true)
    setNotice(null)
    try {
      await studentApi.enroll(courseId)
      setNotice(`Te-ai înrolat cu succes la ${name}.`)
      await load()
      navigate('/student/courses')
    } catch (err) {
      if (err instanceof ApiError) {
        setNotice(err.message)
      } else {
        setNotice('Nu te-ai putut înrola la curs.')
      }
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className={styles.emptyState}>Se încarcă...</div>
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>Course Browser</h1>
      <p className={styles.pageSubtitle}>Vezi cursurile disponibile, înscrie-te și deschide cursurile tale.</p>

      {notice && <div className={styles.notice}>{notice}</div>}

      {mode === 'available' && (
        <div className={styles.grid}>
          {availableCourses.length === 0 && <div className={styles.emptyState}>Nu sunt cursuri disponibile pentru înrolare.</div>}
          {availableCourses.map((entry) => {
            const { course, enrolled, enrolledCount } = entry
            const isFull = enrolledCount >= course.maxStudents
            const disableEnroll = busy || enrolled || isFull

            return (
              <div key={course.id} className={styles.courseCard}>
                <div className={styles.courseName}>{course.name}</div>
                <div className={styles.professorName}>Prof: {course.professorName}</div>
                <div className={`${styles.spotsText} ${isFull ? styles.spotsWarning : ''}`}>
                  {enrolledCount.toLocaleString()} / {course.maxStudents.toLocaleString()} spots taken
                </div>
                <div className={styles.metaLine}>Tokens: {course.tokensPerStudent.toLocaleString()} / student</div>
                <div className={styles.metaLine}>VPS: {course.vpsPerStudent.toLocaleString()} / student</div>

                <div className={styles.actions}>
                  <button className={styles.btn} disabled={disableEnroll} onClick={() => handleEnroll(course.id, course.name)}>
                    {enrolled ? 'Already enrolled' : 'Enroll'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {mode === 'mine' && (
        <div className={styles.grid}>
          {enrolledCourses.length === 0 && <div className={styles.emptyState}>Nu ești înscris la niciun curs.</div>}
          {enrolledCourses.map((course) => {
            const balance = balances[course.courseId]
            return (
              <div key={course.courseId} className={styles.courseCard}>
                <div className={styles.courseName}>{course.courseName}</div>
                <div className={styles.professorName}>Prof: {course.professorName}</div>
                <div className={styles.metaLine}>Înscris la: {new Date(course.enrolledAt).toLocaleString()}</div>
                <div className={styles.metaLine}>Tokens left: {balance ? balance.tokenBalance.toLocaleString() : '-'}</div>
                <div className={styles.metaLine}>VPS left: {balance ? balance.vpsBalance.toLocaleString() : '-'}</div>

                <div className={styles.actions}>
                  <Link className={styles.btnLink} to={`/student/courses/${encodeURIComponent(course.courseId)}`}>Open</Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}

export default StudentDashboard
