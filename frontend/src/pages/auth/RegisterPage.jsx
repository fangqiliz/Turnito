import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import styles from './AuthPages.module.css'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [values, setValues] = useState({
    fullName: '', email: '', password: '', confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    if (generalError) setGeneralError('')
  }

  const getPasswordStrength = () => {
    const p = values.password
    if (!p) return { level: 0, label: '' }
    let score = 0
    if (p.length >= 6) score++
    if (p.length >= 10) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++

    if (score <= 1) return { level: 1, label: 'Débil', color: 'var(--color-danger)' }
    if (score <= 3) return { level: 2, label: 'Media', color: 'var(--color-warning)' }
    return { level: 3, label: 'Fuerte', color: 'var(--color-success)' }
  }

  const validate = () => {
    const errs = {}
    if (!values.fullName || values.fullName.trim().length < 2) errs.fullName = 'El nombre debe tener al menos 2 caracteres'
    if (!values.email) errs.email = 'El correo es requerido'
    else if (!/\S+@\S+\.\S+/.test(values.email)) errs.email = 'Correo inválido'
    if (!values.password) errs.password = 'La contraseña es requerida'
    else if (values.password.length < 6) errs.password = 'Mínimo 6 caracteres'
    if (values.password !== values.confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setLoading(true)
    try {
      await register(values.email, values.password, values.fullName.trim())
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setGeneralError(error.message || 'Error al crear la cuenta. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const strength = getPasswordStrength()

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Crear Cuenta</h2>
      <p className={styles.subtitle}>Regístrate para empezar a gestionar tus citas</p>

      {generalError && (
        <div className={styles.errorBanner}>{generalError}</div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Nombre Completo"
          name="fullName"
          placeholder="Juan Pérez"
          icon={User}
          value={values.fullName}
          onChange={handleChange}
          error={errors.fullName}
          required
        />

        <Input
          label="Correo Electrónico"
          name="email"
          type="email"
          placeholder="tu@correo.com"
          icon={Mail}
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          required
        />

        <div>
          <Input
            label="Contraseña"
            name="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            icon={Lock}
            value={values.password}
            onChange={handleChange}
            error={errors.password}
            required
          />
          {values.password && (
            <div className={styles.strengthBar}>
              <div className={styles.strengthTrack}>
                <div
                  className={styles.strengthFill}
                  style={{
                    width: `${(strength.level / 3) * 100}%`,
                    background: strength.color,
                  }}
                />
              </div>
              <span className={styles.strengthLabel} style={{ color: strength.color }}>
                {strength.label}
              </span>
            </div>
          )}
        </div>

        <Input
          label="Confirmar Contraseña"
          name="confirmPassword"
          type="password"
          placeholder="Repite tu contraseña"
          icon={Lock}
          value={values.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          required
        />

        <Button type="submit" loading={loading} fullWidth size="lg">
          Crear Cuenta
        </Button>
      </form>

      <p className={styles.footer}>
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className={styles.link}>Inicia sesión</Link>
      </p>
    </div>
  )
}
