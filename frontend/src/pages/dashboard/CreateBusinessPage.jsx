import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ArrowLeft } from 'lucide-react'
import { useBusiness } from '../../context/BusinessContext'
import api from '../../config/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import ErrorModal from '../../components/ui/ErrorModal'
import { useErrorModal } from '../../hooks/useErrorModal'
import toast from 'react-hot-toast'
import styles from './DashboardPages.module.css'

const INITIAL_FORM = {
  name: '',
  description: '',
  phone: '',
  address: '',
  logo_url: '',
}

function isValidUrl(string) {
  try {
    const url = new URL(string)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export default function CreateBusinessPage() {
  const navigate = useNavigate()
  const { refreshBusinessData, switchBusiness } = useBusiness()
  const { errorMessage, showError, closeError, duration } = useErrorModal()
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    if (errorMessage) closeError()
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'El nombre es requerido'
    else if (form.name.trim().length < 2) errs.name = 'El nombre debe tener al menos 2 caracteres'
    if (!form.description.trim()) errs.description = 'La descripción es requerida'
    if (!form.phone.trim()) errs.phone = 'El teléfono es requerido'
    if (!form.address.trim()) errs.address = 'La dirección es requerida'
    if (form.logo_url.trim() && !isValidUrl(form.logo_url.trim())) {
      errs.logo_url = 'Ingresa una URL válida (http:// o https://)'
    }
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

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    }
    if (form.logo_url.trim()) {
      payload.logo_url = form.logo_url.trim()
    }

    try {
      const res = await api.post('/businesses', payload)
      if (res.success) {
        toast.success('Negocio creado correctamente')
        setForm(INITIAL_FORM)
        setErrors({})
        await refreshBusinessData()
        if (res.data) switchBusiness(res.data)
        navigate('/dashboard/businesses', { replace: true })
      }
    } catch (err) {
      if (err.errors?.length) {
        const fieldErrors = {}
        err.errors.forEach(({ field, message }) => {
          if (field) fieldErrors[field] = message
        })
        setErrors(fieldErrors)
      }
      showError(err.message || 'Error al crear el negocio. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const showLogoPreview = form.logo_url.trim() && isValidUrl(form.logo_url.trim())

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Crear Negocio</h1>
          <p className={styles.pageSubtitle}>Registra un nuevo negocio en la plataforma</p>
        </div>
        <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/dashboard/businesses')}>
          Volver
        </Button>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Información del Negocio</h3>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Nombre del Negocio"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Barbería El Corte"
            error={errors.name}
            required
          />

          <Textarea
            label="Descripción"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="La mejor barbería de la ciudad"
            error={errors.description}
            required
          />

          <div className={styles.formRow}>
            <Input
              label="Teléfono"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+1-809-555-0100"
              error={errors.phone}
              required
            />
            <Input
              label="Dirección"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Av. 27 de Febrero #123, Santo Domingo"
              error={errors.address}
              required
            />
          </div>

          <div>
            <Input
              label="URL del Logo"
              name="logo_url"
              value={form.logo_url}
              onChange={handleChange}
              placeholder="https://ejemplo.com/logo.png"
              error={errors.logo_url}
            />
            {showLogoPreview && (
              <div className={styles.logoPreview}>
                <span className={styles.logoPreviewLabel}>Vista previa</span>
                <img
                  src={form.logo_url.trim()}
                  alt="Vista previa del logo"
                  className={styles.logoPreviewImage}
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/dashboard/businesses')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={loading} icon={Plus}>
              Crear Negocio
            </Button>
          </div>
        </form>
      </div>

      <ErrorModal
        isOpen={!!errorMessage}
        message={errorMessage}
        onClose={closeError}
        autoCloseDuration={duration}
      />
    </div>
  )
}
