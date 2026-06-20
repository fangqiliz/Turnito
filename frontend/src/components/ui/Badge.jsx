import styles from './Badge.module.css'

const VARIANT_MAP = {
  pending: { label: 'Pendiente', variant: 'warning' },
  confirmed: { label: 'Confirmada', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'danger' },
  completed: { label: 'Completada', variant: 'info' },
  no_show: { label: 'No Asistió', variant: 'danger' },
  active: { label: 'Activo', variant: 'success' },
  inactive: { label: 'Inactivo', variant: 'muted' },
  owner: { label: 'Propietario', variant: 'accent' },
  admin: { label: 'Admin', variant: 'accent' },
  manager: { label: 'Gerente', variant: 'info' },
  staff: { label: 'Staff', variant: 'muted' },
}

export default function Badge({ status, variant, label, size = 'sm', className = '' }) {
  const mapped = status ? VARIANT_MAP[status] : null
  const displayLabel = label || mapped?.label || status
  const displayVariant = variant || mapped?.variant || 'muted'

  return (
    <span className={`${styles.badge} ${styles[displayVariant]} ${styles[size]} ${className}`}>
      <span className={styles.dot} />
      {displayLabel}
    </span>
  )
}
