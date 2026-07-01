import { Check, X, AlertTriangle, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import styles from '../../pages/dashboard/DashboardPages.module.css'

/**
 * Reusable appointment card used across admin, employee, and client views.
 *
 * mode="admin"    — Confirmar/Cancelar/Completar/No Asistió + eye button
 * mode="employee" — Same status actions, no eye button by default
 * mode="client"   — Only Cancelar for active appointments
 */
export default function AppointmentCard({
  appt,
  mode = 'admin',
  onStatusChange,
  onCancel,
  onView,
  loading = false,
  index,
}) {
  const isActive  = appt.status === 'pending' || appt.status === 'confirmed'
  const canManage = (mode === 'admin' || mode === 'employee') && isActive
  const canCancel = mode === 'client' && isActive

  const subtitle =
    mode === 'client'
      ? (appt.notes || 'Sin notas')
      : mode === 'employee'
      ? `${appt.services?.name ?? 'Servicio'} · ${appt.client_phone || appt.client_email || ''}`
      : appt.client_email

  return (
    <div
      className={styles.appointmentItem}
      style={index !== undefined ? { animationDelay: `${index * 50}ms` } : undefined}
    >
      <div className={styles.appointmentTime}>
        <div className={styles.appointmentTimeValue}>
          {format(new Date(appt.start_time), 'HH:mm')}
        </div>
        <div className={styles.appointmentTimeLabel}>
          {format(new Date(appt.start_time), 'dd MMM', { locale: es })}
        </div>
      </div>

      <div className={styles.appointmentInfo}>
        <div className={styles.appointmentClient}>{appt.client_name}</div>
        {subtitle && <div className={styles.appointmentService}>{subtitle}</div>}
      </div>

      <Badge status={appt.status} />

      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        {canManage && appt.status === 'pending' && (
          <>
            <Button size="sm" icon={Check} onClick={() => onStatusChange(appt, 'confirmed')} loading={loading}>
              Confirmar
            </Button>
            <Button size="sm" variant="danger" icon={X} onClick={() => onStatusChange(appt, 'cancelled')} loading={loading}>
              Cancelar
            </Button>
          </>
        )}
        {canManage && appt.status === 'confirmed' && (
          <>
            <Button size="sm" icon={Check} onClick={() => onStatusChange(appt, 'completed')} loading={loading}>
              Completar
            </Button>
            <Button size="sm" variant="secondary" icon={AlertTriangle} onClick={() => onStatusChange(appt, 'no_show')} loading={loading}>
              No Asistió
            </Button>
          </>
        )}
        {canCancel && (
          <Button size="sm" variant="danger" icon={X} onClick={() => onCancel(appt)} loading={loading}>
            Cancelar
          </Button>
        )}
        {onView && (
          <Button size="sm" variant="ghost" icon={Eye} iconOnly onClick={() => onView(appt)} />
        )}
      </div>
    </div>
  )
}
