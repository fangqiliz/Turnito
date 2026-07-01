import Input from '../../../components/ui/Input'
import styles from '../BookingPage.module.css'

export default function StepClientData({ data, onChange }) {
  const set = field => e => onChange({ ...data, [field]: e.target.value })

  return (
    <div>
      <h3 className={styles.stepTitle}>Datos del cliente</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: '500px' }}>
        <Input label="Nombre"    name="client_name"  value={data.client_name}  onChange={set('client_name')}  required />
        <Input label="Email"     name="client_email" type="email" value={data.client_email} onChange={set('client_email')} required />
        <Input label="Teléfono" name="client_phone" value={data.client_phone} onChange={set('client_phone')} />
        <Input label="Notas"    name="notes"         value={data.notes}         onChange={set('notes')}         placeholder="Alguna preferencia o nota..." />
      </div>
    </div>
  )
}
