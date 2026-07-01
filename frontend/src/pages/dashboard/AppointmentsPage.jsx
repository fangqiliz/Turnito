import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useBusiness } from '../../context/BusinessContext'
import { useBusinessAppointments } from '../../hooks/useAppointments'
import Badge      from '../../components/ui/Badge'
import Modal      from '../../components/ui/Modal'
import Spinner    from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Calendar       from '../../components/appointments/Calendar'
import AppointmentCard from '../../components/appointments/AppointmentCard'
import { format } from 'date-fns'
import { es }    from 'date-fns/locale'
import styles from './DashboardPages.module.css'

const STATUS_FILTERS = [
  { key: 'all',       label: 'Todas' },
  { key: 'pending',   label: 'Pendientes' },
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'completed', label: 'Completadas' },
  { key: 'cancelled', label: 'Canceladas' },
]

export default function AppointmentsPage() {
  const { activeBusiness } = useBusiness()
  const [filter, setFilter]         = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [selectedAppt, setSelected] = useState(null)

  const { appointments, loading, actionLoading, updateStatus } = useBusinessAppointments(
    activeBusiness?.id,
    { status: filter, date: dateFilter }
  )

  if (!activeBusiness) return <EmptyState title="Selecciona un negocio" />
  if (loading)         return <Spinner fullPage size="lg" />

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Agenda de Citas</h1>
          <p className={styles.pageSubtitle}>Gestiona todas las citas de tu negocio</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 'var(--space-5)', alignItems: 'start' }}>
        {/* Calendar sidebar */}
        <Calendar
          appointments={appointments}
          selectedDate={dateFilter}
          onDateSelect={setDateFilter}
        />

        {/* List + filters */}
        <div>
          <div className={styles.filters}>
            {STATUS_FILTERS.map(f => (
              <button
                key={f.key}
                className={`${styles.filterBtn} ${filter === f.key ? styles.active : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {appointments.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Sin citas"
              description="No hay citas con los filtros seleccionados."
            />
          ) : (
            appointments.map((appt, i) => (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                mode="admin"
                onStatusChange={updateStatus}
                onView={setSelected}
                loading={actionLoading}
                index={i}
              />
            ))
          )}
        </div>
      </div>

      {/* Detail modal */}
      <Modal isOpen={!!selectedAppt} onClose={() => setSelected(null)} title="Detalle de Cita">
        {selectedAppt && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div><strong>Cliente:</strong>  {selectedAppt.client_name}</div>
            <div><strong>Email:</strong>    {selectedAppt.client_email}</div>
            <div><strong>Teléfono:</strong> {selectedAppt.client_phone || '—'}</div>
            <div><strong>Inicio:</strong>   {format(new Date(selectedAppt.start_time), 'PPpp', { locale: es })}</div>
            <div><strong>Fin:</strong>      {format(new Date(selectedAppt.end_time),   'PPpp', { locale: es })}</div>
            <div><strong>Estado:</strong>   <Badge status={selectedAppt.status} /></div>
            <div><strong>Notas:</strong>    {selectedAppt.notes || 'Sin notas'}</div>
          </div>
        )}
      </Modal>
    </div>
  )
}
