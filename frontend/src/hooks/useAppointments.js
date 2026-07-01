import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import appointmentsService from '../services/appointments.service'

const STATUS_LABELS = {
  confirmed: 'confirmada',
  completed: 'completada',
  cancelled: 'cancelada',
  no_show:   'marcada como no asistió',
}

export function useBusinessAppointments(businessId, options = {}) {
  const { status = 'all', date = '', employeeId = '' } = options

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (!businessId) { setLoading(false); return }
    setLoading(true)
    try {
      const data = await appointmentsService.getByBusiness(businessId, { status, date, employeeId })
      setAppointments(data)
    } catch (err) {
      toast.error(err.message || 'Error al cargar citas')
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }, [businessId, status, date, employeeId])

  useEffect(() => { fetch() }, [fetch])

  const updateStatus = async (appt, newStatus) => {
    setActionLoading(true)
    try {
      await appointmentsService.updateStatus(appt.id, businessId, newStatus)
      toast.success(`Cita ${STATUS_LABELS[newStatus] ?? 'actualizada'}`)
      fetch()
    } catch (err) {
      toast.error(err.message || 'Error al actualizar')
    } finally {
      setActionLoading(false)
    }
  }

  const cancel = async (appt) => {
    setActionLoading(true)
    try {
      await appointmentsService.cancel(appt.id, businessId)
      toast.success('Cita cancelada')
      fetch()
    } catch (err) {
      toast.error(err.message || 'Error al cancelar')
    } finally {
      setActionLoading(false)
    }
  }

  return { appointments, loading, actionLoading, refresh: fetch, updateStatus, cancel }
}

export function useUserAppointments(options = {}) {
  const { status = '' } = options

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await appointmentsService.getByUser({ status })
      setAppointments(data)
    } catch (err) {
      toast.error(err.message || 'Error al cargar citas')
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { fetch() }, [fetch])

  const cancel = async (appt) => {
    if (!confirm('¿Cancelar esta cita?')) return
    setActionLoading(true)
    try {
      await appointmentsService.cancel(appt.id, appt.business_id)
      toast.success('Cita cancelada')
      fetch()
    } catch (err) {
      toast.error(err.message || 'Error al cancelar')
    } finally {
      setActionLoading(false)
    }
  }

  return { appointments, loading, actionLoading, refresh: fetch, cancel }
}
