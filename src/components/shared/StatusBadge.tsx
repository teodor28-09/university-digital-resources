import React from 'react'
import styles from './StatusBadge.module.css'

interface StatusBadgeProps {
  status: 'draft' | 'active' | 'closed'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const cls = status === 'active' ? styles.active : status === 'closed' ? styles.closed : styles.draft
  const text = status === 'active' ? 'Activ' : status === 'closed' ? 'Închis' : 'Draft'
  return <span className={`${styles.badge} ${cls}`}>{text}</span>
}

export default StatusBadge
