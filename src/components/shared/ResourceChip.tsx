import React from 'react'
import { Server, Zap } from 'lucide-react'
import styles from './ResourceChip.module.css'

interface ResourceChipProps {
  type: 'tokens' | 'vps'
  amount: number
}

export const ResourceChip: React.FC<ResourceChipProps> = ({ type, amount }) => {
  const Icon = type === 'tokens' ? Zap : Server

  return (
    <span className={styles.chip}>
      <Icon size={16} strokeWidth={1.5} className={styles.icon} aria-hidden="true" />
      <span className={styles.amount}>{type === 'tokens' ? `${amount} tokeni` : `${amount} VPS`}</span>
    </span>
  )
}

export default ResourceChip
