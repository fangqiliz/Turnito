import { Eye, Pencil, Trash2, DollarSign, Clock, Scissors } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import styles from '../DashboardPages.module.css'

export default function ServicesList({ services, isAdmin, onView, onEdit, onDelete, onCreateFirst }) {
  if (services.length === 0) {
    return (
      <EmptyState
        icon={Scissors}
        title="Sin servicios"
        description={
          isAdmin
            ? 'Agrega tu primer servicio para que los clientes puedan reservar.'
            : 'Este negocio aún no tiene servicios registrados.'
        }
        actionLabel={isAdmin ? 'Agregar Servicio' : undefined}
        onAction={isAdmin ? onCreateFirst : undefined}
      />
    )
  }

  return (
    <div className={styles.dataGrid}>
      {services.map((svc, i) => (
        <div
          key={svc.id}
          className={styles.itemCard}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className={styles.itemHeader}>
            <div className={styles.itemTitle}>{svc.name}</div>
            <Badge status={svc.is_active ? 'active' : 'inactive'} />
          </div>

          {svc.description && (
            <p className={styles.itemMeta} style={{ marginBottom: 'var(--space-3)', display: 'block' }}>
              {svc.description}
            </p>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
            <div className={styles.itemMeta}>
              <DollarSign size={14} />
              RD${Number(svc.price).toFixed(2)}
            </div>
            <div className={styles.itemMeta}>
              <Clock size={14} />
              {svc.duration_minutes} min
            </div>
          </div>

          <div className={styles.itemActions}>
            <Button size="sm" variant="ghost" icon={Eye} onClick={() => onView(svc)}>
              Ver
            </Button>
            {isAdmin && (
              <>
                <Button size="sm" variant="ghost" icon={Pencil} onClick={() => onEdit(svc)}>
                  Editar
                </Button>
                <Button size="sm" variant="danger" icon={Trash2} onClick={() => onDelete(svc)}>
                  Eliminar
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
