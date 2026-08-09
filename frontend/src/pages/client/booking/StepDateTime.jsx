import React, { useEffect } from 'react'
import { useAvailableSlots } from '../../../hooks/useAvailableSlots'
import Input from '../../../components/ui/Input'
import styles from '../BookingPage.module.css'

/**
 * Paso 3 del booking: Selección de fecha y hora
 * 
 * Obtiene automáticamente los horarios disponibles para el empleado
 * seleccionado y el servicio elegido, considerando:
 * - Horario laboral del empleado
 * - Duración del servicio
 * - Citas existentes del empleado
 * 
 * @param {string} date - Fecha seleccionada (YYYY-MM-DD)
 * @param {string} time - Hora seleccionada (HH:mm)
 * @param {Function} onDateChange - Callback cuando cambia la fecha
 * @param {Function} onTimeChange - Callback cuando cambia la hora
 * @param {string} employeeId - UUID del empleado seleccionado (para obtener disponibilidad)
 * @param {string} serviceId - UUID del servicio (para obtener duración)
 */
export default function StepDateTime({
  date,
  time,
  onDateChange,
  onTimeChange,
  employeeId,
  serviceId,
}) {
  const { slots, loading: slotsLoading, error: slotsError, refetch } = useAvailableSlots(
    employeeId,
    date,
    serviceId,
    30 // Intervalo de slots: cada 30 minutos
  )

  const handleDateChange = (e) => {
    const newDate = e.target.value
    onDateChange(newDate)
    // Limpiar hora cuando cambia fecha
    onTimeChange('')
  }

  // Limpiar selección de hora si no hay disponibilidad
  useEffect(() => {
    if ((!slots || slots.length === 0) && time) {
      onTimeChange('')
    }
  }, [slots, time, onTimeChange])

  const hasAvailability = slots && slots.length > 0
  const showAvailabilityMessage = date && !slotsLoading && slotsError

  return (
    <div>
      <h3 className={styles.stepTitle}>Selecciona fecha y hora</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', maxWidth: '400px' }}>
        <div>
          <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
            Fecha
          </label>
          <Input
            name="date"
            type="date"
            value={date}
            onChange={handleDateChange}
            min={new Date().toISOString().split('T')[0]}
            required
            disabled={false}
          />
        </div>

        <div>
          <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
            Hora disponible
          </label>
          
          {!date ? (
            <select disabled style={{ width: '100%', padding: '12px 16px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', color: 'var(--color-text-secondary)' }}>
              <option value="">Selecciona fecha primero</option>
            </select>
          ) : slotsLoading ? (
            <select disabled style={{ width: '100%', padding: '12px 16px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', color: 'var(--color-text-secondary)' }}>
              <option value="">Cargando horarios...</option>
            </select>
          ) : slotsError ? (
            <select disabled style={{ width: '100%', padding: '12px 16px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', color: 'var(--color-text-danger)' }}>
              <option value="">Error al cargar horarios</option>
            </select>
          ) : hasAvailability ? (
            <select
              value={time}
              onChange={e => onTimeChange(e.target.value)}
              required
              style={{ width: '100%', padding: '12px 16px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', color: 'var(--color-text-primary)', fontSize: 'var(--font-size-base)' }}
            >
              <option value="">Selecciona una hora</option>
              {slots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          ) : (
            <select disabled style={{ width: '100%', padding: '12px 16px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', color: 'var(--color-text-danger)' }}>
              <option value="">No hay horarios disponibles</option>
            </select>
          )}

          {showAvailabilityMessage && (
            <div style={{ marginTop: '8px' }}>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-danger)', marginBottom: '8px' }}>
                ℹ️ {slotsError}
              </p>
              <button
                onClick={refetch}
                disabled={slotsLoading}
                style={{
                  fontSize: 'var(--font-size-xs)',
                  padding: '6px 12px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: slotsLoading ? 'not-allowed' : 'pointer',
                  opacity: slotsLoading ? 0.6 : 1,
                }}
              >
                {slotsLoading ? 'Refreshing...' : '🔄 Refrescar disponibilidad'}
              </button>
            </div>
          )}

          {hasAvailability && (
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
              ✓ {slots.length} horarios disponibles
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

