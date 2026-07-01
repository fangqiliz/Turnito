import { useState, useEffect, useCallback } from 'react'
import { CalendarDays, Clock, User, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useBusiness } from '../../context/BusinessContext'
import api from '../../config/api'
import appointmentsService from '../../services/appointments.service'
import Spinner    from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import AppointmentCard from '../../components/appointments/AppointmentCard'
import toast from 'react-hot-toast'
import { format, isToday, isFuture } from 'date-fns'
import { es } from 'date-fns/locale'
import styles from '../dashboard/DashboardPages.module.css'

const STATUS_LABELS = {
  confirmed: 'confirmada',
  completed: 'completada',
  cancelled: 'cancelada',
  no_show:   'marcada como no asistió',
}

export default function EmployeeDashboard() {
  const { profile }      = useAuth()
  const { employeeRoles } = useBusiness()

  const myRole = employeeRoles.find(
    r => (r.role === 'staff' || r.role === 'manager') && r.isActive
  )

  const [todayAppts,    setTodayAppts]    = useState([])
  const [upcomingAppts, setUpcomingAppts] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    if (!myRole) { setLoading(false); return }
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const [todayRes, upcomingRes] = await Promise.all([
        api.get(
          `/appointments/business/${myRole.business.id}` +
          `?employee_id=${myRole.employeeId}&date=${today}&limit=20`
        ),
        api.get(
          `/appointments/business/${myRole.business.id}` +
          `?employee_id=${myRole.employeeId}&limit=20`
        ),
      ])

      const extractList = res => {
        if (!res.success) return []
        const list = res.data?.data ?? res.data?.appointments ?? res.data ?? []
        return Array.isArray(list) ? list : []
      }

      const todayList  = extractList(todayRes)
      const allList    = extractList(upcomingRes)
      const futureList = allList.filter(
        a => isFuture(new Date(a.start_time)) && !isToday(new Date(a.start_time))
      )

      setTodayAppts(todayList)
      setUpcomingAppts(futureList.slice(0, 5))
    } catch (err) {
      console.error('[EmployeeDashboard]', err)
    } finally {
      setLoading(false)
    }
  }, [myRole?.employeeId, myRole?.business?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const handleStatusChange = async (appt, newStatus) => {
    setActionLoading(true)
    try {
      await appointmentsService.updateStatus(appt.id, myRole.business.id, newStatus)
      toast.success(`Cita ${STATUS_LABELS[newStatus] ?? 'actualizada'}`)
      load()
    } catch (err) {
      toast.error(err.message || 'Error al actualizar')
    } finally {
      setActionLoading(false)
    }
  }

  if (!myRole) {
    return (
      <EmptyState
        icon={User}
        title="Sin negocio asociado"
        description="No tienes un rol activo en ningún negocio."
      />
    )
  }

  if (loading) return <Spinner fullPage size="lg" />

  const stats = [
    { icon: CalendarDays, label: 'Citas hoy',      value: todayAppts.length,                                       color: 'var(--color-accent)',  bg: 'var(--color-accent-subtle)' },
    { icon: Clock,        label: 'Próximas',        value: upcomingAppts.length,                                    color: 'var(--color-info)',    bg: 'var(--color-info-bg)'       },
    { icon: CheckCircle2, label: 'Completadas hoy', value: todayAppts.filter(a => a.status === 'completed').length, color: 'var(--color-success)', bg: 'var(--color-success-bg)'   },
  ]

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            Hola, {profile?.full_name?.split(' ')[0] ?? 'equipo'} 👋
          </h1>
          <p className={styles.pageSubtitle}>
            {myRole.business.name} — {myRole.role === 'manager' ? 'Gerente' : 'Staff'}
          </p>
        </div>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
          {format(new Date(), "EEEE dd 'de' MMMM", { locale: es })}
        </div>
      </div>

      <div className={styles.metricsGrid}>
        {stats.map((s, i) => (
          <div key={s.label} className={styles.metricCard} style={{ animationDelay: `${i * 70}ms` }}>
            <div className={styles.metricIcon} style={{ background: s.bg, color: s.color }}>
              <s.icon size={20} />
            </div>
            <div className={styles.metricValue}>{s.value}</div>
            <div className={styles.metricLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Agenda de hoy</h3>
        {todayAppts.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Sin citas hoy"
            description="No tienes citas programadas para hoy. ¡Disfruta el día!"
          />
        ) : (
          todayAppts.map((appt, i) => (
            <AppointmentCard
              key={appt.id}
              appt={appt}
              mode="employee"
              onStatusChange={handleStatusChange}
              loading={actionLoading}
              index={i}
            />
          ))
        )}
      </div>

      {upcomingAppts.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Próximas citas</h3>
          {upcomingAppts.map((appt, i) => (
            <AppointmentCard
              key={appt.id}
              appt={appt}
              mode="employee"
              onStatusChange={handleStatusChange}
              loading={actionLoading}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  )
}
