import { Outlet } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import styles from './AuthLayout.module.css'

export default function AuthLayout() {
  return (
    <div className={styles.layout}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.logoArea}>
            <Calendar size={48} className={styles.logoIcon} />
            <h1 className={styles.logoText}>Turnito</h1>
          </div>
          <p className={styles.tagline}>
            La plataforma inteligente de gestión de citas para tu negocio
          </p>
          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureDot} />
              Agenda centralizada para todo tu equipo
            </div>
            <div className={styles.feature}>
              <span className={styles.featureDot} />
              Reservas online para tus clientes
            </div>
            <div className={styles.feature}>
              <span className={styles.featureDot} />
              Control total de horarios y servicios
            </div>
          </div>
        </div>
        <div className={styles.heroBg} />
      </div>

      <div className={styles.formSide}>
        <div className={styles.formContainer}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
