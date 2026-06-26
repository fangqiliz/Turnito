import { useState, useEffect } from 'react'
import { Building2, Save } from 'lucide-react'
import { useBusiness } from '../../context/BusinessContext'
import api from '../../config/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import BusinessLogoUpload from '../../components/ui/BusinessLogoUpload'
import toast from 'react-hot-toast'
import styles from './DashboardPages.module.css'

export default function BusinessSettingsPage() {
  const { activeBusiness, refreshBusinessData } = useBusiness()
  const [form, setForm] = useState({ name: '', description: '', phone: '', address: '', logo_url: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (activeBusiness) {
      setForm({
        name: activeBusiness.name || '',
        description: activeBusiness.description || '',
        phone: activeBusiness.phone || '',
        address: activeBusiness.address || '',
        logo_url: activeBusiness.logo_url || '',
      })
    }
  }, [activeBusiness])

  /**
   * Cuando BusinessLogoUpload termina de subir con éxito,
   * actualiza el form con la nueva URL para que se guarde junto al resto de campos.
   */
  const handleLogoSuccess = (url) => {
    setForm((prev) => ({ ...prev, logo_url: url }))
    toast.success(url ? 'Logo actualizado correctamente' : 'Logo eliminado')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('El nombre es requerido'); return }
    setLoading(true)
    try {
      await api.put(`/businesses/${activeBusiness.id}`, form)
      toast.success('Negocio actualizado')
      refreshBusinessData()
    } catch (err) {
      toast.error(err.message || 'Error al actualizar')
    } finally {
      setLoading(false)
    }
  }

  if (!activeBusiness) return <EmptyState icon={Building2} title="Sin negocio" description="Selecciona un negocio para configurar." />

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Configuración</h1>
          <p className={styles.pageSubtitle}>Datos de {activeBusiness.name}</p>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Información del Negocio</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '600px' }}>
          <Input label="Nombre del Negocio" name="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <Input label="Descripción" name="description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Una breve descripción de tu negocio" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Teléfono" name="phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+1-809-555-0100" />
            <Input label="Dirección" name="address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} placeholder="Av. Principal #123" />
          </div>

          {/* Logo con subida directa */}
          <BusinessLogoUpload
            currentUrl={form.logo_url}
            businessId={activeBusiness.id}
            onSuccess={handleLogoSuccess}
            disabled={loading}
          />

          <Button type="submit" loading={loading} icon={Save} style={{ alignSelf: 'flex-start' }}>
            Guardar Cambios
          </Button>
        </form>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Información del Sistema</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
          <div><strong style={{ color: 'var(--color-text-secondary)' }}>ID:</strong> {activeBusiness.id}</div>
          <div><strong style={{ color: 'var(--color-text-secondary)' }}>Slug:</strong> {activeBusiness.slug}</div>
          <div><strong style={{ color: 'var(--color-text-secondary)' }}>Creado:</strong> {activeBusiness.created_at ? new Date(activeBusiness.created_at).toLocaleDateString('es-ES') : '—'}</div>
        </div>
      </div>
    </div>
  )
}
