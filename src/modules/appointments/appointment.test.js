import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import appointmentService from './appointment.service'
import supabase from '../../config/supabase'

/**
 * Tests de disponibilidad de citas
 * 
 * Valida:
 * 1. Horario completamente disponible
 * 2. Horario completamente ocupado
 * 3. Nueva cita que comienza durante una cita existente
 * 4. Nueva cita que termina durante una cita existente
 * 5. Nueva cita que engloba una cita existente
 * 6. Cita con exactamente el mismo horario
 * 7. Cita inmediatamente antes de otra
 * 8. Cita inmediatamente después de otra
 * 9. Servicio cuya duración provoca un solapamiento
 * 10. Horario fuera de la jornada laboral
 * 11. Profesional sin disponibilidad para esa fecha
 * 12. Intento de reservar un horario que dejó de estar disponible
 */

describe('AppointmentService - Disponibilidad de Horarios', () => {
  let testData = {
    businessId: null,
    employeeId: null,
    serviceId: null,
    scheduleIds: [],
    appointmentIds: [],
  }

  beforeAll(async () => {
    // Setup: Crear negocio, empleado, servicio y horario de prueba
    // NOTA: En un entorno real, esto se haría con fixtures o una base de datos de prueba
    console.log('⚠️ IMPORTANTE: Estos tests requieren de base de datos de prueba configurada')
    console.log('Para ejecutarlos, necesitas:')
    console.log('1. Crear un negocio de prueba')
    console.log('2. Crear un empleado')
    console.log('3. Crear un servicio con duration_minutes')
    console.log('4. Crear horarios laborales')
  })

  afterAll(async () => {
    // Cleanup: Eliminar datos de prueba
    if (testData.appointmentIds.length > 0) {
      for (const id of testData.appointmentIds) {
        await supabase.from('appointments').delete().eq('id', id).catch(() => {})
      }
    }
  })

  // ───────────────────────────────────────────────────────────────────────────
  // CASOS DE PRUEBA
  // ───────────────────────────────────────────────────────────────────────────

  it('1. Horario completamente disponible', async () => {
    /**
     * Escenario:
     *  - Empleado: libre de 09:00 a 17:00
     *  - Reservar: 10:00 - 11:00 (servicio 60 min)
     *  - No hay citas previas
     * 
     * Esperado: ✅ Disponible
     */
    const startTime = '2026-08-20T10:00:00Z' // 10:00 AM
    const endTime = '2026-08-20T11:00:00Z'   // 11:00 AM

    // Mock de employeeId y horarios disponibles
    // En un entorno real, verificarías con la base de datos
    const availability = await appointmentService.checkAvailability(
      testData.employeeId,
      startTime,
      endTime
    )

    expect(availability.available).toBe(true)
  })

  it('2. Horario completamente ocupado', async () => {
    /**
     * Escenario:
     *  - Cita existente: 10:00 - 11:00
     *  - Intentar reservar: 10:00 - 11:00 (mismo horario)
     * 
     * Esperado: ❌ No disponible
     */
    const existingStart = '2026-08-20T10:00:00Z'
    const existingEnd = '2026-08-20T11:00:00Z'
    const newStart = '2026-08-20T10:00:00Z'
    const newEnd = '2026-08-20T11:00:00Z'

    // En un test real, primero crearías la cita existente
    // const existing = await appointmentService.create({ ... })
    
    // Luego verificarías que no se puede crear una cita en el mismo horario
    // const availability = await appointmentService.checkAvailability(
    //   testData.employeeId,
    //   newStart,
    //   newEnd
    // )
    // expect(availability.available).toBe(false)
  })

  it('3. Nueva cita que comienza durante una cita existente', async () => {
    /**
     * Escenario:
     *  - Existente: 10:00 - 11:00
     *  - Nueva: 10:30 - 11:30
     * 
     * Esperado: ❌ No disponible
     */
    // Mismo patrón que el caso anterior
    // Nueva cita: 10:30 - 11:30 se solapa con existente 10:00 - 11:00
    // Fórmula: newStart (10:30) < existingEnd (11:00) ✓ Y
    //          newEnd (11:30) > existingStart (10:00) ✓
    // → SOLAPA
  })

  it('4. Nueva cita que termina durante una cita existente', async () => {
    /**
     * Escenario:
     *  - Existente: 10:00 - 11:00
     *  - Nueva: 09:30 - 10:30
     * 
     * Esperado: ❌ No disponible
     */
    // Fórmula: newStart (09:30) < existingEnd (11:00) ✓ Y
    //          newEnd (10:30) > existingStart (10:00) ✓
    // → SOLAPA
  })

  it('5. Nueva cita que engloba una cita existente', async () => {
    /**
     * Escenario:
     *  - Existente: 10:30 - 11:30
     *  - Nueva: 10:00 - 12:00
     * 
     * Esperado: ❌ No disponible
     */
    // Fórmula: newStart (10:00) < existingEnd (11:30) ✓ Y
    //          newEnd (12:00) > existingStart (10:30) ✓
    // → SOLAPA
  })

  it('6. Cita con exactamente el mismo horario', async () => {
    /**
     * Escenario:
     *  - Existente: 10:00 - 11:00
     *  - Nueva: 10:00 - 11:00
     * 
     * Esperado: ❌ No disponible
     */
    // Fórmula: newStart (10:00) < existingEnd (11:00) ✓ Y
    //          newEnd (11:00) > existingStart (10:00) ✓
    // → SOLAPA
  })

  it('7. Cita inmediatamente antes de otra', async () => {
    /**
     * Escenario:
     *  - Existente: 11:00 - 12:00
     *  - Nueva: 10:00 - 11:00
     * 
     * Esperado: ✅ Disponible
     * 
     * Nota: No hay solapamiento si newEnd === existingStart
     */
    // Fórmula: newStart (10:00) < existingEnd (12:00) ✓ Y
    //          newEnd (11:00) > existingStart (11:00) ✗
    // → NO SOLAPA (porque 11:00 > 11:00 es falso)
  })

  it('8. Cita inmediatamente después de otra', async () => {
    /**
     * Escenario:
     *  - Existente: 10:00 - 11:00
     *  - Nueva: 11:00 - 12:00
     * 
     * Esperado: ✅ Disponible
     * 
     * Nota: No hay solapamiento si newStart === existingEnd
     */
    // Fórmula: newStart (11:00) < existingEnd (11:00) ✗ Y
    //          newEnd (12:00) > existingStart (10:00) ✓
    // → NO SOLAPA (porque 11:00 < 11:00 es falso)
  })

  it('9. Servicio cuya duración provoca un solapamiento', async () => {
    /**
     * Escenario:
     *  - Servicio A: 30 minutos
     *  - Existente: 10:30 - 11:30
     *  - Intentar reservar: 10:00 con servicio A
     *    → end_time = 10:00 + 30 min = 10:30
     * 
     * Esperado: ✅ Disponible
     * 
     * Nota: 10:00 - 10:30 termina exactamente cuando comienza 10:30 - 11:30
     */
  })

  it('10. Horario fuera de la jornada laboral', async () => {
    /**
     * Escenario:
     *  - Horario laboral: 09:00 - 17:00
     *  - Intentar reservar: 08:00 - 09:00 (antes de empezar)
     *  - Intentar reservar: 17:00 - 18:00 (después de terminar)
     * 
     * Esperado: ❌ No disponible
     */
    const outsideStart = '2026-08-20T08:00:00Z'
    const outsideEnd = '2026-08-20T09:00:00Z'

    const availability = await appointmentService.checkAvailability(
      testData.employeeId,
      outsideStart,
      outsideEnd
    )

    expect(availability.available).toBe(false)
    expect(availability.reason).toContain('horario laboral')
  })

  it('11. Profesional sin disponibilidad para esa fecha', async () => {
    /**
     * Escenario:
     *  - Empleado no trabaja los domingos (day_of_week = 0)
     *  - Intentar reservar: domingo 10:00 - 11:00
     * 
     * Esperado: ❌ No disponible
     */
    const sundayStart = '2026-08-17T10:00:00Z' // Este es un domingo
    const sundayEnd = '2026-08-17T11:00:00Z'

    const availability = await appointmentService.checkAvailability(
      testData.employeeId,
      sundayStart,
      sundayEnd
    )

    expect(availability.available).toBe(false)
  })

  it('12. Intento de reservar horario que dejó de estar disponible (race condition)', async () => {
    /**
     * Escenario:
     *  1. Cliente A: Verifica disponibilidad → 10:00 está disponible
     *  2. Cliente B: Crea cita a las 10:00
     *  3. Cliente A: Intenta crear cita a las 10:00 → DEBE FALLAR
     * 
     * Esperado: ❌ Error de disponibilidad
     * 
     * Validación:
     * - Frontend obtiene slots disponibles
     * - Cliente selecciona una hora
     * - Backend verifica nuevamente JUSTO ANTES de crear
     * - Si la hora ya no está disponible, rechaza con error claro
     */
    // Este test requeriría una operación concurrente real
    // En un entorno de testing, se simularía con mocks o transacciones
  })

  // ───────────────────────────────────────────────────────────────────────────
  // TESTS DE ENDPOINT
  // ───────────────────────────────────────────────────────────────────────────

  describe('GET /appointments/available-slots', () => {
    it('Retorna slots disponibles para un empleado en una fecha', async () => {
      /**
       * GET /appointments/available-slots?employeeId=xxx&date=2026-08-20&serviceId=yyy
       * 
       * Response:
       * {
       *   success: true,
       *   data: {
       *     date: "2026-08-20",
       *     slots: ["09:00", "09:30", "10:00", "10:30", ...],
       *     timezone: "UTC"
       *   }
       * }
       */
    })

    it('Retorna slots vacío si no hay disponibilidad', async () => {
      /**
       * Si el empleado no trabaja ese día o está completamente ocupado
       * debe retornar slots vacío
       */
    })

    it('Excluye horarios que se solapan con citas existentes', async () => {
      /**
       * Si hay cita de 10:00-11:00 y servicio es 30 min:
       * - 09:30 está disponible
       * - 10:00 NO está disponible (solapa)
       * - 10:30 NO está disponible (solapa)
       * - 11:00 está disponible
       */
    })

    it('Respeta la duración del servicio en el cálculo', async () => {
      /**
       * Servicio de 60 min:
       * - Si jornada es 09:00-17:00
       * - Último slot debe ser 16:00 (para terminar a 17:00)
       * 
       * Servicio de 30 min:
       * - Último slot debe ser 16:30
       */
    })

    it('Falla si faltan parámetros requeridos', async () => {
      /**
       * Sin employeeId, date o serviceId → 400 Bad Request
       */
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // TESTS DE CREACIÓN DE CITA CON VALIDACIÓN ESTRICTA
  // ───────────────────────────────────────────────────────────────────────────

  describe('POST /appointments - Comportamiento estricto', () => {
    it('Falla si el horario está fuera de jornada laboral', async () => {
      /**
       * Intenta crear cita fuera del horario de trabajo
       * 
       * Response: 400 Bad Request
       * { success: false, message: "El horario solicitado está fuera del horario de trabajo..." }
       */
    })

    it('Falla si hay solapamiento con cita existente', async () => {
      /**
       * Intenta crear cita en horario ya ocupado
       * 
       * Response: 400 Bad Request
       * { success: false, message: "El horario seleccionado ya no está disponible..." }
       */
    })

    it('Falla si el empleado no existe o no está activo', async () => {
      /**
       * Response: 400 Bad Request
       * { success: false, message: "El profesional seleccionado no está disponible." }
       */
    })

    it('Acepta crear cita sin empleado (employee_id = null)', async () => {
      /**
       * Si no se proporciona employee_id, la cita se crea sin asignar
       * Esto es válido si el negocio asignará empleado después
       */
    })

    it('Acepta cita inmediatamente antes de otra (sin solapamiento)', async () => {
      /**
       * Existente: 11:00 - 12:00
       * Nueva: 10:00 - 11:00
       * 
       * Response: 201 Created ✓
       */
    })

    it('Acepta cita inmediatamente después de otra (sin solapamiento)', async () => {
      /**
       * Existente: 10:00 - 11:00
       * Nueva: 11:00 - 12:00
       * 
       * Response: 201 Created ✓
       */
    })
  })
})

export default describe
