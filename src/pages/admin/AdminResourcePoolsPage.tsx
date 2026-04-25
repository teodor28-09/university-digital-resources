import React, { useEffect, useMemo, useState } from 'react'
import type { User } from '../../types'
import { adminApi, ApiError, type ResourcePool } from '../../lib/api'
import styles from './AdminDashboard.module.css'

interface AdminResourcePoolsPageProps {
  currentUser: User
}

type NoticeState = { type: 'success' | 'error'; message: string } | null

interface ResourceTotalsState {
  TOKEN: number
  VPS: number
}

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof ApiError) {
    return err.message || fallback
  }

  return fallback
}

const AdminResourcePoolsPage: React.FC<AdminResourcePoolsPageProps> = ({ currentUser }) => {
  const [loading, setLoading] = useState(true)
  const [resourcePools, setResourcePools] = useState<ResourcePool[]>([])
  const [resourceTotals, setResourceTotals] = useState<ResourceTotalsState>({ TOKEN: 0, VPS: 0 })
  const [addAmounts, setAddAmounts] = useState<ResourceTotalsState>({ TOKEN: 0, VPS: 0 })
  const [notice, setNotice] = useState<NoticeState>(null)
  const [busy, setBusy] = useState(false)

  const poolsByType = useMemo(
    () => ({
      TOKEN: resourcePools.find((pool) => pool.type === 'TOKEN') ?? null,
      VPS: resourcePools.find((pool) => pool.type === 'VPS') ?? null,
    }),
    [resourcePools],
  )

  const loadPools = async () => {
    setLoading(true)
    try {
      const pools = await adminApi.listResourcePools()
      setResourcePools(pools)
      setResourceTotals({
        TOKEN: pools.find((pool) => pool.type === 'TOKEN')?.totalAmount ?? 0,
        VPS: pools.find((pool) => pool.type === 'VPS')?.totalAmount ?? 0,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPools()
  }, [])

  const handleAddTotal = async (type: 'TOKEN' | 'VPS') => {
    const amount = addAmounts[type]
    if (amount < 1) {
      setNotice({ type: 'error', message: 'Amount must be at least 1.' })
      return
    }

    setBusy(true)
    setNotice(null)
    try {
      await adminApi.addResourceTotal(type, amount)
      const updatedPools = await adminApi.listResourcePools()
      setResourcePools(updatedPools)
      setResourceTotals({
        TOKEN: updatedPools.find((p) => p.type === 'TOKEN')?.totalAmount ?? 0,
        VPS: updatedPools.find((p) => p.type === 'VPS')?.totalAmount ?? 0,
      })
      setAddAmounts((prev) => ({ ...prev, [type]: 0 }))
      setNotice({ type: 'success', message: `Au fost adăugați ${amount} ${type}.` })
    } catch (err) {
      setNotice({ type: 'error', message: getErrorMessage(err, 'Nu s-au putut adăuga resursele.') })
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className={styles.empty}>Se încarcă resource pool...</div>
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Resource Pool</h1>
          <p className={styles.pageSubtitle}>Bun venit, {currentUser.name}. Setează totalurile universitare pentru TOKEN și VPS.</p>
        </div>
        <span className={styles.badge}>RESOURCES</span>
      </div>

      <div className={styles.stack}>
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Manage Resource Pools</h2>
              <p className={styles.sectionHint}>Definește totalul disponibil la nivel de universitate.</p>
            </div>
          </div>

          <div className={styles.resourcesGrid}>
            {(['TOKEN', 'VPS'] as const).map((type) => {
              const pool = poolsByType[type]

              return (
                <div key={type} className={styles.poolCard}>
                  <div className={styles.poolTitle}>{type}</div>
                  <div className={styles.poolMeta}>
                    <div className={styles.metaItem}>
                      <div className={styles.metaLabel}>Total</div>
                      <div className={styles.metaValue}>{pool?.totalAmount ?? 0}</div>
                    </div>
                    <div className={styles.metaItem}>
                      <div className={styles.metaLabel}>Alocat</div>
                      <div className={styles.metaValue}>{pool?.allocatedAmount ?? 0}</div>
                    </div>
                    <div className={styles.metaItem}>
                      <div className={styles.metaLabel}>Disponibil</div>
                      <div className={styles.metaValue}>{pool?.availableAmount ?? 0}</div>
                    </div>
                  </div>

                  <div className={styles.inlineForm}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        className={styles.input}
                        type="number"
                        min={1}
                        value={addAmounts[type]}
                        onChange={(e) => {
                          const raw = e.target.value
                          const cleaned = raw.replace(/^0+(?=\d)/, '')
                          setAddAmounts((prev) => ({ ...prev, [type]: cleaned === '' ? 0 : Number(cleaned) }))
                        }}
                        placeholder={type === 'TOKEN' ? 'Adaugă tokeni' : 'Adaugă VPS'}
                      />
                      <button type="button" className={styles.buttonPrimary} disabled={busy} onClick={() => handleAddTotal(type)}>Adaugă</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {notice && <div className={notice.type === 'success' ? styles.noticeSuccess : styles.noticeError}>{notice.message}</div>}
        </section>
      </div>
    </div>
  )
}

export default AdminResourcePoolsPage
