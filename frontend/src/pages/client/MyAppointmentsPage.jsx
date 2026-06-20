import { useState, useEffect, useCallback } from 'react'
import { CalendarDays, X } from 'lucide-react'
import api from '../../config/api'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import styles from '../dashboard/DashboardPages.module.css'

const TABS = [
  { key: '', label: 'Todas' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'completed', label: 'Historial' },
]

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('')

  const fetchMine = useCallback(async () => {
    setLoading(true)
    try {
      let url = '/appointments/user?limit=50'
      if (tab) url += `&status=${tab}`
      const res = await api.get(url)
      if (res.success) setAppointments(res.data.appointments || res.data || [])
    } catch { toast.error('Error al cargar citas') }
    finally { setLoading(false) }
  }, [tab])

  useEffect(() => { fetchMine() }, [fetchMine])

  const cancelAppointment = async (appt) => {
    if (!confirm('¿Cancelar esta cita?')) return
    try {
      await api.delete(`/appointments/${appt.id}?businessId=${appt.business_id}`)
      toast.success('Cita cancelada')
      fetchMine()
    } catch (err) { toast.error(err.message || 'Error al cancelar') }
  }

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
          <button key={t.key} className={`${styles.filterBtn} ${tab === t.key ? styles.active : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {appointments.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Sin citas" description="Aún no tienes citas registradas." />
      ) : (
        appointments.map((appt, i) => (
          <div key={appt.id} className={styles.appointmentItem} style={{ animationDelay: `${i * 50}ms` }}>
            <div className={styles.appointmentTime}>
              <div className={styles.appointmentTimeValue}>
                {format(new Date(appt.start_time), 'HH:mm')}
              </div>
              <div className={styles.appointmentTimeLabel}>
                {format(new Date(appt.start_time), 'dd MMM yyyy', { locale: es })}
              </div>
            </div>
            <div className={styles.appointmentInfo}>
              <div className={styles.appointmentClient}>{appt.client_name}</div>
              <div className={styles.appointmentService}>{appt.notes || 'Sin notas'}</div>
            </div>
            <Badge status={appt.status} />
            {(appt.status === 'pending' || appt.status === 'confirmed') && (
              <Button size="sm" variant="danger" icon={X} onClick={() => cancelAppointment(appt)}>
                Cancelar
              </Button>
            )}
          </div>
        ))
      )}
    </div>
  )
}
