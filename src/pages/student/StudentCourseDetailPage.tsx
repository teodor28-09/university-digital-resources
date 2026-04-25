import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ApiError,
  studentApi,
  type ActivityType,
  type CourseMaterialResponse,
  type EnrollmentResponse,
  type ResourceRequestResponse,
  type StudentResourceBalanceResponse,
  type SubmissionResponse,
  type TokenConsumptionResponse,
} from '../../lib/api'
import styles from '../admin/AdminDashboard.module.css'

type Tab = 'materials' | 'homework' | 'tokens' | 'requests'
type RequestType = 'TOKEN' | 'VPS'

interface ActivityDraft {
  id: string
  activityTypeId: string
  quantity: number
}

const requestStatusLabel = (request: ResourceRequestResponse) => {
  if (request.status === 'PENDING') return '⏳ Waiting for professor review'
  if (request.status === 'APPROVED') return '✅ Approved by professor'
  if (request.status === 'REJECTED') return '❌ Rejected'
  if (request.status === 'FORWARDED_TO_ADMIN') return '⏳ Forwarded to admin for approval'
  if (request.status === 'ADMIN_APPROVED') return '✅ Approved by admin'
  return '❌ Rejected by admin'
}

const requestNoteLabel = (request: ResourceRequestResponse) => {
  if (request.status === 'APPROVED' && request.professorNote) return `Professor note: ${request.professorNote}`
  if (request.status === 'REJECTED' && request.professorNote) return `Professor note: ${request.professorNote}`
  if (request.status === 'ADMIN_APPROVED' && request.adminNote) return `Admin note: ${request.adminNote}`
  if (request.status === 'ADMIN_REJECTED' && request.adminNote) return `Admin note: ${request.adminNote}`
  return '-'
}

const StudentCourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('materials')
  const [enrollment, setEnrollment] = useState<EnrollmentResponse | null>(null)
  const [balance, setBalance] = useState<StudentResourceBalanceResponse | null>(null)
  const [materials, setMaterials] = useState<CourseMaterialResponse[]>([])
  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([])
  const [consumptions, setConsumptions] = useState<TokenConsumptionResponse[]>([])
  const [requests, setRequests] = useState<ResourceRequestResponse[]>([])
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([])
  const [selectedSubmissionFile, setSelectedSubmissionFile] = useState<File | null>(null)
  const [activityDrafts, setActivityDrafts] = useState<ActivityDraft[]>([{ id: crypto.randomUUID(), activityTypeId: '', quantity: 1 }])
  const [requestType, setRequestType] = useState<RequestType>('TOKEN')
  const [requestAmount, setRequestAmount] = useState(1)

  const load = async () => {
    if (!id) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [enrolled, cMaterials, cBalance, cConsumptions, cSubmissions, cRequests, cActivityTypes] = await Promise.all([
        studentApi.listEnrolledCourses(),
        studentApi.listMaterials(id),
        studentApi.getBalance(id),
        studentApi.listTokenConsumption(id),
        studentApi.listSubmissions(id),
        studentApi.listResourceRequests(id),
        studentApi.listActivityTypes(),
      ])

      setEnrollment(enrolled.find((item) => item.courseId === id) ?? null)
      setMaterials(cMaterials)
      setBalance(cBalance)
      setConsumptions(cConsumptions)
      setSubmissions(cSubmissions)
      setRequests(cRequests)
      setActivityTypes(cActivityTypes.filter((type) => type.isActive))
    } catch (err) {
      if (err instanceof ApiError) {
        setNotice(err.message)
      } else {
        setNotice('Nu s-au putut încărca datele cursului.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [id])

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  const totalCost = useMemo(() => {
    return activityDrafts.reduce((acc, draft) => {
      const activity = activityTypes.find((item) => item.id === draft.activityTypeId)
      if (!activity || draft.quantity < 1) return acc
      return acc + activity.tokensRequired * draft.quantity
    }, 0)
  }, [activityDrafts, activityTypes])

  const balanceAfter = (balance?.tokenBalance ?? 0) - totalCost

  const addActivityRow = () => {
    setActivityDrafts((prev) => [...prev, { id: crypto.randomUUID(), activityTypeId: '', quantity: 1 }])
  }

  const submitHomework = async () => {
    if (!id || !selectedSubmissionFile) return
    setBusy(true)
    setNotice(null)
    try {
      await studentApi.submitHomework(id, selectedSubmissionFile)
      setSelectedSubmissionFile(null)
      await load()
      setNotice('Tema a fost încărcată.')
    } catch (err) {
      if (err instanceof ApiError) setNotice(err.message)
      else setNotice('Nu s-a putut încărca tema.')
    } finally {
      setBusy(false)
    }
  }

  const consumeTokens = async () => {
    if (!id) return

    const activities = activityDrafts
      .filter((draft) => draft.activityTypeId && draft.quantity >= 1)
      .map((draft) => ({ activityTypeId: draft.activityTypeId, quantity: draft.quantity }))

    if (activities.length === 0) {
      setNotice('Adaugă cel puțin o activitate validă.')
      return
    }

    setBusy(true)
    setNotice(null)
    try {
      await studentApi.consumeTokens(id, activities)
      await load()
      setNotice('Consumul de tokeni a fost înregistrat.')
      setActivityDrafts([{ id: crypto.randomUUID(), activityTypeId: '', quantity: 1 }])
    } catch (err) {
      if (err instanceof ApiError) setNotice(err.message)
      else setNotice('Nu s-au putut consuma tokenii.')
    } finally {
      setBusy(false)
    }
  }

  const createRequest = async () => {
    if (!id || requestAmount < 1) return
    setBusy(true)
    setNotice(null)
    try {
      await studentApi.createResourceRequest(id, { resourceType: requestType, amountRequested: requestAmount })
      setRequestAmount(1)
      await load()
      setNotice('Cererea a fost trimisă.')
    } catch (err) {
      if (err instanceof ApiError) setNotice(err.message)
      else setNotice('Nu s-a putut trimite cererea.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className={styles.empty}>Se încarcă...</div>

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{enrollment?.courseName ?? 'Course detail'}</h1>
          <p className={styles.pageSubtitle}>Prof: {enrollment?.professorName ?? '-'}</p>
          <p className={`${styles.pageSubtitle} ${styles.pageBalance}`}>
            Balance: {balance ? `${balance.tokenBalance.toLocaleString()} tokens | ${balance.vpsBalance.toLocaleString()} VPS hours` : '-'}
          </p>
        </div>
        <Link to="/student" className={styles.buttonSecondary}>Înapoi</Link>
      </div>

      {notice && <div className={`${styles.toast} ${styles.noticeSuccess}`}>{notice}</div>}

      <div style={{ marginBottom: 12 }}>
        <button className={styles.buttonSecondary} onClick={() => setActiveTab('materials')} disabled={activeTab === 'materials'}>Materials</button>
        <button className={styles.buttonSecondary} onClick={() => setActiveTab('homework')} disabled={activeTab === 'homework'} style={{ marginLeft: 8 }}>Submit Homework</button>
        <button className={styles.buttonSecondary} onClick={() => setActiveTab('tokens')} disabled={activeTab === 'tokens'} style={{ marginLeft: 8 }}>Use Tokens</button>
        <button className={styles.buttonSecondary} onClick={() => setActiveTab('requests')} disabled={activeTab === 'requests'} style={{ marginLeft: 8 }}>My Requests</button>
      </div>

      {activeTab === 'materials' && (
        <section>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Fișier</th><th>Dimensiune</th><th>Data încărcării</th><th>Acțiuni</th></tr>
              </thead>
              <tbody>
                {materials.length === 0 && (
                  <tr>
                    <td colSpan={4} className={styles.empty}>Nu există materiale.</td>
                  </tr>
                )}
                {materials.map((item) => (
                  <tr key={item.id}>
                    <td>{item.originalFilename}</td>
                    <td>{(item.size / 1024).toFixed(1)} KB</td>
                    <td>{new Date(item.createdAt).toLocaleString()}</td>
                    <td>
                      <a href={studentApi.getMaterialDownloadUrl(item.courseId, item.id)} className={styles.buttonSecondary} download>
                        Descarcă
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'homework' && (
        <section>
          <div className={styles.actions} style={{ marginBottom: 12 }}>
            <label className={styles.fileInput}>
              <input
                type="file"
                className={styles.fileInputNative}
                onChange={(event) => setSelectedSubmissionFile(event.target.files?.[0] ?? null)}
                disabled={busy}
              />
              <span className={`${styles.buttonSecondary} ${styles.fileButton}`}>
                {selectedSubmissionFile ? selectedSubmissionFile.name : 'Choose file'}
              </span>
            </label>
            <button className={styles.buttonPrimary} disabled={busy || !selectedSubmissionFile} onClick={submitHomework}>Submit</button>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Fișier</th><th>Dimensiune</th><th>Data încărcării</th></tr>
              </thead>
              <tbody>
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={3} className={styles.empty}>Nu există teme trimise.</td>
                  </tr>
                )}
                {submissions.map((item) => (
                  <tr key={item.id}>
                    <td>{item.originalFilename}</td>
                    <td>{(item.size / 1024).toFixed(1)} KB</td>
                    <td>{new Date(item.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'tokens' && (
        <section>
          <div className={styles.actions} style={{ marginBottom: 12 }}>
            <button className={styles.buttonSecondary} onClick={addActivityRow} disabled={busy}>+ Add activity</button>
          </div>

          {activityDrafts.map((row, idx) => (
            <div className={styles.gridForm} key={row.id} style={{ marginBottom: 8 }}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Activity</label>
                <select
                  className={styles.select}
                  value={row.activityTypeId}
                  onChange={(event) => setActivityDrafts((prev) => prev.map((item) => (item.id === row.id ? { ...item, activityTypeId: event.target.value } : item)))}
                >
                  <option value="">Select activity</option>
                  {activityTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name} ({type.tokensRequired} tokens)</option>
                  ))}
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Quantity</label>
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  value={row.quantity}
                  onChange={(event) => setActivityDrafts((prev) => prev.map((item) => (item.id === row.id ? { ...item, quantity: Number(event.target.value) || 1 } : item)))}
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Cost</label>
                <div className={styles.input} style={{ display: 'flex', alignItems: 'center' }}>
                  {(() => {
                    const current = activityTypes.find((item) => item.id === row.activityTypeId)
                    if (!current) return '0'
                    return (current.tokensRequired * row.quantity).toLocaleString()
                  })()}
                </div>
              </div>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Action</label>
                {idx === activityDrafts.length - 1 ? (
                  <>
                    <div style={{ marginBottom: 8 }}>
                      <div>Total: {totalCost.toLocaleString()} tokens</div>
                      <div>Balance after: {balanceAfter.toLocaleString()} {balanceAfter < 0 ? '⚠' : ''}</div>
                    </div>
                    <button className={styles.buttonPrimary} disabled={busy} onClick={consumeTokens}>Confirm</button>
                  </>
                ) : (
                  <div style={{ height: 36 }} />
                )}
              </div>
            </div>
          ))}
          

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Activitate</th><th>Cantitate</th><th>Tokeni consumați</th><th>Data</th></tr>
              </thead>
              <tbody>
                {consumptions.length === 0 && (
                  <tr>
                    <td colSpan={4} className={styles.empty}>Nu există consum înregistrat.</td>
                  </tr>
                )}
                {consumptions.map((item) => (
                  <tr key={item.id}>
                    <td>{item.activityTypeName}</td>
                    <td>{item.quantity}</td>
                    <td>{item.tokensConsumed.toLocaleString()}</td>
                    <td>{new Date(item.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'requests' && (
        <section>
          <div className={styles.inlineForm}>
            <select className={styles.select} value={requestType} onChange={(event) => setRequestType(event.target.value as RequestType)}>
              <option value="TOKEN">TOKEN</option>
              <option value="VPS">VPS hours</option>
            </select>
            <input className={styles.input} type="number" min={1} value={requestAmount} onChange={(event) => setRequestAmount(Number(event.target.value) || 1)} />
            <button className={`${styles.buttonPrimary} ${styles.requestButton}`} disabled={busy || requestAmount < 1} onClick={createRequest}>Request more</button>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Tip</th><th>Cantitate</th><th>Status</th><th>Context</th><th>Data</th></tr>
              </thead>
              <tbody>
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={5} className={styles.empty}>Nu există cereri.</td>
                  </tr>
                )}
                {requests.map((item) => (
                  <tr key={item.id}>
                    <td>{item.resourceType === 'VPS' ? 'VPS hours' : item.resourceType}</td>
                    <td>{item.amountRequested.toLocaleString()}</td>
                    <td>{requestStatusLabel(item)}</td>
                    <td>{requestNoteLabel(item)}</td>
                    <td>{new Date(item.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

export default StudentCourseDetailPage
