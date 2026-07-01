import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import ErrorModal from '../../components/ui/ErrorModal'
import { useErrorModal } from '../../hooks/useErrorModal'
import styles from './AuthPages.module.css'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'
  const { errorMessage, showError, closeError, duration } = useErrorModal()

  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    if (errorMessage) closeError()
  }

  const validate = () => {
    const errs = {}
    if (!values.email) errs.email = 'El correo es requerido'
    else if (!/\S+@\S+\.\S+/.test(values.email)) errs.email = 'Correo inválido'
    if (!values.password) errs.password = 'La contraseña es requerida'
    else if (values.password.length < 6) errs.password = 'Mínimo 6 caracteres'
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
      await login(values.email, values.password)
      navigate(from, { replace: true })
    } catch (error) {
      showError('Credenciales incorrectas. Verifica tu correo y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Bienvenido de vuelta</h2>
      <p className={styles.subtitle}>Ingresa tus credenciales para acceder a tu cuenta</p>

      <form onSubmit={handleSubmit} className={styles.form}>
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

        <Input
          label="Contraseña"
          name="password"
          type="password"
          placeholder="••••••••"
          icon={Lock}
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          required
        />

        <Button type="submit" loading={loading} fullWidth size="lg">
          Iniciar Sesión
        </Button>
      </form>

      <p className={styles.footer}>
        ¿No tienes cuenta?{' '}
        <Link to="/register" className={styles.link}>Regístrate aquí</Link>
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
