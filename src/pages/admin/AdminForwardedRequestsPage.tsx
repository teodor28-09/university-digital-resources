import React, { useEffect, useState } from 'react'
import { adminCoursesApi, ApiError, type ResourceRequestResponse } from '../../lib/api'
import styles from './AdminDashboard.module.css'

const AdminForwardedRequestsPage: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<ResourceRequestResponse[]>([])
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      setRequests(await adminCoursesApi.listForwardedRequests())
    } catch (err) {
      if (err instanceof ApiError) setNotice(err.message)
      else setNotice('Eroare la încărcarea cererilor.')
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const approve = async (id: string) => {
    setBusy(true); setNotice(null)
    try {
      await adminCoursesApi.approveForwardedRequest(id)
      await load()
      setNotice('Cerere aprobată.')
    } catch (err) {
      if (err instanceof ApiError) setNotice(err.message)
      else setNotice('Eroare la aprobare')
    } finally { setBusy(false) }
  }

  const reject = async (id: string) => {
    setBusy(true); setNotice(null)
    try {
      await adminCoursesApi.rejectForwardedRequest(id)
      await load()
      setNotice('Cerere respinsă.')
    } catch (err) {
      if (err instanceof ApiError) setNotice(err.message)
      else setNotice('Eroare la respingere')
    } finally { setBusy(false) }
  }

  if (loading) return <div className={styles.empty}>Se încarcă...</div>

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Admin — Forwarded Requests</h1>
          <p className={styles.pageSubtitle}>Requests escalated to admin.</p>
        </div>
        <span className={styles.badge}>FORWARDED</span>
      </div>

      {notice && <div style={{ marginBottom: 12 }}>{notice}</div>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Student</th>
              <th>Course</th>
              <th>Resource</th>
              <th>Amount</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.empty}>Nu există cereri către admin.</td>
              </tr>
            )}

            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.studentName}</td>
                <td>{r.courseName}</td>
                <td>{r.resourceType}</td>
                <td>{r.amountRequested}</td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
                <td>
                  <div className={styles.actions}>
                    <button type="button" className={styles.buttonPrimary} disabled={busy} onClick={() => approve(r.id)}>Approve</button>
                    <button type="button" className={styles.buttonSecondary} disabled={busy} onClick={() => reject(r.id)}>Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminForwardedRequestsPage
