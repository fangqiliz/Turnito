import { useState, useEffect, useCallback } from 'react'
import { User, Phone, Save } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useBusiness } from '../../context/BusinessContext'
import { useUserRole } from '../../hooks/useUserRole'
import api from '../../config/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import AvatarUpload from '../../components/ui/AvatarUpload'
import toast from 'react-hot-toast'
import styles from '../dashboard/DashboardPages.module.css'

export default function ProfilePage() {
  const { profile, updateProfile } = useAuth()
  const { isEmployee } = useUserRole()
  const { employeeRoles } = useBusiness()

  const myRole = employeeRoles.find(
    (r) => (r.role === 'staff' || r.role === 'manager') && r.isActive
  )

  const [form, setForm] = useState({
    fullName: profile?.full_name || '',
    avatarUrl: profile?.avatar_url || '',
    phone: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [phoneLoading, setPhoneLoading] = useState(false)

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      fullName: profile?.full_name || '',
      avatarUrl: profile?.avatar_url || '',
    }))
  }, [profile])

  // Cargar el teléfono actual desde el propio registro de empleado (si aplica)
  useEffect(() => {
    if (!isEmployee || !myRole) return
    let cancelled = false

    setPhoneLoading(true)
    api.get(`/employees/business/${myRole.business.id}`)
      .then((res) => {
        if (cancelled || !res.success) return
        const own = (res.data || []).find((e) => e.profile_id === profile?.id)
        if (own) setForm((prev) => ({ ...prev, phone: own.phone || '' }))
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setPhoneLoading(false) })

    return () => { cancelled = true }
  }, [isEmployee, myRole?.business?.id, profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAvatarSuccess = async (url) => {
    setForm((prev) => ({ ...prev, avatarUrl: url }))
    try {
      await updateProfile({ fullName: form.fullName, avatarUrl: url })
      toast.success('Avatar actualizado correctamente')
    } catch (err) {
      toast.error(err.message || 'Error al guardar el avatar')
    }
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.fullName.trim()) {
      nextErrors.fullName = 'El nombre completo es requerido'
    } else if (form.fullName.trim().length < 2) {
      nextErrors.fullName = 'El nombre debe tener al menos 2 caracteres'
    }
    if (form.phone && form.phone.trim().length > 20) {
      nextErrors.phone = 'El teléfono no puede superar los 20 caracteres'
    }
    return nextErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setLoading(true)
    try {
      await updateProfile({ fullName: form.fullName.trim(), avatarUrl: form.avatarUrl })

      if (isEmployee && myRole) {
        await api.put('/employees/me', {
          businessId: myRole.business.id,
          phone: form.phone.trim() || null,
        })
      }

      toast.success('Perfil actualizado')
    } catch (err) {
      toast.error(err.message || 'Error al actualizar el perfil')
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
            error={errors.fullName}
            required
          />
          <Input
            label="Correo Electrónico"
            value={profile?.email || ''}
            disabled
          />
          {isEmployee && myRole && (
            <Input
              label="Teléfono"
              name="phone"
              icon={Phone}
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              error={errors.phone}
              disabled={phoneLoading}
              placeholder="Ej: +1-809-555-0100"
            />
          )}
          <Button type="submit" loading={loading} icon={Save} style={{ alignSelf: 'flex-start' }}>
            Guardar Cambios
          </Button>
        </form>
      </div>
    </div>
  )
}
