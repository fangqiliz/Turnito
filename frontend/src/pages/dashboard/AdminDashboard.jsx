import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  CalendarDays, Users, Scissors, Clock,
  TrendingUp, Building2, ArrowRight, MapPin, Phone,
} from 'lucide-react'
import { useBusiness } from '../../context/BusinessContext'
import api from '../../config/api'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import styles from './DashboardPages.module.css'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { activeBusiness } = useBusiness()

  const [todayAppts, setTodayAppts] = useState([])
  const [services, setServices]     = useState([])
  const [employees, setEmployees]   = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!activeBusiness) return

    const load = async () => {
      setLoading(true)
      try {
        const today = new Date().toISOString().split('T')[0]
        const [apptRes, svcRes, empRes] = await Promise.all([
          api.get(`/appointments/business/${activeBusiness.id}?date=${today}&limit=20`),
          api.get(`/services/business/${activeBusiness.id}`),
          api.get(`/employees/business/${activeBusiness.id}`),
        ])

        // /appointments/business returns { data: apptArray, total, page, limit }
        if (apptRes.success) {
          const list = apptRes.data?.data ?? apptRes.data?.appointments ?? []
          setTodayAppts(Array.isArray(list) ? list : [])
        }
        if (svcRes.success) setServices(Array.isArray(svcRes.data) ? svcRes.data : [])
        if (empRes.success) setEmployees(Array.isArray(empRes.data) ? empRes.data : [])
      } catch (err) {
        console.error('[AdminDashboard] Error cargando datos:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [activeBusiness])

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

  const pending   = todayAppts.filter((a) => a.status === 'pending').length
  const confirmed = todayAppts.filter((a) => a.status === 'confirmed').length
  const activeServices  = services.filter((s) => s.is_active).length
  const activeEmployees = employees.filter((e) => e.is_active).length

  const stats = [
    {
      icon: CalendarDays,
      label: 'Citas Hoy',
      value: todayAppts.length,
      color: 'var(--color-accent)',
      bg: 'var(--color-accent-subtle)',
    },
    {
      icon: Clock,
      label: 'Pendientes',
      value: pending,
      color: 'var(--color-warning)',
      bg: 'var(--color-warning-bg)',
    },
    {
      icon: Scissors,
      label: 'Servicios activos',
      value: activeServices,
      color: 'var(--color-success)',
      bg: 'var(--color-success-bg)',
    },
    {
      icon: Users,
      label: 'Empleados activos',
      value: activeEmployees,
      color: 'var(--color-info)',
      bg: 'var(--color-info-bg)',
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Panel Principal</h1>
          <p className={styles.pageSubtitle}>{activeBusiness.name} — Resumen del día</p>
        </div>
        <Link to="/dashboard/appointments" className={adminStyles.ctaLink}>
          Ver todas las citas
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Stat cards */}
      <div className={styles.metricsGrid}>
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
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-6)', alignItems: 'start' }}>

        {/* Today's appointments */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Agenda de hoy</h3>
          {todayAppts.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Sin citas hoy"
              description="No hay citas programadas para hoy."
            />
          ) : (
            todayAppts.slice(0, 8).map((appt, i) => (
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
                    {appt.employees?.full_name ?? '—'}
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

        {/* Business summary */}
        <div style={{ minWidth: 260 }}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Building2 size={16} style={{ display: 'inline', marginRight: 6 }} />
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Empleados totales</span>
                <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>{employees.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Empleados activos</span>
                <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-success)' }}>{activeEmployees}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Servicios totales</span>
                <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>{services.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Servicios activos</span>
                <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-success)' }}>{activeServices}</span>
              </div>
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

// Inline micro-styles para el link CTA (no justifican un CSS module separado)
const adminStyles = {
  ctaLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-accent-light)',
    fontWeight: 'var(--font-weight-medium)',
  },
}
