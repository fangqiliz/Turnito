import { useState, useEffect } from 'react'
import { CalendarDays, Users, Clock, TrendingUp } from 'lucide-react'
import { useBusiness } from '../../context/BusinessContext'
import api from '../../config/api'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import styles from './DashboardPages.module.css'

export default function OverviewPage() {
  const { activeBusiness } = useBusiness()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ today: 0, pending: 0, confirmed: 0, completed: 0 })

  useEffect(() => {
    if (!activeBusiness) return
    const fetchData = async () => {
      setLoading(true)
      try {
        const today = new Date().toISOString().split('T')[0]
        const res = await api.get(`/appointments/business/${activeBusiness.id}?date=${today}&limit=10`)
        if (res.success) {
          const appts = res.data.appointments || res.data || []
          setAppointments(appts.slice(0, 5))
          setStats({
            today: appts.length,
            pending: appts.filter(a => a.status === 'pending').length,
            confirmed: appts.filter(a => a.status === 'confirmed').length,
            completed: appts.filter(a => a.status === 'completed').length,
          })
        }
      } catch (err) {
        console.error('Error cargando datos:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [activeBusiness])

  if (!activeBusiness) {
    return (
      <EmptyState
        title="Sin negocio seleccionado"
        description="Crea o selecciona un negocio para comenzar a gestionar tus citas."
      />
    )
  }

  if (loading) return <Spinner fullPage size="lg" />

  const metrics = [
    { icon: CalendarDays, label: 'Citas Hoy', value: stats.today, color: 'var(--color-accent)', bg: 'var(--color-accent-subtle)' },
    { icon: Clock, label: 'Pendientes', value: stats.pending, color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
    { icon: TrendingUp, label: 'Confirmadas', value: stats.confirmed, color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
    { icon: Users, label: 'Completadas', value: stats.completed, color: 'var(--color-info)', bg: 'var(--color-info-bg)' },
  ]

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Panel Principal</h1>
          <p className={styles.pageSubtitle}>{activeBusiness.name} — Resumen del día</p>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        {metrics.map((m, i) => (
          <div key={m.label} className={styles.metricCard} style={{ animationDelay: `${i * 80}ms` }}>
            <div className={styles.metricIcon} style={{ background: m.bg, color: m.color }}>
              <m.icon size={20} />
            </div>
            <div className={styles.metricValue}>{m.value}</div>
            <div className={styles.metricLabel}>{m.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Próximas Citas</h3>
        {appointments.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Sin citas hoy"
            description="No tienes citas programadas para hoy."
          />
        ) : (
          appointments.map((appt) => (
            <div key={appt.id} className={styles.appointmentItem}>
              <div className={styles.appointmentTime}>
                <div className={styles.appointmentTimeValue}>
                  {format(new Date(appt.start_time), 'HH:mm')}
                </div>
                <div className={styles.appointmentTimeLabel}>
                  {format(new Date(appt.start_time), 'a', { locale: es })}
                </div>
              </div>
              <div className={styles.appointmentInfo}>
                <div className={styles.appointmentClient}>{appt.client_name}</div>
                <div className={styles.appointmentService}>{appt.notes || 'Sin notas'}</div>
              </div>
              <Badge status={appt.status} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
