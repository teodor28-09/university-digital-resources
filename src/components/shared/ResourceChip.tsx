import React from 'react'
import styles from './ResourceChip.module.css'

interface ResourceChipProps {
  type: 'tokens' | 'vps'
  amount: number
}

export const ResourceChip: React.FC<ResourceChipProps> = ({ type, amount }) => {
  return (
    <span className={styles.chip}>
      <span className={styles.icon}>{type === 'tokens' ? '◆' : '▣'}</span>
      <span className={styles.amount}>{type === 'tokens' ? `${amount} tokeni` : `${amount} VPS`}</span>
    </span>
  )
}

export default ResourceChip
