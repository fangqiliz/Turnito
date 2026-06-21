import supabase from '../../config/supabase.js';
import ApiError from '../../utils/apiError.js';

/**
 * Convierte "HH:MM" o "HH:MM:SS" a minutos desde medianoche.
 * Necesario para la detección de solapamientos en JavaScript
 * (sin depender exclusivamente del constraint de Postgres).
 *
 * @param {string} t - Hora en formato HH:MM o HH:MM:SS
 * @returns {number} Minutos desde medianoche
 */
const timeToMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Determina si dos rangos de tiempo se solapan.
 * Solapamiento: (start1 < end2) AND (start2 < end1)
 * Un turno que termina exactamente cuando empieza el siguiente NO se solapa.
 *
 * @param {string} s1 - start_time del intervalo 1
 * @param {string} e1 - end_time del intervalo 1
 * @param {string} s2 - start_time del intervalo 2
 * @param {string} e2 - end_time del intervalo 2
 * @returns {boolean}
 */
const hasOverlap = (s1, e1, s2, e2) => {
  const [a, b, c, d] = [s1, e1, s2, e2].map(timeToMinutes);
  return a < d && c < b;
};

// ─────────────────────────────────────────────────────────────────────────────
// Servicio
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Servicio del módulo Schedules.
 *
 * Garantías de integridad:
 *  – El negocio debe existir (multi-tenant guard).
 *  – El empleado debe pertenecer al negocio.
 *  – No se permiten horarios solapados para el mismo empleado en el mismo día.
 *    La detección se hace en JS (pre-check) y el constraint UNIQUE de Postgres
 *    actúa como red de seguridad ante condiciones de carrera.
 *  – Solo el propietario del negocio puede gestionar horarios.
 */
class ScheduleService {
  // ──────────────────────────────────────────────────────────────
  // Helpers privados
  // ──────────────────────────────────────────────────────────────

  /**
   * Verifica que el negocio exista y retorna su registro.
   * @private
   */
  async #assertBusinessExists(businessId) {
    const { data: business, error } = await supabase
      .from('businesses')
      .select('id, owner_id, name')
      .eq('id', businessId)
      .single();

    if (error || !business) {
      throw ApiError.notFound(`El negocio con id "${businessId}" no existe.`);
    }

    return business;
  }

  /**
   * Verifica que el empleado exista y pertenezca al negocio indicado.
   * @private
   */
  async #assertEmployeeBelongsToBusiness(employeeId, businessId) {
    const { data: employee, error } = await supabase
      .from('employees')
      .select('id, business_id, full_name, is_active')
      .eq('id', employeeId)
      .eq('business_id', businessId)
      .single();

    if (error || !employee) {
      throw ApiError.notFound(
        `El empleado con id "${employeeId}" no existe en este negocio.`
      );
    }

    return employee;
  }

  /**
   * Verifica que el horario exista dentro del contexto del tenant.
   * @private
   */
  async #assertScheduleExists(scheduleId, businessId) {
    const { data: schedule, error } = await supabase
      .from('schedules')
      .select('id, business_id, employee_id, day_of_week, start_time, end_time, is_active')
      .eq('id', scheduleId)
      .eq('business_id', businessId)
      .single();

    if (error || !schedule) {
      throw ApiError.notFound(
        `El horario con id "${scheduleId}" no existe en este negocio.`
      );
    }

    return schedule;
  }

  /**
   * Verifica que el solicitante sea el propietario del negocio.
   * @private
   */
  #assertIsOwner(business, requesterId) {
    if (business.owner_id !== requesterId) {
      throw ApiError.forbidden(
        'Solo el propietario del negocio puede gestionar los horarios.'
      );
    }
  }

  /**
   * Detecta solapamientos de horario para un empleado en un día específico.
   * Excluye opcionalmente el scheduleId actual (para updates).
   *
   * @private
   * @param {string}      employeeId    - UUID del empleado
   * @param {number}      dayOfWeek     - 0-6
   * @param {string}      startTime     - HH:MM
   * @param {string}      endTime       - HH:MM
   * @param {string|null} excludeId     - scheduleId a excluir (update)
   */
  async #assertNoOverlap(employeeId, dayOfWeek, startTime, endTime, excludeId = null) {
    // Obtener todos los horarios activos del empleado en ese día
    let query = supabase
      .from('schedules')
      .select('id, start_time, end_time')
      .eq('employee_id', employeeId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data: existing, error } = await query;

    if (error) {
      throw ApiError.internal(`Error al verificar solapamientos: ${error.message}`);
    }

    const conflict = existing?.find((s) =>
      hasOverlap(startTime, endTime, s.start_time, s.end_time)
    );

    if (conflict) {
      throw ApiError.badRequest(
        `El horario ${startTime}–${endTime} se solapa con uno existente ` +
        `(${conflict.start_time}–${conflict.end_time}) para este empleado el día ${dayOfWeek}.`
      );
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Métodos públicos
  // ──────────────────────────────────────────────────────────────

  /**
   * Crea un nuevo horario para un empleado de un negocio.
   *
   * @param {object} payload     - Datos validados por Zod
   * @param {string} requesterId - UUID del usuario autenticado
   * @param {object} [authenticatedClient] - Cliente Supabase autenticado con JWT del usuario (para RLS)
   * @returns {Promise<object>}  Horario creado
   */
  async create(payload, requesterId, authenticatedClient = null) {
    const client = authenticatedClient ?? supabase;
    const { business_id, employee_id, day_of_week, start_time, end_time, is_active } = payload;

    // 1. Validar negocio + ownership
    const business = await this.#assertBusinessExists(business_id);
    this.#assertIsOwner(business, requesterId);

    // 2. Validar que el empleado pertenezca al negocio
    await this.#assertEmployeeBelongsToBusiness(employee_id, business_id);

    // 3. Detectar solapamientos
    await this.#assertNoOverlap(employee_id, day_of_week, start_time, end_time);

    // 4. Insertar
    const { data: schedule, error } = await client
      .from('schedules')
      .insert({
        business_id,
        employee_id,
        day_of_week,
        start_time,
        end_time,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      // Violación del UNIQUE constraint (employee_id, day_of_week, start_time)
      if (error.code === '23505') {
        throw ApiError.badRequest(
          'Ya existe un horario con la misma hora de inicio para este empleado en ese día.'
        );
      }
      throw ApiError.internal(`Error al crear el horario: ${error.message}`);
    }

    return schedule;
  }

  /**
   * Lista todos los horarios de un negocio, agrupados por empleado.
   * Incluye datos del empleado para contexto.
   *
   * @param {string} businessId  - UUID del negocio
   * @returns {Promise<object[]>}
   */
  async findByBusiness(businessId) {
    await this.#assertBusinessExists(businessId);

    const { data: schedules, error } = await supabase
      .from('schedules')
      .select(`
        id,
        business_id,
        employee_id,
        day_of_week,
        start_time,
        end_time,
        is_active,
        created_at,
        updated_at,
        employee:employee_id (
          id,
          full_name,
          specialty,
          is_active
        )
      `)
      .eq('business_id', businessId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      throw ApiError.internal(`Error al obtener los horarios: ${error.message}`);
    }

    return schedules;
  }

  /**
   * Actualiza un horario existente.
   * Re-valida solapamientos excluyendo el propio registro.
   * Si se actualizan solo start_time o end_time (pero no ambos), los combina
   * con los valores actuales para una validación correcta del rango.
   *
   * @param {string} scheduleId  - UUID del horario
   * @param {string} businessId  - UUID del negocio (tenant)
   * @param {object} payload     - Campos a actualizar
   * @param {string} requesterId - UUID del usuario autenticado
   * @param {object} [authenticatedClient] - Cliente Supabase autenticado con JWT del usuario (para RLS)
   * @returns {Promise<object>}  Horario actualizado
   */
  async update(scheduleId, businessId, payload, requesterId, authenticatedClient = null) {
    const client = authenticatedClient ?? supabase;
    // 1. Validar negocio + ownership
    const business = await this.#assertBusinessExists(businessId);
    this.#assertIsOwner(business, requesterId);

    // 2. Obtener horario actual (necesario para combinar tiempos parciales)
    const current = await this.#assertScheduleExists(scheduleId, businessId);

    // 3. Si cambia día/hora, re-validar solapamientos
    const newDay       = payload.day_of_week ?? current.day_of_week;
    const newStart     = payload.start_time  ?? current.start_time;
    const newEnd       = payload.end_time    ?? current.end_time;
    const timesChanged = payload.day_of_week !== undefined ||
                         payload.start_time  !== undefined ||
                         payload.end_time    !== undefined;

    if (timesChanged) {
      // Validar que end > start con los valores resultantes
      const s = newStart.slice(0, 5); // normalizar a HH:MM
      const e = newEnd.slice(0, 5);
      const [sm, em] = [s, e].map((t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      });

      if (em <= sm) {
        throw ApiError.badRequest(
          'La hora de fin (end_time) debe ser posterior a la hora de inicio (start_time).'
        );
      }

      await this.#assertNoOverlap(
        current.employee_id,
        newDay,
        newStart,
        newEnd,
        scheduleId   // excluir el propio registro
      );
    }

    // 4. Actualizar
    const { data: updated, error } = await client
      .from('schedules')
      .update(payload)
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw ApiError.badRequest(
          'Ya existe un horario con la misma hora de inicio para este empleado en ese día.'
        );
      }
      throw ApiError.internal(`Error al actualizar el horario: ${error.message}`);
    }

    return updated;
  }

  /**
   * Elimina un horario del negocio (hard delete).
   * No se usa soft delete aquí porque el campo is_active ya cumple esa función
   * y se puede gestionar vía PUT /schedules/:id { is_active: false }.
   *
   * @param {string} scheduleId  - UUID del horario
   * @param {string} businessId  - UUID del negocio (tenant)
   * @param {string} requesterId - UUID del usuario autenticado
   * @param {object} [authenticatedClient] - Cliente Supabase autenticado con JWT del usuario (para RLS)
   * @returns {Promise<true>}
   */
  async remove(scheduleId, businessId, requesterId, authenticatedClient = null) {
    const client = authenticatedClient ?? supabase;
    // 1. Validar negocio + ownership
    const business = await this.#assertBusinessExists(businessId);
    this.#assertIsOwner(business, requesterId);

    // 2. Validar existencia del horario en el tenant
    await this.#assertScheduleExists(scheduleId, businessId);

    // 3. Eliminar
    const { error } = await client
      .from('schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) {
      throw ApiError.internal(`Error al eliminar el horario: ${error.message}`);
    }

    return true;
  }
}

export default new ScheduleService();
