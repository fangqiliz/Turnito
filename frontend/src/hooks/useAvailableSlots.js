import { useState, useEffect, useCallback } from 'react'
import api from '../config/api'

/**
 * Hook para obtener los horarios disponibles de un empleado en una fecha específica.
 * 
 * @param {string} employeeId - UUID del empleado
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @param {string} serviceId - UUID del servicio (para obtener la duración)
 * @param {number} [slotDuration=30] - Intervalo de slots en minutos (default 30)
 * @returns {{
 *   slots: string[],
 *   loading: boolean,
 *   error: string | null,
 *   refetch: () => void
 * }}
 */
export function useAvailableSlots(employeeId, date, serviceId, slotDuration = 30) {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchSlots = useCallback(async () => {
    // Si falta algún parámetro, no hacer la solicitud
    if (!employeeId || !date || !serviceId) {
      setSlots([])
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        employeeId,
        date,
        serviceId,
        slotDuration,
      })

      const response = await api.get(`/appointments/available-slots?${params}`)
      
      // Verificar si la respuesta tiene éxito
      if (response && response.success !== false) {
        // Asegurar que slots siempre sea un array
        const availableSlots = Array.isArray(response.data?.slots) ? response.data.slots : []
        setSlots(availableSlots)
        setError(null)
      } else {
        // Si hay error en la respuesta
        setError(response?.message || 'No se pudieron obtener los horarios disponibles')
        setSlots([])
      }
    } catch (err) {
      // El cliente API lanza error cuando response.ok === false (4xx, 5xx)
      const errorMessage = err?.message || 'Error al obtener horarios disponibles'
      setError(errorMessage)
      setSlots([])
    } finally {
      setLoading(false)
    }
  }, [employeeId, date, serviceId, slotDuration])

  // Ejecutar fetch cuando los parámetros cambien
  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

  return {
    slots,
    loading,
    error,
    refetch: fetchSlots,
  }
}

export default useAvailableSlots
