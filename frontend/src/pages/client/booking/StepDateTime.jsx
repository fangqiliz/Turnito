import Input from '../../../components/ui/Input'
import styles from '../BookingPage.module.css'

export default function StepDateTime({ date, time, onDateChange, onTimeChange }) {
  return (
    <div>
      <h3 className={styles.stepTitle}>Selecciona fecha y hora</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', maxWidth: '400px' }}>
        <Input
          label="Fecha"
          name="date"
          type="date"
          value={date}
          onChange={e => onDateChange(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          required
        />
        <Input
          label="Hora"
          name="time"
          type="time"
          value={time}
          onChange={e => onTimeChange(e.target.value)}
          required
        />
      </div>
    </div>
  )
}
