import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { professorApi, ApiError, type CourseResponse, type CourseMaterialResponse, type ResourceRequestResponse } from '../../lib/api'
import styles from '../admin/AdminDashboard.module.css'

type Tab = 'materials' | 'requests'
type RequestView = 'pending' | 'all'

const requestStatusText = (status: ResourceRequestResponse['status']) => {
  if (status === 'PENDING') return 'PENDING'
  if (status === 'APPROVED') return 'APPROVED'
  if (status === 'REJECTED') return 'REJECTED'
  if (status === 'FORWARDED_TO_ADMIN') return 'FORWARDED_TO_ADMIN'
  if (status === 'ADMIN_APPROVED') return 'ADMIN_APPROVED'
  return 'ADMIN_REJECTED'
}

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<CourseResponse | null>(null)
  const [materials, setMaterials] = useState<CourseMaterialResponse[]>([])
  const [pendingRequests, setPendingRequests] = useState<ResourceRequestResponse[]>([])
  const [allRequests, setAllRequests] = useState<ResourceRequestResponse[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('materials')
  const [requestView, setRequestView] = useState<RequestView>('pending')
  const [requestNotes, setRequestNotes] = useState<Record<string, string>>({})
  const [bufferWarnings, setBufferWarnings] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [c, m, pending, all] = await Promise.all([
        professorApi.getCourse(id),
        professorApi.listMaterials(id),
        professorApi.listResourceRequests(id),
        professorApi.listAllResourceRequests(id),
      ])
      setCourse(c)
      setMaterials(m)
      setPendingRequests(pending)
      setAllRequests(all)
    } catch (err) {
      setCourse(null)
      if (err instanceof ApiError) {
        setNotice(err.message)
      } else {
        setNotice('Nu s-au putut încărca datele cursului.')
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [id])

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id) return
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true); setNotice(null)
    try {
      await professorApi.uploadMaterial(id, file)
      await load()
      setNotice('Fișier încărcat.')
    } catch (err) {
      if (err instanceof ApiError) setNotice(err.message)
      else setNotice('Eroare la upload')
    } finally { setBusy(false); if (e.target) e.target.value = '' }
  }

  const approve = async (reqId: string) => {
    setBusy(true); setNotice(null)
    setBufferWarnings((prev) => {
      const { [reqId]: _ignored, ...rest } = prev
      return rest
    })
    try {
      await professorApi.approveResourceRequest(reqId, requestNotes[reqId]?.trim() || undefined)
      await load()
      setNotice('Cerere aprobată.')
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errorCode === 'EXCEEDS_PROFESSOR_BUFFER') {
          setBufferWarnings((prev) => ({
            ...prev,
            [reqId]: 'This request exceeds your remaining buffer. You can forward it to the admin for approval.',
          }))
          setNotice('Request exceeds your remaining buffer.')
        } else {
          setNotice(err.message)
        }
      } else {
        setNotice('Eroare la aprobarea cererii.')
      }
    } finally { setBusy(false) }
  }

  const reject = async (reqId: string) => {
    setBusy(true); setNotice(null)
    try {
      await professorApi.rejectResourceRequest(reqId, requestNotes[reqId]?.trim() || undefined)
      await load()
      setNotice('Cerere respinsă.')
    } catch (err) {
      if (err instanceof ApiError) setNotice(err.message)
      else setNotice('Eroare la respingerea cererii.')
    } finally { setBusy(false) }
  }

  const forward = async (reqId: string) => {
    setBusy(true)
    setNotice(null)
    try {
      await professorApi.forwardResourceRequest(reqId, requestNotes[reqId]?.trim() || undefined)
      await load()
      setNotice('Cererea a fost trimisă către admin.')
      setBufferWarnings((prev) => {
        const { [reqId]: _ignored, ...rest } = prev
        return rest
      })
    } catch (err) {
      if (err instanceof ApiError) setNotice(err.message)
      else setNotice('Eroare la forward către admin.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className={styles.empty}>Se încarcă...</div>

  if (!course) return <div className={styles.empty}>Cursul nu a fost găsit.</div>

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{course.name}</h1>
          <p className={styles.pageSubtitle}>{course.description}</p>
        </div>
        <Link to="/profesor/courses" className={styles.buttonSecondary}>Înapoi</Link>
      </div>

      {notice && <div style={{ marginBottom: 12 }}>{notice}</div>}

      <div style={{ marginBottom: 12 }}>
        <button className={styles.buttonSecondary} onClick={() => setActiveTab('materials')} disabled={activeTab === 'materials'}>Materials</button>
        <button className={styles.buttonSecondary} onClick={() => setActiveTab('requests')} disabled={activeTab === 'requests'} style={{ marginLeft: 8 }}>Resource Requests</button>
      </div>

      {activeTab === 'materials' && (
        <section style={{ marginBottom: 18 }}>
          <h3>Materiale</h3>
          <label className={styles.fileInput}>
            <input type="file" onChange={onUpload} disabled={busy} className={styles.fileInputNative} />
            <span className={`${styles.buttonSecondary} ${styles.fileButton}`}>{busy ? 'Încarcă...' : 'Alege fișier'}</span>
          </label>
          <div className={styles.tableWrap} style={{ marginTop: 8 }}>
            <table className={styles.table}>
              <thead>
                <tr><th>Fișier</th><th>Dimensiune</th><th>Data încărcării</th><th>Acțiuni</th></tr>
              </thead>
              <tbody>
                {materials.length === 0 && (
                  <tr>
                    <td colSpan={4} className={styles.empty}>Nu există materiale încărcate.</td>
                  </tr>
                )}

                {materials.map((m) => (
                  <tr key={m.id}>
                    <td>{m.originalFilename}</td>
                    <td>{(m.size / 1024).toFixed(1)} KB</td>
                    <td>{new Date(m.createdAt).toLocaleString()}</td>
                    <td>
                                  <div className={styles.actions}>
                                    <a href={professorApi.getMaterialDownloadUrl(course.id, m.id)} className={styles.buttonSecondary} download>
                                      Descarcă
                                    </a>
                                    <button
                                      className={styles.buttonDanger}
                                      onClick={async () => {
                                        if (!confirm('Sigur dorești să ștergi acest fișier?')) return
                                        setBusy(true); setNotice(null)
                                        try {
                                          await professorApi.deleteMaterial(course.id, m.id)
                                          await load()
                                          setNotice('Fișier șters.')
                                        } catch (err) {
                                          if (err instanceof ApiError) setNotice(err.message)
                                          else setNotice('Eroare la ștergerea fișierului.')
                                        } finally { setBusy(false) }
                                      }}
                                    >
                                      Șterge
                                    </button>
                                  </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'requests' && (
        <section>
          <h3>Cereri resurse</h3>
          <div style={{ marginBottom: 12 }}>
            <button className={styles.buttonSecondary} onClick={() => setRequestView('pending')} disabled={requestView === 'pending'}>
              Pending ({pendingRequests.length})
            </button>
            <button className={styles.buttonSecondary} onClick={() => setRequestView('all')} disabled={requestView === 'all'} style={{ marginLeft: 8 }}>
              All Requests
            </button>
          </div>

          {requestView === 'pending' && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Student</th><th>Resursă</th><th>Cantitate</th><th>Data</th><th>Note</th><th>Acțiuni</th></tr>
              </thead>
              <tbody>
                {pendingRequests.length === 0 && (
                  <tr>
                    <td colSpan={6} className={styles.empty}>Nu există cereri în așteptare.</td>
                  </tr>
                )}

                {pendingRequests.map((r) => (
                  <React.Fragment key={r.id}>
                    <tr>
                      <td>{r.studentName}</td>
                      <td>{r.resourceType === 'VPS' ? 'VPS hours' : 'TOKEN'}</td>
                      <td>{r.amountRequested.toLocaleString()}</td>
                      <td>{new Date(r.createdAt).toLocaleString()}</td>
                      <td>
                        <input
                          className={styles.input}
                          placeholder="Notă opțională"
                          value={requestNotes[r.id] ?? ''}
                          onChange={(event) => setRequestNotes((prev) => ({ ...prev, [r.id]: event.target.value }))}
                        />
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button className={styles.buttonPrimary} disabled={busy} onClick={() => approve(r.id)}>Approve</button>
                          <button className={styles.buttonSecondary} disabled={busy} onClick={() => reject(r.id)}>Reject</button>
                          <button className={styles.buttonSecondary} disabled={busy} onClick={() => forward(r.id)}>Forward to Admin</button>
                        </div>
                      </td>
                    </tr>
                    {bufferWarnings[r.id] && (
                      <tr>
                        <td colSpan={6} className={styles.noticeError}>{bufferWarnings[r.id]}</td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          )}

          {requestView === 'all' && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Student</th><th>Resursă</th><th>Cantitate</th><th>Status</th><th>Professor note</th><th>Admin note</th><th>Data</th></tr>
                </thead>
                <tbody>
                  {allRequests.length === 0 && (
                    <tr>
                      <td colSpan={7} className={styles.empty}>Nu există cereri în istoric.</td>
                    </tr>
                  )}

                  {allRequests.map((r) => (
                    <tr key={r.id}>
                      <td>{r.studentName}</td>
                      <td>{r.resourceType === 'VPS' ? 'VPS hours' : 'TOKEN'}</td>
                      <td>{r.amountRequested.toLocaleString()}</td>
                      <td>{requestStatusText(r.status)}</td>
                      <td>{r.professorNote || '-'}</td>
                      <td>{r.adminNote || '-'}</td>
                      <td>{new Date(r.updatedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default CourseDetailPage
