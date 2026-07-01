import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useUserAppointments } from '../../hooks/useAppointments'
import Spinner        from '../../components/ui/Spinner'
import EmptyState     from '../../components/ui/EmptyState'
import AppointmentCard from '../../components/appointments/AppointmentCard'
import styles from '../dashboard/DashboardPages.module.css'

const TABS = [
  { key: '',          label: 'Todas' },
  { key: 'pending',   label: 'Pendientes' },
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'completed', label: 'Historial' },
]

export default function MyAppointmentsPage() {
  const [tab, setTab] = useState('')
  const { appointments, loading, actionLoading, cancel } = useUserAppointments({ status: tab })

  if (loading) return <Spinner fullPage size="lg" />

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'var(--space-6)' }}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Mis Citas</h1>
          <p className={styles.pageSubtitle}>Historial y estado de tus reservaciones</p>
        </div>
      </div>

      <div className={styles.filters}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`${styles.filterBtn} ${tab === t.key ? styles.active : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {appointments.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Sin citas" description="Aún no tienes citas registradas." />
      ) : (
        appointments.map((appt, i) => (
          <AppointmentCard
            key={appt.id}
            appt={appt}
            mode="client"
            onCancel={cancel}
            loading={actionLoading}
            index={i}
          />
        ))
      )}
    </div>
  )
}
