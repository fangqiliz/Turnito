import { Scissors } from 'lucide-react'
import styles from '../BookingPage.module.css'

export default function StepService({ services, selected, onSelect }) {
  return (
    <div>
      <h3 className={styles.stepTitle}>Selecciona un servicio</h3>
      <div className={styles.optionsGrid}>
        {services.map(svc => (
          <div
            key={svc.id}
            className={`${styles.optionCard} ${selected?.id === svc.id ? styles.selected : ''}`}
            onClick={() => onSelect(svc)}
          >
            <Scissors size={20} className={styles.optionIcon} />
            <div className={styles.optionName}>{svc.name}</div>
            <div className={styles.optionMeta}>RD${Number(svc.price).toFixed(2)} · {svc.duration_minutes} min</div>
          </div>
        ))}
      </div>
    </div>
  )
}
