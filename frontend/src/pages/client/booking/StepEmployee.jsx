import { User } from 'lucide-react'
import styles from '../BookingPage.module.css'

export default function StepEmployee({ employees, selected, onSelect }) {
  return (
    <div>
      <h3 className={styles.stepTitle}>Selecciona un profesional</h3>
      <div className={styles.optionsGrid}>
        {employees.map(emp => (
          <div
            key={emp.id}
            className={`${styles.optionCard} ${selected?.id === emp.id ? styles.selected : ''}`}
            onClick={() => onSelect(emp)}
          >
            <User size={20} className={styles.optionIcon} />
            <div className={styles.optionName}>{emp.full_name}</div>
            <div className={styles.optionMeta}>{emp.specialty || 'Profesional'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
