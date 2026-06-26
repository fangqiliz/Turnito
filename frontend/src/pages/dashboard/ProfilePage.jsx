import { useState } from 'react'
import { User, Save } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import AvatarUpload from '../../components/ui/AvatarUpload'
import toast from 'react-hot-toast'
import styles from './DashboardPages.module.css'

export default function ProfilePage() {
  const { profile, updateProfile } = useAuth()
  const [form, setForm] = useState({
    fullName: profile?.full_name || '',
    avatarUrl: profile?.avatar_url || '',
  })
  const [loading, setLoading] = useState(false)

  /**
   * Llamado por AvatarUpload cuando la imagen se sube correctamente.
   * Actualiza el estado local del form Y persiste en el backend.
   */
  const handleAvatarSuccess = async (url) => {
    setForm((prev) => ({ ...prev, avatarUrl: url }))
    try {
      await updateProfile({ fullName: form.fullName, avatarUrl: url })
      toast.success('Avatar actualizado correctamente')
    } catch (err) {
      toast.error(err.message || 'Error al guardar el avatar')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.fullName.trim()) { toast.error('El nombre es requerido'); return }
    setLoading(true)
    try {
      await updateProfile({ fullName: form.fullName.trim(), avatarUrl: form.avatarUrl })
      toast.success('Perfil actualizado')
    } catch (err) {
      toast.error(err.message || 'Error al actualizar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Mi Perfil</h1>
          <p className={styles.pageSubtitle}>Administra tu información personal</p>
        </div>
      </div>

      <div className={styles.section}>
        {/* Avatar con subida directa */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <AvatarUpload
            currentUrl={form.avatarUrl}
            name={profile?.full_name}
            onSuccess={handleAvatarSuccess}
            size="xl"
          />
          <div>
            <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>
              {profile?.full_name}
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              {profile?.email}
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-1)' }}>
              Haz clic en la foto para cambiarla
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '500px' }}>
          <Input
            label="Nombre Completo"
            name="fullName"
            icon={User}
            value={form.fullName}
            onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
            required
          />
          <Input
            label="Correo Electrónico"
            value={profile?.email || ''}
            disabled
          />
          <Button type="submit" loading={loading} icon={Save} style={{ alignSelf: 'flex-start' }}>
            Guardar Cambios
          </Button>
        </form>
      </div>
    </div>
  )
}
