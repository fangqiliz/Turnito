import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  CalendarDays, Users, Scissors, Clock,
  Building2, ArrowRight, MapPin, Phone,
  FileSpreadsheet, DollarSign, CalendarRange, CheckCircle2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useBusiness } from '../../context/BusinessContext'
import api from '../../config/api'
import appointmentsService from '../../services/appointments.service'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { exportAppointmentsToXlsx } from '../../utils/exportAppointments'
import { format, isToday, isThisWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import styles from './DashboardPages.module.css'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { activeBusiness } = useBusiness()

  const [appointments, setAppointments] = useState([])
  const [services, setServices]         = useState([])
  const [employees, setEmployees]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [exporting, setExporting]       = useState(false)

  useEffect(() => {
    if (!activeBusiness) return

    const load = async () => {
      setLoading(true)
      try {
        const [apptList, svcRes, empRes] = await Promise.all([
          // Histórico completo (paginado) para métricas reales y exportación
          appointmentsService.getAllByBusiness(activeBusiness.id),
          api.get(`/services/business/${activeBusiness.id}`),
          api.get(`/employees/business/${activeBusiness.id}`),
        ])

        setAppointments(Array.isArray(apptList) ? apptList : [])
        if (svcRes.success) setServices(Array.isArray(svcRes.data) ? svcRes.data : [])
        if (empRes.success) setEmployees(Array.isArray(empRes.data) ? empRes.data : [])
      } catch (err) {
        console.error('[AdminDashboard] Error cargando datos:', err)
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
    const revenue = appointments.reduce((sum, a) => {
      if (a.status === 'confirmed' || a.status === 'completed') {
        return sum + Number(a.services?.price ?? 0)
      }
      return sum
    }, 0)

    return {
      today:     todayAppts.length,
      week:      weekAppts.length,
      total:     appointments.length,
      pending:   appointments.filter((a) => a.status === 'pending').length,
      confirmed: appointments.filter((a) => a.status === 'confirmed').length,
      completed: appointments.filter((a) => a.status === 'completed').length,
      cancelled: appointments.filter((a) => a.status === 'cancelled').length,
      no_show:   appointments.filter((a) => a.status === 'no_show').length,
      revenue,
      todayAppts: todayAppts.sort((a, b) => new Date(a.start_time) - new Date(b.start_time)),
    }
  }, [appointments])

  const activeServices  = services.filter((s) => s.is_active).length
  const activeEmployees = employees.filter((e) => e.is_active).length

  const currency = (n) =>
    `$${Number(n).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const handleExport = async () => {
    if (appointments.length === 0) {
      toast.error('No hay citas para exportar.')
      return
    }
    setExporting(true)
    try {
      await exportAppointmentsToXlsx({
        business: activeBusiness,
        appointments,
        stats: {
          total: metrics.total,
          pending: metrics.pending,
          confirmed: metrics.confirmed,
          completed: metrics.completed,
          cancelled: metrics.cancelled,
          no_show: metrics.no_show,
          revenue: metrics.revenue,
        },
      })
      toast.success('Reporte exportado correctamente.')
    } catch (err) {
      console.error('[AdminDashboard] Error exportando:', err)
      toast.error('Ocurrió un error al generar el archivo.')
    } finally {
      setExporting(false)
    }
  }

  if (!activeBusiness) {
    return (
      <EmptyState
        title="Sin negocio seleccionado"
        description="Crea o selecciona un negocio para comenzar."
        actionLabel="Crear Negocio"
        onAction={() => navigate('/dashboard/businesses/create')}
      />
    )
  }

  if (loading) return <Spinner fullPage size="lg" />

  const stats = [
    { icon: CalendarDays, label: 'Citas hoy',        value: metrics.today,     color: 'var(--color-accent)',  bg: 'var(--color-accent-subtle)' },
    { icon: CalendarRange, label: 'Esta semana',     value: metrics.week,      color: 'var(--color-info)',    bg: 'var(--color-info-bg)' },
    { icon: Clock,        label: 'Pendientes',       value: metrics.pending,   color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
    { icon: CheckCircle2, label: 'Completadas',      value: metrics.completed, color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
    { icon: CalendarDays, label: 'Total citas',      value: metrics.total,     color: 'var(--color-accent)',  bg: 'var(--color-accent-subtle)' },
    { icon: DollarSign,   label: 'Ingresos est.',    value: currency(metrics.revenue), color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
    { icon: Scissors,     label: 'Servicios activos', value: activeServices,   color: 'var(--color-info)',    bg: 'var(--color-info-bg)' },
    { icon: Users,        label: 'Empleados activos', value: activeEmployees,  color: 'var(--color-accent)',  bg: 'var(--color-accent-subtle)' },
  ]

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Panel Principal</h1>
          <p className={styles.pageSubtitle}>{activeBusiness.name} — Resumen general</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={FileSpreadsheet}
            loading={exporting}
            onClick={handleExport}
          >
            Exportar a Excel
          </Button>
          <Link to="/dashboard/appointments" style={ctaLinkStyle}>
            Ver todas las citas
            <ArrowRight size={14} />
          </Link>
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
          <h3 className={styles.sectionTitle}>Agenda de hoy</h3>
          {metrics.todayAppts.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Sin citas hoy"
              description="No hay citas programadas para hoy."
            />
          ) : (
            metrics.todayAppts.slice(0, 8).map((appt, i) => (
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
                    {appt.employees?.full_name ?? 'Sin asignar'}
                  </div>
                </div>
                <div className={styles.appointmentInfo}>
                  <div className={styles.appointmentClient}>{appt.client_name}</div>
                  <div className={styles.appointmentService}>
                    {appt.services?.name ?? 'Servicio'}
                  </div>
                </div>
                <Badge status={appt.status} />
              </div>
            ))
          )}
        </div>

        {/* Side column */}
        <div>
          {/* Business summary */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Building2 size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
              Negocio
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
              <div>
                <div style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>Nombre</div>
                <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                  {activeBusiness.name}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>Slug</div>
                <div style={{ color: 'var(--color-accent-light)' }}>/{activeBusiness.slug}</div>
              </div>
              {activeBusiness.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>
                  <Phone size={14} />
                  {activeBusiness.phone}
                </div>
              )}
              {activeBusiness.address && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>
                  <MapPin size={14} />
                  {activeBusiness.address}
                </div>
              )}
            </div>
            <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
              <Link to="/dashboard/settings" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-accent-light)' }}>
                Editar configuración →
              </Link>
            </div>
          </div>

          {/* Quick counters */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Equipo & Servicios</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <CounterRow label="Empleados totales" value={employees.length} />
              <CounterRow label="Empleados activos" value={activeEmployees} accent="var(--color-success)" />
              <CounterRow label="Servicios totales" value={services.length} />
              <CounterRow label="Servicios activos" value={activeServices} accent="var(--color-success)" />
            </div>
            <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <Link to="/dashboard/employees" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-accent-light)' }}>
                Gestionar empleados →
              </Link>
              <Link to="/dashboard/services" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-accent-light)' }}>
                Gestionar servicios →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CounterRow({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 'var(--font-weight-semibold)', color: accent ?? 'var(--color-text-primary)' }}>{value}</span>
    </div>
  )
}

const ctaLinkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: 'var(--font-size-sm)',
  color: 'var(--color-accent-light)',
  fontWeight: 'var(--font-weight-medium)',
}
