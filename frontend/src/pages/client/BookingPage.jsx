import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../config/api'
import appointmentsService from '../../services/appointments.service'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import BookingStepper from './booking/BookingStepper'
import StepService    from './booking/StepService'
import StepEmployee   from './booking/StepEmployee'
import StepDateTime   from './booking/StepDateTime'
import StepClientData from './booking/StepClientData'
import StepConfirm    from './booking/StepConfirm'
import styles from './BookingPage.module.css'

const STEPS = ['Servicio', 'Empleado', 'Fecha y Hora', 'Datos', 'Confirmar']

export default function BookingPage() {
  const { businessSlug } = useParams()
  const { profile }      = useAuth()
  const navigate         = useNavigate()

  const [step, setStep]           = useState(0)
  const [business, setBusiness]   = useState(null)
  const [services, setServices]   = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading]     = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [selectedService,  setSelectedService]  = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedDate, setSelectedDate]         = useState('')
  const [selectedTime, setSelectedTime]         = useState('')
  const [clientData, setClientData] = useState({
    client_name:  '',
    client_email: '',
    client_phone: '',
    notes:        '',
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
      } catch { toast.error('Error al cargar negocio') }
      finally { setLoading(false) }
    }
    fetchBusiness()
  }, [businessSlug])

  useEffect(() => {
    if (profile) {
      setClientData(prev => ({
        ...prev,
        client_name:  prev.client_name  || profile.full_name || '',
        client_email: prev.client_email || profile.email     || '',
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
      await appointmentsService.create({
        business_id:  business.id,
        service_id:   selectedService.id,
        employee_id:  selectedEmployee.id,
        start_time:   new Date(`${selectedDate}T${selectedTime}:00`).toISOString(),
        ...clientData,
      })
      toast.success('¡Cita agendada exitosamente!')
      navigate('/client/appointments')
    } catch (err) {
      toast.error(err.message || 'Error al agendar cita')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading)    return <Spinner fullPage size="lg" />
  if (!business)  return <div className={styles.container}><h2>Negocio no encontrado</h2></div>

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.businessName}>{business.name}</h1>
        <p className={styles.businessDesc}>{business.description || 'Reserva tu cita'}</p>
      </div>

      <BookingStepper steps={STEPS} currentStep={step} />

      <div className={styles.stepContent}>
        {step === 0 && <StepService   services={services}   selected={selectedService}  onSelect={setSelectedService} />}
        {step === 1 && <StepEmployee  employees={employees} selected={selectedEmployee} onSelect={setSelectedEmployee} />}
        {step === 2 && (
          <StepDateTime
            date={selectedDate}
            time={selectedTime}
            onDateChange={setSelectedDate}
            onTimeChange={setSelectedTime}
          />
        )}
        {step === 3 && <StepClientData data={clientData} onChange={setClientData} />}
        {step === 4 && (
          <StepConfirm
            service={selectedService}
            employee={selectedEmployee}
            date={selectedDate}
            time={selectedTime}
            clientData={clientData}
          />
        )}
      </div>

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
