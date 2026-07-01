import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, CheckCircle2, PlusCircle, Clock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../config/api'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import styles from '../dashboard/DashboardPages.module.css'
import clientStyles from './ClientDashboard.module.css'

export default function ClientDashboard() {
  const { profile } = useAuth()

  const [upcoming, setUpcoming] = useState([])
  const [history, setHistory]   = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [upcomingRes, historyRes] = await Promise.all([
          api.get('/appointments/user?limit=5&status=pending'),
          api.get('/appointments/user?limit=5&status=completed'),
        ])

        const extractList = (res) => {
          if (!res.success) return []
          const list = res.data?.data ?? res.data?.appointments ?? res.data ?? []
          return Array.isArray(list) ? list : []
        }

        setUpcoming(extractList(upcomingRes))
        setHistory(extractList(historyRes))
      } catch (err) {
        console.error('[ClientDashboard]', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) return <Spinner fullPage size="lg" />

  const stats = [
    {
      icon: Clock,
      label: 'Citas próximas',
      value: upcoming.length,
      color: 'var(--color-accent)',
      bg: 'var(--color-accent-subtle)',
    },
    {
      icon: CheckCircle2,
      label: 'Historial',
      value: history.length,
      color: 'var(--color-success)',
      bg: 'var(--color-success-bg)',
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            Hola, {profile?.full_name?.split(' ')[0] ?? 'bienvenido'} 👋
          </h1>
          <p className={styles.pageSubtitle}>
            {format(new Date(), "EEEE dd 'de' MMMM", { locale: es })}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className={styles.metricsGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={styles.metricCard}
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className={styles.metricIcon} style={{ background: s.bg, color: s.color }}>
              <s.icon size={20} />
            </div>
            <div className={styles.metricValue}>{s.value}</div>
            <div className={styles.metricLabel}>{s.label}</div>
          </div>
        ))}

        {/* CTA card */}
        <Link to="/client/businesses" style={{ textDecoration: 'none' }}>
          <div className={`${styles.metricCard} ${clientStyles.bookCard}`}>
            <div className={styles.metricIcon} style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>
              <PlusCircle size={20} />
            </div>
            <div className={styles.metricValue} style={{ fontSize: 'var(--font-size-lg)' }}>
              Nueva cita
            </div>
            <div className={styles.metricLabel} style={{ color: 'var(--color-accent-light)' }}>
              Ver negocios →
            </div>
          </div>
        </Link>
      </div>

      {/* Upcoming appointments */}
      <div className={styles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Próximas citas</h3>
          <Link to="/client/appointments" className={clientStyles.viewAllLink}>
            Ver todas
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Sin citas próximas"
            description="Reserva un turno en cualquier negocio de Turnito."
          />
        ) : (
          upcoming.map((appt, i) => (
            <div
              key={appt.id}
              className={styles.appointmentItem}
              style={{ animationDelay: `${i * 50}ms` }}
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
                <div className={styles.appointmentClient}>
                  {appt.businesses?.name ?? appt.client_name}
                </div>
                <div className={styles.appointmentService}>
                  {appt.services?.name ?? 'Servicio'} · {appt.employees?.full_name ?? ''}
                </div>
              </div>
              <Badge status={appt.status} />
            </div>
          ))
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Historial reciente</h3>
          {history.map((appt, i) => (
            <div
              key={appt.id}
              className={styles.appointmentItem}
              style={{ animationDelay: `${i * 50}ms`, opacity: 0.8 }}
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
                <div className={styles.appointmentClient}>
                  {appt.businesses?.name ?? appt.client_name}
                </div>
                <div className={styles.appointmentService}>
                  {appt.services?.name ?? 'Servicio'}
                </div>
              </div>
              <Badge status={appt.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
