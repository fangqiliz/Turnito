import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { useBusiness } from '../../context/BusinessContext'
import api from '../../config/api'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import toast from 'react-hot-toast'
import styles from './DashboardPages.module.css'

export default function EmployeesPage() {
  const { activeBusiness } = useBusiness()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', specialty: '', role: 'staff', password: '', confirmPassword: '' })

  const fetchEmployees = useCallback(async () => {
    if (!activeBusiness) return
    setLoading(true)
    try {
      const res = await api.get(`/employees/business/${activeBusiness.id}`)
      if (res.success) setEmployees(res.data || [])
    } catch { toast.error('Error al cargar empleados') }
    finally { setLoading(false) }
  }, [activeBusiness])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  const openCreate = () => {
    setEditing(null)
    setForm({ full_name: '', email: '', phone: '', specialty: '', role: 'staff', password: '', confirmPassword: '' })
    setShowModal(true)
  }

  const openEdit = (emp) => {
    setEditing(emp)
    setForm({ full_name: emp.full_name, email: emp.email || '', phone: emp.phone || '', specialty: emp.specialty || '', role: emp.role, password: '', confirmPassword: '' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.full_name.trim()) { toast.error('El nombre es requerido'); return }

    if (!editing) {
      if (!form.email.trim()) { toast.error('El email es requerido'); return }
      if (!form.password) { toast.error('La contraseña es requerida'); return }
      if (form.password.length < 8) { toast.error('La contraseña debe tener al menos 8 caracteres'); return }
      if (form.password !== form.confirmPassword) { toast.error('Las contraseñas no coinciden'); return }
    }

    setFormLoading(true)
    try {
      if (editing) {
        const { password: _pw, confirmPassword: _cpw, ...editPayload } = form
        await api.put(`/employees/${editing.id}?businessId=${activeBusiness.id}`, editPayload)
        toast.success('Empleado actualizado')
      } else {
        const { confirmPassword: _cpw, ...createPayload } = form
        await api.post('/employees', { ...createPayload, business_id: activeBusiness.id })
        toast.success('Empleado creado')
      }
      setShowModal(false)
      fetchEmployees()
    } catch (err) { toast.error(err.message || 'Error') }
    finally { setFormLoading(false) }
  }

  const handleDelete = async (emp) => {
    if (!confirm(`¿Eliminar a ${emp.full_name}?`)) return
    try {
      await api.delete(`/employees/${emp.id}?businessId=${activeBusiness.id}`)
      toast.success('Empleado eliminado')
      // Quitar del estado local de inmediato (el backend lo elimina físicamente)
      setEmployees((prev) => prev.filter((e) => e.id !== emp.id))
      fetchEmployees()
    } catch (err) { toast.error(err.message || 'Error al eliminar') }
  }

  if (!activeBusiness) return <EmptyState title="Selecciona un negocio" />
  if (loading) return <Spinner fullPage size="lg" />

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Empleados</h1>
          <p className={styles.pageSubtitle}>Gestiona el equipo de {activeBusiness.name}</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>Nuevo Empleado</Button>
      </div>

      {employees.length === 0 ? (
        <EmptyState icon={Users} title="Sin empleados" description="Agrega tu primer empleado para empezar." actionLabel="Agregar Empleado" onAction={openCreate} />
      ) : (
        <div className={styles.dataGrid}>
          {employees.map((emp, i) => (
            <div key={emp.id} className={styles.itemCard} style={{ animationDelay: `${i * 60}ms` }}>
              <div className={styles.itemHeader}>
                <div>
                  <div className={styles.itemTitle}>{emp.full_name}</div>
                  <div className={styles.itemMeta}>{emp.email || 'Sin email'}</div>
                </div>
                <Badge status={emp.role} />
              </div>
              {emp.specialty && <div className={styles.itemMeta}>✂️ {emp.specialty}</div>}
              {emp.phone && <div className={styles.itemMeta}>📱 {emp.phone}</div>}
              <div className={styles.itemActions}>
                <Button size="sm" variant="ghost" icon={Pencil} onClick={() => openEdit(emp)}>Editar</Button>
                <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDelete(emp)}>Eliminar</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Empleado' : 'Nuevo Empleado'}
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button><Button loading={formLoading} onClick={handleSubmit}>Guardar</Button></>}>
        <form onSubmit={handleSubmit} className={styles.formGrid} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input label="Nombre Completo" name="full_name" value={form.full_name} onChange={(e) => setForm(p => ({ ...p, full_name: e.target.value }))} required />
          <Input label={editing ? 'Email' : 'Email *'} name="email" type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} required={!editing} />
          <Input label="Teléfono" name="phone" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} />
          <Input label="Especialidad" name="specialty" value={form.specialty} onChange={(e) => setForm(p => ({ ...p, specialty: e.target.value }))} placeholder="Ej: Corte, Coloración..." />
          <div>
            <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>Rol</label>
            <select name="role" value={form.role} onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}
              style={{ width: '100%', padding: '12px 16px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', color: 'var(--color-text-primary)', fontSize: 'var(--font-size-base)' }}>
              <option value="staff">Staff</option>
              <option value="manager">Gerente</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {!editing && (
            <>
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                  Credenciales de acceso al sistema
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <Input
                    label="Contraseña *"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Mínimo 8 caracteres"
                    required
                  />
                  <Input
                    label="Confirmar contraseña *"
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Repite la contraseña"
                    required
                  />
                </div>
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  )
}
