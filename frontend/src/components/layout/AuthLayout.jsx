import { Outlet } from 'react-router-dom'
import LogoTurnito from '../../assets/LogoTurnito.png'
import IsotipoTurnito from '../../assets/IsotipoTurnito.png'
import styles from './AuthLayout.module.css'

export default function AuthLayout() {
  return (
    <div className={styles.layout}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.brandingSection}>
            <div className={styles.isotipoContainer}>
              <img src={IsotipoTurnito} alt="Isotipo Turnito" className={styles.isotipoImage} />
            </div>
            <div className={styles.logoContainer}>
              <h1 className={styles.logoText}>Turnito</h1>
              <p className={styles.slogan}>Tu turno, a un toque.</p>
            </div>
          </div>

          <p className={styles.valueProposition}>
            La plataforma inteligente de gestión de citas para tu negocio
          </p>

          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureDot} />
              <span>Agenda centralizada para todo tu equipo</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureDot} />
              <span>Reservas online para tus clientes</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureDot} />
              <span>Control total de horarios y servicios</span>
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
