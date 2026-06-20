import { useState, useEffect, useCallback } from 'react'
import { CalendarDays, Check, X, AlertTriangle, Eye } from 'lucide-react'
import { useBusiness } from '../../context/BusinessContext'
import api from '../../config/api'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import styles from './DashboardPages.module.css'

const STATUS_FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'completed', label: 'Completadas' },
  { key: 'cancelled', label: 'Canceladas' },
]

export default function AppointmentsPage() {
  const { activeBusiness } = useBusiness()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [selectedAppt, setSelectedAppt] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchAppointments = useCallback(async () => {
    if (!activeBusiness) return
    setLoading(true)
    try {
      let url = `/appointments/business/${activeBusiness.id}?limit=50`
      if (filter !== 'all') url += `&status=${filter}`
      if (dateFilter) url += `&date=${dateFilter}`
      const res = await api.get(url)
      if (res.success) {
        setAppointments(res.data.appointments || res.data || [])
      }
    } catch (err) {
      toast.error('Error al cargar citas')
    } finally {
      setLoading(false)
    }
  }, [activeBusiness, filter, dateFilter])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  const updateStatus = async (id, status) => {
    setActionLoading(true)
    try {
      await api.put(`/appointments/${id}/status?businessId=${activeBusiness.id}`, { status })
      toast.success(`Cita ${status === 'confirmed' ? 'confirmada' : status === 'completed' ? 'completada' : status === 'cancelled' ? 'cancelada' : 'actualizada'}`)
      setSelectedAppt(null)
      fetchAppointments()
    } catch (err) {
      toast.error(err.message || 'Error al actualizar')
    } finally {
      setActionLoading(false)
    }
  }

  if (!activeBusiness) return <EmptyState title="Selecciona un negocio" />
  if (loading) return <Spinner fullPage size="lg" />

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Agenda de Citas</h1>
          <p className={styles.pageSubtitle}>Gestiona todas las citas de tu negocio</p>
        </div>
      </div>

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
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className={styles.filterBtn}
          style={{ cursor: 'pointer' }}
        />
      </div>

      {appointments.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Sin citas" description="No hay citas con los filtros seleccionados." />
      ) : (
        appointments.map((appt, i) => (
          <div key={appt.id} className={styles.appointmentItem} style={{ animationDelay: `${i * 50}ms` }}>
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
              <div className={styles.appointmentService}>{appt.client_email}</div>
            </div>
            <Badge status={appt.status} />
            <div style={{ display: 'flex', gap: '8px' }}>
              {appt.status === 'pending' && (
                <>
                  <Button size="sm" icon={Check} onClick={() => updateStatus(appt.id, 'confirmed')} loading={actionLoading}>
                    Confirmar
                  </Button>
                  <Button size="sm" variant="danger" icon={X} onClick={() => updateStatus(appt.id, 'cancelled')} loading={actionLoading}>
                    Cancelar
                  </Button>
                </>
              )}
              {appt.status === 'confirmed' && (
                <>
                  <Button size="sm" icon={Check} onClick={() => updateStatus(appt.id, 'completed')} loading={actionLoading}>
                    Completar
                  </Button>
                  <Button size="sm" variant="secondary" icon={AlertTriangle} onClick={() => updateStatus(appt.id, 'no_show')} loading={actionLoading}>
                    No Asistió
                  </Button>
                </>
              )}
              <Button size="sm" variant="ghost" icon={Eye} iconOnly onClick={() => setSelectedAppt(appt)} />
            </div>
          </div>
        ))
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!selectedAppt} onClose={() => setSelectedAppt(null)} title="Detalle de Cita">
        {selectedAppt && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div><strong>Cliente:</strong> {selectedAppt.client_name}</div>
            <div><strong>Email:</strong> {selectedAppt.client_email}</div>
            <div><strong>Teléfono:</strong> {selectedAppt.client_phone || '—'}</div>
            <div><strong>Inicio:</strong> {format(new Date(selectedAppt.start_time), 'PPpp', { locale: es })}</div>
            <div><strong>Fin:</strong> {format(new Date(selectedAppt.end_time), 'PPpp', { locale: es })}</div>
            <div><strong>Estado:</strong> <Badge status={selectedAppt.status} /></div>
            <div><strong>Notas:</strong> {selectedAppt.notes || 'Sin notas'}</div>
          </div>
        )}
      </Modal>
    </div>
  )
}
