import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Clock } from 'lucide-react'
import { useBusiness } from '../../context/BusinessContext'
import api from '../../config/api'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import toast from 'react-hot-toast'
import styles from './DashboardPages.module.css'

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default function SchedulesPage() {
  const { activeBusiness } = useBusiness()
  const [schedules, setSchedules] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [form, setForm] = useState({ employee_id: '', day_of_week: 1, start_time: '09:00', end_time: '18:00' })

  const fetchData = useCallback(async () => {
    if (!activeBusiness) return
    setLoading(true)
    try {
      const [schedRes, empRes] = await Promise.all([
        api.get(`/schedules/business/${activeBusiness.id}`),
        api.get(`/employees/business/${activeBusiness.id}`),
      ])
      if (schedRes.success) setSchedules(schedRes.data || [])
      if (empRes.success) {
        const emps = empRes.data || []
        setEmployees(emps)
        if (emps.length > 0 && !selectedEmployee) setSelectedEmployee(emps[0].id)
      }
    } catch { toast.error('Error al cargar datos') }
    finally { setLoading(false) }
  }, [activeBusiness]) // eslint-disable-line

  useEffect(() => { fetchData() }, [fetchData])

  const filteredSchedules = selectedEmployee
    ? schedules.filter(s => s.employee_id === selectedEmployee)
    : schedules

  const getSchedulesByDay = () => {
    const byDay = Array.from({ length: 7 }, () => [])
    filteredSchedules.forEach(s => byDay[s.day_of_week].push(s))
    return byDay
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      await api.post('/schedules', { ...form, business_id: activeBusiness.id, day_of_week: parseInt(form.day_of_week) })
      toast.success('Horario creado')
      setShowModal(false)
      fetchData()
    } catch (err) { toast.error(err.message || 'Error') }
    finally { setFormLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este horario?')) return
    try {
      await api.delete(`/schedules/${id}?businessId=${activeBusiness.id}`)
      toast.success('Horario eliminado')
      fetchData()
    } catch (err) { toast.error(err.message || 'Error al eliminar') }
  }

  if (!activeBusiness) return <EmptyState title="Selecciona un negocio" />
  if (loading) return <Spinner fullPage size="lg" />

  const byDay = getSchedulesByDay()

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Horarios</h1>
          <p className={styles.pageSubtitle}>Horarios laborales del equipo</p>
        </div>
        <Button icon={Plus} onClick={() => { setForm({ employee_id: selectedEmployee || '', day_of_week: 1, start_time: '09:00', end_time: '18:00' }); setShowModal(true) }}>
          Nuevo Horario
        </Button>
      </div>

      {/* Employee filter */}
      <div className={styles.filters}>
        {employees.map(emp => (
          <button
            key={emp.id}
            className={`${styles.filterBtn} ${selectedEmployee === emp.id ? styles.active : ''}`}
            onClick={() => setSelectedEmployee(emp.id)}
          >
            {emp.full_name}
          </button>
        ))}
      </div>

      {filteredSchedules.length === 0 ? (
        <EmptyState icon={Clock} title="Sin horarios" description="Agrega horarios laborales para este empleado." />
      ) : (
        <div className={styles.scheduleGrid}>
          {DAYS_SHORT.map((day, i) => (
            <div key={i} className={styles.dayColumn}>
              <div className={styles.dayLabel}>{day}</div>
              {byDay[i].map(s => (
                <div key={s.id} className={styles.timeBlock} onClick={() => handleDelete(s.id)} title="Click para eliminar">
                  {s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo Horario"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button><Button loading={formLoading} onClick={handleSubmit}>Guardar</Button></>}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Empleado</label>
            <select value={form.employee_id} onChange={(e) => setForm(p => ({ ...p, employee_id: e.target.value }))}
              style={{ width: '100%', padding: '12px 16px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', color: 'var(--color-text-primary)', fontSize: 'var(--font-size-base)' }}>
              <option value="">Seleccionar...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Día de la semana</label>
            <select value={form.day_of_week} onChange={(e) => setForm(p => ({ ...p, day_of_week: e.target.value }))}
              style={{ width: '100%', padding: '12px 16px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', color: 'var(--color-text-primary)', fontSize: 'var(--font-size-base)' }}>
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Hora Inicio" name="start_time" type="time" value={form.start_time} onChange={(e) => setForm(p => ({ ...p, start_time: e.target.value }))} required />
            <Input label="Hora Fin" name="end_time" type="time" value={form.end_time} onChange={(e) => setForm(p => ({ ...p, end_time: e.target.value }))} required />
          </div>
        </form>
      </Modal>
    </div>
  )
}
