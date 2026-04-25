import React from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './NotFound.module.css'

const NotFound: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.title}>Pagina nu a fost găsită</div>
        <div className={styles.subtitle}>Ne pare rău — pagina pe care o cauți nu există sau a fost mutată.</div>

        <div className={styles.actions}>
          <button className={styles.buttonPrimary} onClick={() => navigate(-1)}>Înapoi</button>
          <button className={styles.buttonGhost} onClick={() => navigate('/')}>Pagina principală</button>
        </div>
      </div>
    </div>
  )
}

export default NotFound
