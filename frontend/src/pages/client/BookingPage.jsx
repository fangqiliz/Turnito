import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Scissors, User, CalendarDays, FileText, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../config/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import styles from './BookingPage.module.css'

const STEPS = ['Servicio', 'Empleado', 'Fecha y Hora', 'Datos', 'Confirmar']

export default function BookingPage() {
  const { businessSlug } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [business, setBusiness] = useState(null)
  const [services, setServices] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [selectedService, setSelectedService] = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [clientData, setClientData] = useState({
    client_name: profile?.full_name || '',
    client_email: profile?.email || '',
    client_phone: '',
    notes: '',
  })

  useEffect(() => {
    const fetchBusiness = async () => {
      setLoading(true)
      try {
        const res = await api.get('/businesses')
        if (res.success) {
          const biz = (res.data || []).find(b => b.slug === businessSlug)
          if (biz) {
            setBusiness(biz)
            const [svcRes, empRes] = await Promise.all([
              api.get(`/services/business/${biz.id}`),
              api.get(`/employees/business/${biz.id}`),
            ])
            if (svcRes.success) setServices((svcRes.data || []).filter(s => s.is_active))
            if (empRes.success) setEmployees((empRes.data || []).filter(e => e.is_active))
          }
        }
      } catch (err) { toast.error('Error al cargar negocio') }
      finally { setLoading(false) }
    }
    fetchBusiness()
  }, [businessSlug])

  useEffect(() => {
    if (profile) {
      setClientData(prev => ({
        ...prev,
        client_name: prev.client_name || profile.full_name || '',
        client_email: prev.client_email || profile.email || '',
      }))
    }
  }, [profile])

  const canNext = () => {
    if (step === 0) return !!selectedService
    if (step === 1) return !!selectedEmployee
    if (step === 2) return selectedDate && selectedTime
    if (step === 3) return clientData.client_name && clientData.client_email
    return true
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const startTime = new Date(`${selectedDate}T${selectedTime}:00`)
      const body = {
        business_id: business.id,
        service_id: selectedService.id,
        employee_id: selectedEmployee.id,
        start_time: startTime.toISOString(),
        ...clientData,
      }
      const res = await api.post('/appointments', body)
      if (res.success) {
        toast.success('¡Cita agendada exitosamente!')
        navigate('/my-appointments')
      }
    } catch (err) {
      toast.error(err.message || 'Error al agendar cita')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner fullPage size="lg" />
  if (!business) return <div className={styles.container}><h2>Negocio no encontrado</h2></div>

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.businessName}>{business.name}</h1>
        <p className={styles.businessDesc}>{business.description || 'Reserva tu cita'}</p>
      </div>

      {/* Stepper */}
      <div className={styles.stepper}>
        {STEPS.map((s, i) => (
          <div key={s} className={`${styles.step} ${i === step ? styles.activeStep : ''} ${i < step ? styles.completedStep : ''}`}>
            <div className={styles.stepNumber}>{i < step ? <Check size={14} /> : i + 1}</div>
            <span className={styles.stepLabel}>{s}</span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className={styles.stepContent}>
        {step === 0 && (
          <div>
            <h3 className={styles.stepTitle}>Selecciona un servicio</h3>
            <div className={styles.optionsGrid}>
              {services.map(svc => (
                <div
                  key={svc.id}
                  className={`${styles.optionCard} ${selectedService?.id === svc.id ? styles.selected : ''}`}
                  onClick={() => setSelectedService(svc)}
                >
                  <Scissors size={20} className={styles.optionIcon} />
                  <div className={styles.optionName}>{svc.name}</div>
                  <div className={styles.optionMeta}>RD${Number(svc.price).toFixed(2)} · {svc.duration_minutes} min</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h3 className={styles.stepTitle}>Selecciona un profesional</h3>
            <div className={styles.optionsGrid}>
              {employees.map(emp => (
                <div
                  key={emp.id}
                  className={`${styles.optionCard} ${selectedEmployee?.id === emp.id ? styles.selected : ''}`}
                  onClick={() => setSelectedEmployee(emp)}
                >
                  <User size={20} className={styles.optionIcon} />
                  <div className={styles.optionName}>{emp.full_name}</div>
                  <div className={styles.optionMeta}>{emp.specialty || 'Profesional'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className={styles.stepTitle}>Selecciona fecha y hora</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', maxWidth: '400px' }}>
              <Input label="Fecha" name="date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} required />
              <Input label="Hora" name="time" type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} required />
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className={styles.stepTitle}>Datos del cliente</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: '500px' }}>
              <Input label="Nombre" name="client_name" value={clientData.client_name} onChange={(e) => setClientData(p => ({ ...p, client_name: e.target.value }))} required />
              <Input label="Email" name="client_email" type="email" value={clientData.client_email} onChange={(e) => setClientData(p => ({ ...p, client_email: e.target.value }))} required />
              <Input label="Teléfono" name="client_phone" value={clientData.client_phone} onChange={(e) => setClientData(p => ({ ...p, client_phone: e.target.value }))} />
              <Input label="Notas" name="notes" value={clientData.notes} onChange={(e) => setClientData(p => ({ ...p, notes: e.target.value }))} placeholder="Alguna preferencia o nota..." />
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 className={styles.stepTitle}>Confirmar Reserva</h3>
            <div className={styles.summary}>
              <div className={styles.summaryItem}><strong>Servicio:</strong> {selectedService?.name}</div>
              <div className={styles.summaryItem}><strong>Profesional:</strong> {selectedEmployee?.full_name}</div>
              <div className={styles.summaryItem}><strong>Fecha:</strong> {selectedDate}</div>
              <div className={styles.summaryItem}><strong>Hora:</strong> {selectedTime}</div>
              <div className={styles.summaryItem}><strong>Precio:</strong> RD${Number(selectedService?.price || 0).toFixed(2)}</div>
              <div className={styles.summaryItem}><strong>Duración:</strong> {selectedService?.duration_minutes} min</div>
              <div className={styles.summaryItem}><strong>Cliente:</strong> {clientData.client_name}</div>
              <div className={styles.summaryItem}><strong>Email:</strong> {clientData.client_email}</div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className={styles.navigation}>
        {step > 0 && (
          <Button variant="secondary" icon={ChevronLeft} onClick={() => setStep(s => s - 1)}>
            Anterior
          </Button>
        )}
        <div style={{ flex: 1 }} />
        {step < 4 ? (
          <Button icon={ChevronRight} onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
            Siguiente
          </Button>
        ) : (
          <Button loading={submitting} icon={Check} onClick={handleSubmit}>
            Confirmar Cita
          </Button>
        )}
      </div>
    </div>
  )
}
