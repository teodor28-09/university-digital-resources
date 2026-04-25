import React, { useEffect, useMemo, useState } from 'react'
import {
  ApiError,
  auditApi,
  type AdminUser,
  type AuditLogEntry,
  type CourseAuditStats,
  type PageResponse,
  type StudentCourseAuditStats,
  type UniversityAuditStats,
} from '../../lib/api'
import styles from '../admin/AdminDashboard.module.css'

type AuditTab = 'logs' | 'student' | 'course' | 'university'

const AUDIT_ACTIONS = [
  'USER_REGISTERED',
  'USER_LOGGED_IN',
  'USER_LOGGED_OUT',
  'PASSWORD_RESET_REQUESTED',
  'PASSWORD_RESET_COMPLETED',
  'USER_CREATED',
  'USER_DEACTIVATED',
  'USER_REACTIVATED',
  'USER_ROLE_CHANGED',
  'RESOURCE_POOL_UPDATED',
  'COURSE_RESOURCES_ALLOCATED',
  'ACTIVITY_TYPE_CREATED',
  'ACTIVITY_TYPE_UPDATED',
  'ACTIVITY_TYPE_DELETED',
  'RESOURCE_REQUEST_ADMIN_APPROVED',
  'RESOURCE_REQUEST_ADMIN_REJECTED',
  'COURSE_CREATED',
  'MATERIAL_UPLOADED',
  'MATERIAL_DELETED',
  'RESOURCE_REQUEST_APPROVED',
  'RESOURCE_REQUEST_REJECTED',
  'RESOURCE_REQUEST_FORWARDED_TO_ADMIN',
  'STUDENT_ENROLLED',
  'HOMEWORK_SUBMITTED',
  'TOKENS_CONSUMED',
  'RESOURCE_REQUEST_CREATED',
] as const

const toIsoLocal = (value: string) => {
  if (!value) return undefined
  if (value.length === 16) return `${value}:00`
  return value
}

const ratio = (used: number, total: number) => {
  if (total <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((used / total) * 100)))
}

const bar = (used: number, total: number) => {
  const width = `${ratio(used, total)}%`
  return (
    <div style={{ width: 220, height: 10, borderRadius: 999, background: 'var(--color-surface-raised)', overflow: 'hidden' }}>
      <div style={{ width, height: '100%', background: 'var(--color-primary)' }} />
    </div>
  )
}

const AuditPanelPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AuditTab>('logs')
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [logsPage, setLogsPage] = useState<PageResponse<AuditLogEntry> | null>(null)
  const [logFilters, setLogFilters] = useState({
    page: 0,
    size: 20,
    userEmail: '',
    action: '',
    from: '',
    to: '',
  })

  const [studentId, setStudentId] = useState('')
  const [studentStats, setStudentStats] = useState<StudentCourseAuditStats[]>([])

  const [courseId, setCourseId] = useState('')
  const [courseStats, setCourseStats] = useState<CourseAuditStats | null>(null)

  const [universityStats, setUniversityStats] = useState<UniversityAuditStats | null>(null)

  const [studentOptions, setStudentOptions] = useState<AdminUser[]>([])

  const courseOptions = useMemo(() => universityStats?.courseStats ?? [], [universityStats])

  const runSafely = async (task: () => Promise<void>) => {
    setLoading(true)
    setNotice(null)
    try {
      await task()
    } catch (err) {
      if (err instanceof ApiError) setNotice(err.message)
      else setNotice('Unexpected error while loading audit data.')
    } finally {
      setLoading(false)
    }
  }

  const loadLogs = async (page: number = logFilters.page) => {
    await runSafely(async () => {
      const result = await auditApi.listLogs({
        page,
        size: logFilters.size,
        userEmail: logFilters.userEmail || undefined,
        action: logFilters.action || undefined,
        from: toIsoLocal(logFilters.from),
        to: toIsoLocal(logFilters.to),
      })
      setLogsPage(result)
      setLogFilters((prev) => ({ ...prev, page: result.number }))
    })
  }

  const loadStudentStats = async () => {
    if (!studentId) {
      setNotice('Provide a student ID.')
      return
    }

    await runSafely(async () => {
      setStudentStats(await auditApi.getStudentStats(studentId.trim()))
    })
  }

  const loadCourseStats = async () => {
    if (!courseId) {
      setNotice('Provide a course ID.')
      return
    }

    await runSafely(async () => {
      setCourseStats(await auditApi.getCourseStats(courseId.trim()))
    })
  }

  const loadUniversityStats = async () => {
    await runSafely(async () => {
      const stats = await auditApi.getUniversityStats()
      setUniversityStats(stats)
    })
  }

  useEffect(() => {
    void loadLogs(0)
  }, [])

  useEffect(() => {
    // Optional helper for dropdowns. If endpoint is unavailable, keep manual UUID input.
    const loadStudents = async () => {
      try {
        const users = await auditApi.listStudents()
        setStudentOptions(users.filter((u) => u.role === 'STUDENT' && u.isActive))
      } catch {
        setStudentOptions([])
      }
    }

    void loadStudents()
  }, [])

  useEffect(() => {
    if (activeTab !== 'course') return
    if (universityStats) return
    void loadUniversityStats()
  }, [activeTab, universityStats])

  const renderStudentStats = (stats: StudentCourseAuditStats) => {
    const tokenUsed = stats.tokensConsumed
    const tokenTotal = stats.tokensAllocated
    const vpsUsed = stats.vpsAllocated - stats.vpsRemaining

    return (
      <section className={styles.sectionCard} style={{ marginTop: 12 }}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>{stats.studentName} — {stats.courseName}</h2>
            <p className={styles.sectionHint}>{stats.studentEmail}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <strong>Tokens:</strong>
            <span>{tokenUsed.toLocaleString()} / {tokenTotal.toLocaleString()} used</span>
            {bar(tokenUsed, tokenTotal)}
            <span>Remaining: {stats.tokensRemaining.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <strong>VPS hours:</strong>
            <span>{vpsUsed.toLocaleString()} / {stats.vpsAllocated.toLocaleString()} used</span>
            {bar(vpsUsed, stats.vpsAllocated)}
            <span>Remaining: {stats.vpsRemaining.toLocaleString()}</span>
          </div>
          <div><strong>Submissions:</strong> {stats.submissionsCount}</div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Activity</th>
                <th>Quantity</th>
                <th>Tokens consumed</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.consumptionHistory.length === 0 && (
                <tr>
                  <td colSpan={4} className={styles.empty}>No consumption entries.</td>
                </tr>
              )}
              {stats.consumptionHistory.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.activityTypeName}</td>
                  <td>{entry.quantity}</td>
                  <td>{entry.tokensConsumed.toLocaleString()}</td>
                  <td>{new Date(entry.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Audit Panel</h1>
          <p className={styles.pageSubtitle}>Logs and usage statistics for audit users.</p>
        </div>
        <span className={styles.badge}>AUDIT</span>
      </div>

      {notice && <div className={styles.noticeError}>{notice}</div>}

      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <button className={styles.buttonSecondary} onClick={() => setActiveTab('logs')} disabled={activeTab === 'logs'}>Logs</button>
        <button className={styles.buttonSecondary} onClick={() => setActiveTab('student')} disabled={activeTab === 'student'} style={{ marginLeft: 8 }}>Student Stats</button>
        <button className={styles.buttonSecondary} onClick={() => setActiveTab('course')} disabled={activeTab === 'course'} style={{ marginLeft: 8 }}>Course Stats</button>
        <button className={styles.buttonSecondary} onClick={() => setActiveTab('university')} disabled={activeTab === 'university'} style={{ marginLeft: 8 }}>University Stats</button>
      </div>

      {activeTab === 'logs' && (
        <section className={styles.sectionCard}>
          <div className={styles.gridForm}>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>User Email</label>
              <input className={styles.input} value={logFilters.userEmail} onChange={(e) => setLogFilters((prev) => ({ ...prev, userEmail: e.target.value }))} placeholder="maria" />
            </div>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Action</label>
              <select className={styles.select} value={logFilters.action} onChange={(e) => setLogFilters((prev) => ({ ...prev, action: e.target.value }))}>
                <option value="">All actions</option>
                {AUDIT_ACTIONS.map((action) => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>From</label>
              <input
                className={styles.input}
                type="datetime-local"
                value={logFilters.from}
                onChange={(e) => setLogFilters((prev) => ({ ...prev, from: e.target.value }))}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>To</label>
              <input
                className={styles.input}
                type="datetime-local"
                value={logFilters.to}
                onChange={(e) => setLogFilters((prev) => ({ ...prev, to: e.target.value }))}
              />
            </div>
          </div>

          <div className={styles.inlineForm}>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Page size</label>
              <select className={styles.select} value={logFilters.size} onChange={(e) => setLogFilters((prev) => ({ ...prev, size: Number(e.target.value) || 20 }))}>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <button
              className={styles.buttonPrimary}
              disabled={loading}
              onClick={() => {
                setLogFilters((prev) => ({ ...prev, page: 0 }))
                void loadLogs(0)
              }}
            >
              Search
            </button>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {logsPage?.content.length === 0 && (
                  <tr>
                    <td colSpan={5} className={styles.empty}>No logs found for selected filters.</td>
                  </tr>
                )}
                {(logsPage?.content ?? []).map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>{log.userEmail || log.userId || 'SYSTEM'}</td>
                    <td>{log.userRole || '-'}</td>
                    <td>{log.action}</td>
                    <td>{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.inlineForm}>
            <button
              className={styles.buttonSecondary}
              disabled={loading || !!logsPage?.first}
              onClick={() => void loadLogs((logsPage?.number ?? 0) - 1)}
            >
              Prev
            </button>
            <span>Page {(logsPage?.number ?? 0) + 1} of {Math.max(logsPage?.totalPages ?? 1, 1)}</span>
            <button
              className={styles.buttonSecondary}
              disabled={loading || !!logsPage?.last}
              onClick={() => void loadLogs((logsPage?.number ?? 0) + 1)}
            >
              Next
            </button>
          </div>
        </section>
      )}

      {activeTab === 'student' && (
        <section className={styles.sectionCard}>
          <div className={styles.gridForm}>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Student</label>
              <select
                className={styles.select}
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                disabled={studentOptions.length === 0}
              >
                <option value="">Select student (optional helper)</option>
                {studentOptions.map((user) => (
                  <option key={user.id} value={user.id}>{user.firstName} {user.lastName} - {user.email}</option>
                ))}
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Action</label>
              <button className={styles.buttonPrimary} disabled={loading} onClick={() => void loadStudentStats()}>View Stats</button>
            </div>
          </div>

          {studentStats.length > 0 && studentStats.map((stats) => (
            <div key={`${stats.studentId}-${stats.courseId}`}>
              {renderStudentStats(stats)}
            </div>
          ))}

          {studentId && studentStats.length === 0 && !loading && (
            <div className={styles.empty}>No enrolled courses found for this student.</div>
          )}
        </section>
      )}

      {activeTab === 'course' && (
        <section className={styles.sectionCard}>
          <div className={styles.gridForm}>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Course</label>
              <select className={styles.select} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                <option value="">Select from active courses</option>
                {courseOptions.map((course) => (
                  <option key={course.courseId} value={course.courseId}>{course.courseName}</option>
                ))}
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Action</label>
              <button className={styles.buttonPrimary} disabled={loading} onClick={() => void loadCourseStats()}>View Stats</button>
            </div>
          </div>

          {courseStats && (
            <section className={styles.sectionCard} style={{ marginTop: 12 }}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>{courseStats.courseName} — Prof: {courseStats.professorName}</h2>
                  <p className={styles.sectionHint}>Enrolled: {courseStats.enrolledCount} / {courseStats.maxStudents}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <strong>Tokens:</strong>
                  <span>{courseStats.tokensConsumed.toLocaleString()} / {courseStats.tokensAllocated.toLocaleString()} used</span>
                  {bar(courseStats.tokensConsumed, courseStats.tokensAllocated)}
                  <span>Remaining: {courseStats.tokensRemaining.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <strong>VPS hours:</strong>
                  <span>{(courseStats.vpsAllocated - courseStats.vpsRemaining).toLocaleString()} / {courseStats.vpsAllocated.toLocaleString()} used</span>
                  {bar(courseStats.vpsAllocated - courseStats.vpsRemaining, courseStats.vpsAllocated)}
                  <span>Remaining: {courseStats.vpsRemaining.toLocaleString()}</span>
                </div>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Tokens</th>
                      <th>VPS hours</th>
                      <th>Submissions</th>
                      <th>History</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseStats.studentStats.length === 0 && (
                      <tr>
                        <td colSpan={6} className={styles.empty}>No enrolled students.</td>
                      </tr>
                    )}
                    {courseStats.studentStats.map((student) => (
                      <tr key={student.studentId}>
                        <td>{student.studentName}</td>
                        <td>{student.studentEmail}</td>
                        <td>{student.tokensConsumed.toLocaleString()} / {student.tokensAllocated.toLocaleString()}</td>
                        <td>{(student.vpsAllocated - student.vpsRemaining).toLocaleString()} / {student.vpsAllocated.toLocaleString()}</td>
                        <td>{student.submissionsCount}</td>
                        <td>
                          <details>
                            <summary>View</summary>
                            <div style={{ marginTop: 8, maxHeight: 180, overflow: 'auto' }}>
                              {student.consumptionHistory.length === 0 && <div className={styles.empty}>No entries.</div>}
                              {student.consumptionHistory.map((entry) => (
                                <div key={entry.id} style={{ marginBottom: 6 }}>
                                  {entry.activityTypeName} × {entry.quantity} = {entry.tokensConsumed.toLocaleString()} tokens ({new Date(entry.createdAt).toLocaleString()})
                                </div>
                              ))}
                            </div>
                          </details>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </section>
      )}

      {activeTab === 'university' && (
        <section className={styles.sectionCard}>
          <div className={styles.inlineForm}>
            <button className={styles.buttonPrimary} disabled={loading} onClick={() => void loadUniversityStats()}>Refresh University Stats</button>
          </div>

          {universityStats && (
            <>
              <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <strong>Token Pool:</strong>
                  <span>{universityStats.tokensTotalConsumed.toLocaleString()} / {universityStats.tokenPoolAllocated.toLocaleString()} allocated consumed</span>
                  {bar(universityStats.tokensTotalConsumed, universityStats.tokenPoolAllocated)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <strong>VPS Pool:</strong>
                  <span>{(universityStats.vpsPoolAllocated - universityStats.vpsPoolAvailable).toLocaleString()} / {universityStats.vpsPoolAllocated.toLocaleString()} allocated consumed</span>
                  {bar(universityStats.vpsPoolAllocated - universityStats.vpsPoolAvailable, universityStats.vpsPoolAllocated)}
                </div>
                <div>
                  Courses: {universityStats.activeCourses} active / {universityStats.totalCourses} total
                </div>
                <div>
                  Students: {universityStats.totalStudents} total | Enrollments: {universityStats.totalEnrollments}
                </div>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Professor</th>
                      <th>Enrolled</th>
                      <th>Tokens</th>
                      <th>VPS hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {universityStats.courseStats.length === 0 && (
                      <tr>
                        <td colSpan={5} className={styles.empty}>No active courses.</td>
                      </tr>
                    )}
                    {universityStats.courseStats.map((course) => (
                      <tr key={course.courseId}>
                        <td>{course.courseName}</td>
                        <td>{course.professorName}</td>
                        <td>{course.enrolledCount} / {course.maxStudents}</td>
                        <td>{course.tokensConsumed.toLocaleString()} / {course.tokensAllocated.toLocaleString()}</td>
                        <td>{(course.vpsAllocated - course.vpsRemaining).toLocaleString()} / {course.vpsAllocated.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}

export default AuditPanelPage
