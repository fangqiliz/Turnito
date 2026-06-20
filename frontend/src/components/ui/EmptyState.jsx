import { Inbox } from 'lucide-react'
import Button from './Button'
import styles from './EmptyState.module.css'

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Sin resultados',
  description = 'No se encontraron datos para mostrar.',
  actionLabel,
  onAction,
}) {
  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        <Icon size={48} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" style={{ marginTop: 'var(--space-4)' }}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
