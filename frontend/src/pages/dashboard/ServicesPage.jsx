import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Scissors, DollarSign, Clock } from 'lucide-react'
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

export default function ServicesPage() {
  const { activeBusiness } = useBusiness()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', price: '', duration_minutes: '' })

  const fetch = useCallback(async () => {
    if (!activeBusiness) return
    setLoading(true)
    try {
      const res = await api.get(`/services/business/${activeBusiness.id}`)
      if (res.success) setServices(res.data || [])
    } catch { toast.error('Error al cargar servicios') }
    finally { setLoading(false) }
  }, [activeBusiness])

  useEffect(() => { fetch() }, [fetch])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', description: '', price: '', duration_minutes: '' })
    setShowModal(true)
  }

  const openEdit = (svc) => {
    setEditing(svc)
    setForm({ name: svc.name, description: svc.description || '', price: String(svc.price), duration_minutes: String(svc.duration_minutes) })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('El nombre es requerido'); return }
    setFormLoading(true)
    try {
      const body = { ...form, price: parseFloat(form.price) || 0, duration_minutes: parseInt(form.duration_minutes) || 30 }
      if (editing) {
        await api.put(`/services/${editing.id}?businessId=${activeBusiness.id}`, body)
        toast.success('Servicio actualizado')
      } else {
        await api.post('/services', { ...body, business_id: activeBusiness.id })
        toast.success('Servicio creado')
      }
      setShowModal(false)
      fetch()
    } catch (err) { toast.error(err.message || 'Error') }
    finally { setFormLoading(false) }
  }

  const handleDelete = async (svc) => {
    if (!confirm(`¿Eliminar "${svc.name}"?`)) return
    try {
      await api.delete(`/services/${svc.id}?businessId=${activeBusiness.id}`)
      toast.success('Servicio eliminado')
      fetch()
    } catch (err) { toast.error(err.message || 'Error al eliminar') }
  }

  if (!activeBusiness) return <EmptyState title="Selecciona un negocio" />
  if (loading) return <Spinner fullPage size="lg" />

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Servicios</h1>
          <p className={styles.pageSubtitle}>Servicios que ofrece {activeBusiness.name}</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>Nuevo Servicio</Button>
      </div>

      {services.length === 0 ? (
        <EmptyState icon={Scissors} title="Sin servicios" description="Agrega tu primer servicio." actionLabel="Agregar Servicio" onAction={openCreate} />
      ) : (
        <div className={styles.dataGrid}>
          {services.map((svc, i) => (
            <div key={svc.id} className={styles.itemCard} style={{ animationDelay: `${i * 60}ms` }}>
              <div className={styles.itemHeader}>
                <div className={styles.itemTitle}>{svc.name}</div>
                <Badge status={svc.is_active ? 'active' : 'inactive'} />
              </div>
              {svc.description && <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>{svc.description}</p>}
              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <div className={styles.itemMeta}><DollarSign size={14} /> RD${Number(svc.price).toFixed(2)}</div>
                <div className={styles.itemMeta}><Clock size={14} /> {svc.duration_minutes} min</div>
              </div>
              <div className={styles.itemActions}>
                <Button size="sm" variant="ghost" icon={Pencil} onClick={() => openEdit(svc)}>Editar</Button>
                <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDelete(svc)}>Eliminar</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Servicio' : 'Nuevo Servicio'}
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button><Button loading={formLoading} onClick={handleSubmit}>Guardar</Button></>}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input label="Nombre" name="name" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Ej: Corte Clásico" />
          <Input label="Descripción" name="description" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Descripción del servicio" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Precio (RD$)" name="price" type="number" value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} required placeholder="0.00" />
            <Input label="Duración (min)" name="duration_minutes" type="number" value={form.duration_minutes} onChange={(e) => setForm(p => ({ ...p, duration_minutes: e.target.value }))} required placeholder="30" />
          </div>
        </form>
      </Modal>
    </div>
  )
}
