import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Building2, Calendar, ChevronLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import ErrorModal from '../../components/ui/ErrorModal'
import { useErrorModal } from '../../hooks/useErrorModal'
import styles from './AuthPages.module.css'

const ACCOUNT_TYPES = [
  {
    key: 'client',
    icon: Calendar,
    title: 'Soy cliente',
    description: 'Quiero reservar turnos en negocios',
  },
  {
    key: 'business',
    icon: Building2,
    title: 'Tengo un negocio',
    description: 'Quiero gestionar mi negocio y recibir reservas',
  },
]

export default function RegisterPage() {
  const { register, registerBusiness } = useAuth()
  const navigate = useNavigate()
  const { errorMessage, showError, closeError, duration } = useErrorModal()

  const [step, setStep] = useState(1)
  const [accountType, setAccountType] = useState(null)
  const [loading, setLoading] = useState(false)
  const [emailConfirmation, setEmailConfirmation] = useState(false)

  const [values, setValues] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    if (errorMessage) closeError()
  }

  const selectType = (type) => {
    setAccountType(type)
    setStep(2)
  }

  const validate = () => {
    const errs = {}
    if (!values.fullName || values.fullName.trim().length < 2)
      errs.fullName = 'El nombre debe tener al menos 2 caracteres'
    if (!values.email) errs.email = 'El correo es requerido'
    else if (!/\S+@\S+\.\S+/.test(values.email)) errs.email = 'Correo inválido'
    if (!values.password) errs.password = 'La contraseña es requerida'
    else if (values.password.length < 6) errs.password = 'Mínimo 6 caracteres'
    if (values.password !== values.confirmPassword)
      errs.confirmPassword = 'Las contraseñas no coinciden'
    if (accountType === 'business' && !values.businessName.trim())
      errs.businessName = 'El nombre del negocio es requerido'
    return errs
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setLoading(true)
    try {
      if (accountType === 'business') {
        const result = await registerBusiness(
          values.email,
          values.password,
          values.fullName.trim(),
          values.businessName.trim(),
        )
        if (result.requiresEmailConfirmation) {
          setEmailConfirmation(true)
          return
        }
        navigate('/', { replace: true })
      } else {
        await register(values.email, values.password, values.fullName.trim())
        navigate('/', { replace: true })
      }
    } catch (error) {
      showError(error.message || 'Error al crear la cuenta. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const strength = getPasswordStrength()

  // Pantalla de confirmación de email
  if (emailConfirmation) {
    return (
      <div className={styles.page}>
        <div className={styles.confirmIcon}>
          <Mail size={40} />
        </div>
        <h2 className={styles.title}>Revisa tu correo</h2>
        <p className={styles.subtitle}>
          Te enviamos un enlace de confirmación a <strong>{values.email}</strong>.
          Una vez confirmado podrás iniciar sesión.
        </p>
        <Link to="/login" className={styles.link} style={{ display: 'block', textAlign: 'center', marginTop: 'var(--space-4)' }}>
          Ir al inicio de sesión
        </Link>
      </div>
    )
  }

  // Paso 1: selección de tipo de cuenta
  if (step === 1) {
    return (
      <div className={styles.page}>
        <h2 className={styles.title}>Crear Cuenta</h2>
        <p className={styles.subtitle}>¿Cómo vas a usar Turnito?</p>

        <div className={styles.typeGrid}>
          {ACCOUNT_TYPES.map(({ key, icon: Icon, title, description }) => (
            <button
              key={key}
              className={styles.typeCard}
              onClick={() => selectType(key)}
              type="button"
            >
              <div className={styles.typeCardIcon}>
                <Icon size={28} />
              </div>
              <div className={styles.typeCardTitle}>{title}</div>
              <div className={styles.typeCardDesc}>{description}</div>
            </button>
          ))}
        </div>

        <p className={styles.footer}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className={styles.link}>
            Inicia sesión
          </Link>
        </p>
      </div>
    )
  }

  // Paso 2: formulario adaptado al tipo
  return (
    <div className={styles.page}>
      <button
        className={styles.backBtn}
        onClick={() => { setStep(1); setErrors({}) }}
        type="button"
      >
        <ChevronLeft size={16} />
        Volver
      </button>

      <h2 className={styles.title}>
        {accountType === 'business' ? 'Crear cuenta de negocio' : 'Crear cuenta'}
      </h2>
      <p className={styles.subtitle}>
        {accountType === 'business'
          ? 'Completa tus datos y los de tu negocio'
          : 'Completa tus datos personales'}
      </p>

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
                  style={{ width: `${(strength.level / 3) * 100}%`, background: strength.color }}
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

        {accountType === 'business' && (
          <>
            <div className={styles.dividerLine}>
              <span>Datos del negocio</span>
            </div>
            <Input
              label="Nombre del Negocio"
              name="businessName"
              placeholder="Mi Peluquería, Centro Médico..."
              icon={Building2}
              value={values.businessName}
              onChange={handleChange}
              error={errors.businessName}
              required
            />
          </>
        )}

        <Button type="submit" loading={loading} fullWidth size="lg">
          {accountType === 'business' ? 'Crear negocio' : 'Crear cuenta'}
        </Button>
      </form>

      <p className={styles.footer}>
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className={styles.link}>
          Inicia sesión
        </Link>
      </p>

      <ErrorModal
        isOpen={!!errorMessage}
        message={errorMessage}
        onClose={closeError}
        autoCloseDuration={duration}
      />
    </div>
  )
}
