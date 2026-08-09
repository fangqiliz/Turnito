import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays, Users, Scissors, Clock,
  ArrowRight, CheckCircle2, X, AlertCircle,
  FileSpreadsheet, CalendarRange,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useBusiness } from '../../context/BusinessContext'
import api from '../../config/api'
import appointmentsService from '../../services/appointments.service'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { format, isToday, isThisWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import styles from '../dashboard/DashboardPages.module.css'

/**
 * ManagerDashboard
 * Vista simplificada para gerentes: solo gestión de citas y visualización de datos
 * NO pueden crear/editar/eliminar servicios, empleados, o horarios
 */
export default function ManagerDashboard() {
  const navigate = useNavigate()
  const { activeBusiness } = useBusiness()

  const [appointments, setAppointments] = useState([])
  const [employees, setEmployees]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(null)

  useEffect(() => {
    if (!activeBusiness) return

    const load = async () => {
      setLoading(true)
      try {
        const [apptList, empRes] = await Promise.all([
          appointmentsService.getAllByBusiness(activeBusiness.id),
          api.get(`/employees/business/${activeBusiness.id}`),
        ])

        setAppointments(Array.isArray(apptList) ? apptList : [])
        if (empRes.success) setEmployees(Array.isArray(empRes.data) ? empRes.data : [])
      } catch (err) {
        console.error('[ManagerDashboard] Error cargando datos:', err)
        toast.error('No se pudieron cargar los datos del panel.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [activeBusiness])

  // ── Métricas derivadas ──────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const todayAppts = appointments.filter((a) => a.start_time && isToday(new Date(a.start_time)))
    const weekAppts  = appointments.filter((a) => a.start_time && isThisWeek(new Date(a.start_time), { weekStartsOn: 1 }))

    return {
      today:     todayAppts.length,
      week:      weekAppts.length,
      total:     appointments.length,
      pending:   appointments.filter((a) => a.status === 'pending').length,
      confirmed: appointments.filter((a) => a.status === 'confirmed').length,
      completed: appointments.filter((a) => a.status === 'completed').length,
      cancelled: appointments.filter((a) => a.status === 'cancelled').length,
      no_show:   appointments.filter((a) => a.status === 'no_show').length,
      todayAppts: todayAppts.sort((a, b) => new Date(a.start_time) - new Date(b.start_time)),
    }
  }, [appointments])

  const activeEmployees = employees.filter((e) => e.is_active).length

  // ── Cambiar estado de cita ──────────────────────────────────────────────────
  const handleStatusChange = async (appointmentId, newStatus) => {
    setUpdatingStatus(appointmentId)
    try {
      await appointmentsService.updateStatus(appointmentId, activeBusiness.id, newStatus)
      
      setAppointments(prev => prev.map(a =>
        a.id === appointmentId ? { ...a, status: newStatus } : a
      ))
      
      const statusLabel = {
        pending: 'Pendiente',
        confirmed: 'Confirmada',
        completed: 'Completada',
        cancelled: 'Cancelada',
        no_show: 'No se presentó',
      }[newStatus] || newStatus
      
      toast.success(`Cita marcada como ${statusLabel}`)
    } catch (err) {
      console.error('[ManagerDashboard] Error actualizando estado:', err)
      toast.error('Error al actualizar el estado de la cita.')
    } finally {
      setUpdatingStatus(null)
    }
  }

  if (!activeBusiness) {
    return (
      <EmptyState
        title="Sin negocio seleccionado"
        description="Selecciona un negocio para comenzar."
      />
    )
  }

  if (loading) return <Spinner fullPage size="lg" />

  const stats = [
    { icon: CalendarDays, label: 'Citas hoy',        value: metrics.today,     color: 'var(--color-accent)',  bg: 'var(--color-accent-subtle)' },
    { icon: CalendarRange, label: 'Esta semana',     value: metrics.week,      color: 'var(--color-info)',    bg: 'var(--color-info-bg)' },
    { icon: Clock,        label: 'Pendientes',       value: metrics.pending,   color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
    { icon: CheckCircle2, label: 'Confirmadas',      value: metrics.confirmed, color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
    { icon: CalendarDays, label: 'Total citas',      value: metrics.total,     color: 'var(--color-accent)',  bg: 'var(--color-accent-subtle)' },
    { icon: AlertCircle,  label: 'No se presentó',   value: metrics.no_show,   color: 'var(--color-danger)',  bg: 'var(--color-danger-bg)' },
    { icon: Users,        label: 'Empleados activos', value: activeEmployees,  color: 'var(--color-accent)',  bg: 'var(--color-accent-subtle)' },
  ]

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Gestión de Citas</h1>
          <p className={styles.pageSubtitle}>{activeBusiness.name} — Panel del Gerente</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className={styles.metricsGrid}>
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={styles.metricCard}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={styles.metricIcon} style={{ background: s.bg, color: s.color }}>
              <s.icon size={20} />
            </div>
            <div className={styles.metricValue}>{s.value}</div>
            <div className={styles.metricLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.overviewGrid}>
        {/* Today's appointments */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Citas de hoy</h3>
          {metrics.todayAppts.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Sin citas hoy"
              description="No hay citas programadas para hoy."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {metrics.todayAppts.map((appt) => (
                <div
                  key={appt.id}
                  style={{
                    padding: 'var(--space-3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 'var(--space-3)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                      <strong style={{ color: 'var(--color-text-primary)' }}>
                        {format(new Date(appt.start_time), 'HH:mm', { locale: es })}
                      </strong>
                      <Badge variant={appt.status === 'confirmed' ? 'success' : 'warning'}>
                        {appt.status}
                      </Badge>
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                      <div><strong>{appt.client_name}</strong></div>
                      <div>{appt.services?.name}</div>
                      <div>{appt.employees?.full_name}</div>
                    </div>
                  </div>

                  {/* Status change buttons */}
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {appt.status === 'pending' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleStatusChange(appt.id, 'confirmed')}
                          disabled={updatingStatus === appt.id}
                          loading={updatingStatus === appt.id}
                        >
                          Confirmar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleStatusChange(appt.id, 'cancelled')}
                          disabled={updatingStatus === appt.id}
                          loading={updatingStatus === appt.id}
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                    {appt.status === 'confirmed' && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleStatusChange(appt.id, 'completed')}
                          disabled={updatingStatus === appt.id}
                          loading={updatingStatus === appt.id}
                        >
                          Completar
                        </Button>
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => handleStatusChange(appt.id, 'no_show')}
                          disabled={updatingStatus === appt.id}
                          loading={updatingStatus === appt.id}
                        >
                          No se presentó
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending appointments */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Citas Pendientes</h3>
          {metrics.pending === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Sin citas pendientes"
              description="Todas las citas están confirmadas."
            />
          ) : (
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              <p>Tienes <strong style={{ color: 'var(--color-warning)' }}>{metrics.pending}</strong> citas pendientes de confirmación.</p>
              <Button
                variant="primary"
                size="sm"
                style={{ marginTop: 'var(--space-3)' }}
                onClick={() => navigate('/manager/appointments')}
              >
                Ver todas las citas
                <ArrowRight size={14} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
