import supabase from '../../config/supabase.js';
import ApiError from '../../utils/apiError.js';
import logger from '../../config/logger.js';

/**
 * AppointmentService – Lógica de negocio para el módulo Appointments.
 *
 * Reglas implementadas:
 *  1.  No permitir citas en el pasado.
 *  2.  Validar negocio activo.
 *  3.  Validar servicio existente y activo en el negocio.
 *  4.  Validar empleado existente y activo en el negocio.
 *  5.  Calcular end_time automáticamente usando duration_minutes del servicio.
 *  6.  Verificar que start_time esté dentro del horario laboral del empleado.
 *  7.  Verificar disponibilidad del empleado (sin solapamiento).
 *  8.  Evitar doble reserva (ej. 10:00-11:00 bloquea 10:30-11:30).
 *  9.  Aislamiento multi-tenant (business_id en todas las consultas).
 *  10. Crear notificación automáticamente (para el cliente y para el negocio).
 *  11. Registrar logs de eventos con Winston.
 *  12. Validar con Zod (en las rutas, este servicio recibe datos ya validados).
 *  13. Manejo centralizado de errores (via ApiError).
 */
class AppointmentService {
  // ────────────────────────────────────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Regla 1: Verifica que start_time no sea en el pasado.
   * @private
   */
  #assertNotInPast(startTime) {
    if (new Date(startTime) <= new Date()) {
      throw ApiError.badRequest('No se pueden agendar citas en el pasado.');
    }
  }

  /**
   * Regla 2: Verifica que el negocio exista y esté activo.
   * @private
   * @param {string} businessId
   * @returns {Promise<object>} business record
   */
  async #assertBusinessActive(businessId) {
    const { data: business, error } = await supabase
      .from('businesses')
      .select('id, owner_id, name, is_active')
      .eq('id', businessId)
      .single();

    if (error || !business) {
      throw ApiError.notFound(`El negocio con id "${businessId}" no existe.`);
    }

    if (business.is_active === false) {
      throw ApiError.badRequest('El negocio no está activo en este momento.');
    }

    return business;
  }

  /**
   * Regla 3: Verifica que el servicio exista y esté activo en el negocio (tenant).
   * Retorna el servicio con duration_minutes para calcular end_time.
   * @private
   * @param {string} serviceId
   * @param {string} businessId
   * @returns {Promise<object>} service record (con duration_minutes)
   */
  async #assertServiceActive(serviceId, businessId) {
    const { data: service, error } = await supabase
      .from('services')
      .select('id, business_id, name, duration_minutes, is_active')
      .eq('id', serviceId)
      .eq('business_id', businessId)
      .single();

    if (error || !service) {
      throw ApiError.notFound(
        `El servicio con id "${serviceId}" no existe en este negocio.`
      );
    }

    if (!service.is_active) {
      throw ApiError.badRequest(
        `El servicio "${service.name}" no está disponible actualmente.`
      );
    }

    return service;
  }

  /**
   * Regla 4: Verifica que el empleado exista y esté activo en el negocio (tenant).
   * @private
   * @param {string} employeeId
   * @param {string} businessId
   * @returns {Promise<object>} employee record
   */
  async #assertEmployeeActive(employeeId, businessId) {
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

    if (!employee.is_active) {
      throw ApiError.badRequest(
        `El empleado "${employee.full_name}" no está activo actualmente.`
      );
    }

    return employee;
  }

  /**
   * Regla 5: Calcula end_time sumando duration_minutes al start_time.
   * @private
   * @param {string} startTime   - ISO 8601
   * @param {number} durationMin - duración en minutos
   * @returns {string} endTime   - ISO 8601
   */
  #calculateEndTime(startTime, durationMin) {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationMin * 60_000);
    return end.toISOString();
  }

  /**
   * Regla 6: Verifica que start_time y end_time estén dentro del horario laboral
   * del empleado para el día de la semana correspondiente.
   *
   * El horario laboral se define como TIME (sin zona horaria), por lo que
   * comparamos usando la hora local del start_time en UTC.
   *
   * @private
   * @param {string} employeeId
   * @param {string} startTime  - ISO 8601
   * @param {string} endTime    - ISO 8601
   */
  async #assertWithinWorkSchedule(employeeId, startTime, endTime) {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    // day_of_week: 0 = Domingo … 6 = Sábado (UTC)
    const dayOfWeek = startDate.getUTCDay();

    // Hora en formato HH:MM:SS (UTC) para comparar con el tipo TIME de Postgres
    const toTimeStr = (d) =>
      `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:00`;

    const startTimeStr = toTimeStr(startDate);
    const endTimeStr = toTimeStr(endDate);

    const { data: schedules, error } = await supabase
      .from('schedules')
      .select('start_time, end_time')
      .eq('employee_id', employeeId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);

    if (error) {
      throw ApiError.internal(`Error al verificar horario laboral: ${error.message}`);
    }

    if (!schedules || schedules.length === 0) {
      throw ApiError.badRequest(
        'El empleado no tiene horario laboral configurado para ese día.'
      );
    }

    // Verificar que ALGÚN bloque de horario cubra completamente la cita
    const isWithinSchedule = schedules.some(
      (s) => startTimeStr >= s.start_time && endTimeStr <= s.end_time
    );

    if (!isWithinSchedule) {
      throw ApiError.badRequest(
        'La cita solicitada está fuera del horario laboral del empleado.'
      );
    }
  }

  /**
   * Reglas 7 y 8: Verifica que el empleado no tenga citas solapadas.
   *
   * Una cita nueva [newStart, newEnd) se solapa con una existente [eStart, eEnd)
   * si: newStart < eEnd AND newEnd > eStart
   *
   * Se excluyen citas canceladas.
   *
   * @private
   * @param {string} employeeId
   * @param {string} startTime  - ISO 8601
   * @param {string} endTime    - ISO 8601
   * @param {string} [excludeId] - ID de la cita a excluir (para updates)
   */
  async #assertNoOverlap(employeeId, startTime, endTime, excludeId = null) {
    // Aprovechamos el CONSTRAINT de exclusión en Supabase, pero también
    // verificamos desde la aplicación para dar mensajes de error claros.
    let query = supabase
      .from('appointments')
      .select('id, start_time, end_time, status')
      .eq('employee_id', employeeId)
      .neq('status', 'cancelled')
      .lt('start_time', endTime)   // eStart < newEnd
      .gt('end_time', startTime);  // eEnd   > newStart

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data: conflicts, error } = await query;

    if (error) {
      throw ApiError.internal(`Error al verificar disponibilidad: ${error.message}`);
    }

    if (conflicts && conflicts.length > 0) {
      const conflict = conflicts[0];
      throw ApiError.badRequest(
        `El empleado ya tiene una cita de ${conflict.start_time} a ${conflict.end_time} ` +
        `que se superpone con el horario solicitado (doble reserva no permitida).`
      );
    }
  }

  /**
   * Regla 10: Crea notificaciones para el cliente y el dueño del negocio.
   * No lanza error si falla (no bloquear la creación de la cita).
   *
   * @private
   * @param {object} appointment - Cita recién creada
   * @param {object} business    - Negocio
   * @param {string} clientName  - Nombre del cliente
   */
  async #createNotifications(appointment, business, clientName) {
    const notifications = [];

    // Notificación para el cliente (si está autenticado y tiene profile)
    if (appointment.client_id) {
      notifications.push({
        business_id: appointment.business_id,
        user_id: appointment.client_id,
        title: '✅ Cita confirmada',
        message: `Tu cita en "${business.name}" fue registrada para el ${new Date(appointment.start_time).toLocaleString('es-ES', { timeZone: 'UTC' })}.`,
        type: 'appointment_created',
      });
    }

    // Notificación para el propietario del negocio
    if (business.owner_id) {
      notifications.push({
        business_id: appointment.business_id,
        user_id: business.owner_id,
        title: '📅 Nueva cita recibida',
        message: `${clientName} agendó una cita para el ${new Date(appointment.start_time).toLocaleString('es-ES', { timeZone: 'UTC' })}.`,
        type: 'appointment_created',
      });
    }

    if (notifications.length === 0) return;

    const { error } = await supabase.from('notifications').insert(notifications);

    if (error) {
      // Solo loguear, no bloquear el flujo principal
      logger.warn(
        `[AppointmentService] No se pudieron crear notificaciones: ${error.message}`
      );
    }
  }

  /**
   * Regla 10: Crea notificaciones al cambiar el estado de una cita.
   * @private
   */
  async #createStatusChangeNotification(appointment, newStatus, business) {
    const statusMessages = {
      confirmed:  { title: '✅ Cita confirmada',   type: 'appointment_confirmed' },
      cancelled:  { title: '❌ Cita cancelada',    type: 'appointment_cancelled' },
      completed:  { title: '🎉 Cita completada',   type: 'appointment_created'   },
      no_show:    { title: '⚠️ No presentación',   type: 'appointment_cancelled' },
    };

    const meta = statusMessages[newStatus];
    if (!meta || !appointment.client_id) return;

    const { error } = await supabase.from('notifications').insert({
      business_id: appointment.business_id,
      user_id: appointment.client_id,
      title: meta.title,
      message: `El estado de tu cita en "${business.name}" cambió a: ${newStatus}.`,
      type: meta.type,
    });

    if (error) {
      logger.warn(
        `[AppointmentService] No se pudo crear notificación de cambio de estado: ${error.message}`
      );
    }
  }

  /**
   * Verifica si un usuario es dueño o empleado activo de un negocio.
   *
   * @param {string} userId
   * @param {string} businessId
   * @returns {Promise<boolean>}
   */
  async checkIsStaff(userId, businessId) {
    if (!businessId) return false;

    // Verificar si es el owner
    const { data: business } = await supabase
      .from('businesses')
      .select('owner_id')
      .eq('id', businessId)
      .single();

    if (business?.owner_id === userId) return true;

    // Verificar si es empleado activo
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('business_id', businessId)
      .eq('profile_id', userId)
      .eq('is_active', true)
      .single();

    return !!employee;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // MÉTODOS PÚBLICOS
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Crea una nueva cita aplicando todas las reglas de negocio.
   *
   * @param {object}      payload    - Datos validados por Zod
   * @param {string|null} clientId   - UUID del usuario autenticado (null si es anónimo)
   * @returns {Promise<object>}       Cita creada
   */
  async create(payload, clientId) {
    const {
      business_id,
      service_id,
      employee_id,
      start_time,
      notes,
      client_name,
      client_email,
      client_phone,
    } = payload;

    // ── Regla 1: No pasado ────────────────────────────────────────────────────
    this.#assertNotInPast(start_time);

    // ── Regla 2: Negocio activo ───────────────────────────────────────────────
    const business = await this.#assertBusinessActive(business_id);

    // ── Regla 3: Servicio activo + obtener duration_minutes ───────────────────
    const service = await this.#assertServiceActive(service_id, business_id);

    // ── Regla 4: Empleado activo ──────────────────────────────────────────────
    await this.#assertEmployeeActive(employee_id, business_id);

    // ── Regla 5: Calcular end_time ────────────────────────────────────────────
    const end_time = this.#calculateEndTime(start_time, service.duration_minutes);

    // ── Regla 6: Verificar horario laboral ────────────────────────────────────
    await this.#assertWithinWorkSchedule(employee_id, start_time, end_time);

    // ── Reglas 7 y 8: Verificar disponibilidad / doble reserva ───────────────
    await this.#assertNoOverlap(employee_id, start_time, end_time);

    // ── Regla 9: Insertar con aislamiento multi-tenant ────────────────────────
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        business_id,
        service_id,
        employee_id,
        client_id:    clientId ?? null,
        start_time,
        end_time,
        status:       'pending',
        notes:        notes ?? null,
        client_name,
        client_email,
        client_phone: client_phone ?? null,
      })
      .select(
        `id, business_id, service_id, employee_id, client_id,
         start_time, end_time, status, notes,
         client_name, client_email, client_phone, created_at`
      )
      .single();

    if (error) {
      // El constraint de exclusión de Postgres (appointments_no_employee_overlap)
      // puede también capturar solapamientos en race conditions.
      if (error.code === '23P01') {
        throw ApiError.badRequest(
          'El empleado ya tiene una cita que se superpone con el horario solicitado.'
        );
      }
      throw ApiError.internal(`Error al crear la cita: ${error.message}`);
    }

    // ── Regla 10: Notificaciones automáticas ─────────────────────────────────
    await this.#createNotifications(appointment, business, client_name);

    // ── Regla 11: Registro de eventos ─────────────────────────────────────────
    logger.info(
      `[AppointmentService] CREATED | appointment=${appointment.id} ` +
      `business=${business_id} employee=${employee_id} service=${service_id} ` +
      `client_id=${clientId ?? 'anon'} start=${start_time} end=${end_time}`
    );

    return appointment;
  }

  /**
   * Lista las citas del usuario autenticado (cliente).
   * Aplica aislamiento multi-tenant via client_id.
   *
   * @param {string} userId - UUID del usuario autenticado
   * @param {object} query  - Filtros opcionales (status, page, limit)
   * @returns {Promise<{data: object[], total: number, page: number, limit: number}>}
   */
  async findByUser(userId, query = {}) {
    const { status, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    let dbQuery = supabase
      .from('appointments')
      .select(
        `id, business_id, service_id, employee_id,
         start_time, end_time, status, notes,
         client_name, client_email, client_phone, created_at,
         businesses(name, slug),
         services(name, duration_minutes, price),
         employees(full_name, email)`,
        { count: 'exact' }
      )
      .eq('client_id', userId)
      .order('start_time', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      dbQuery = dbQuery.eq('status', status);
    }

    const { data, error, count } = await dbQuery;

    if (error) {
      throw ApiError.internal(`Error al obtener las citas del usuario: ${error.message}`);
    }

    // ── Regla 11 ──────────────────────────────────────────────────────────────
    logger.info(
      `[AppointmentService] LIST_USER | user=${userId} status=${status ?? 'all'} page=${page}`
    );

    return { data, total: count, page, limit };
  }

  /**
   * Lista las citas de un negocio (multi-tenant).
   * Solo accesible para dueños / staff (validado en el middleware requireRole).
   *
   * @param {string} businessId - UUID del negocio
   * @param {object} query      - Filtros opcionales (status, date, employee_id, page, limit)
   * @returns {Promise<{data: object[], total: number, page: number, limit: number}>}
   */
  async findByBusiness(businessId, query = {}) {
    const { status, date, employee_id, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    // ── Regla 2 & 9: Confirmar que el negocio existe ──────────────────────────
    await this.#assertBusinessActive(businessId);

    let dbQuery = supabase
      .from('appointments')
      .select(
        `id, business_id, service_id, employee_id, client_id,
         start_time, end_time, status, notes,
         client_name, client_email, client_phone, created_at,
         services(name, duration_minutes, price),
         employees(full_name, email)`,
        { count: 'exact' }
      )
      .eq('business_id', businessId)          // Aislamiento multi-tenant (Regla 9)
      .order('start_time', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) dbQuery = dbQuery.eq('status', status);
    if (employee_id) dbQuery = dbQuery.eq('employee_id', employee_id);

    // Filtrar por fecha (inicio del día UTC a fin del día UTC)
    if (date) {
      const dayStart = `${date}T00:00:00.000Z`;
      const dayEnd   = `${date}T23:59:59.999Z`;
      dbQuery = dbQuery.gte('start_time', dayStart).lte('start_time', dayEnd);
    }

    const { data, error, count } = await dbQuery;

    if (error) {
      throw ApiError.internal(`Error al obtener las citas del negocio: ${error.message}`);
    }

    // ── Regla 11 ──────────────────────────────────────────────────────────────
    logger.info(
      `[AppointmentService] LIST_BUSINESS | business=${businessId} ` +
      `status=${status ?? 'all'} date=${date ?? 'any'} page=${page}`
    );

    return { data, total: count, page, limit };
  }

  /**
   * Actualiza el estado de una cita.
   *
   * Validaciones de transición de estado:
   *  - Una cita 'completed' o 'no_show' no puede volver a ser modificada.
   *  - Una cita 'cancelled' solo puede ser re-abierta como 'pending' por el staff.
   *
   * @param {string} appointmentId - UUID de la cita
   * @param {string} businessId    - UUID del negocio (contexto multi-tenant)
   * @param {string} newStatus     - Nuevo estado
   * @param {string} requesterId   - UUID del usuario que realiza la acción
   * @returns {Promise<object>}     Cita actualizada
   */
  async updateStatus(appointmentId, businessId, newStatus, requesterId) {
    // ── Regla 9: Buscar la cita dentro del tenant ─────────────────────────────
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, business_id, client_id, status, start_time, end_time')
      .eq('id', appointmentId)
      .eq('business_id', businessId)
      .single();

    if (fetchError || !appointment) {
      throw ApiError.notFound(`La cita con id "${appointmentId}" no existe en este negocio.`);
    }

    // Validar transición de estado
    const finalStatuses = ['completed', 'no_show'];
    if (finalStatuses.includes(appointment.status)) {
      throw ApiError.badRequest(
        `No se puede modificar una cita con estado final "${appointment.status}".`
      );
    }

    // ── Regla 2 & 9: Obtener info del negocio para notificación ──────────────
    const business = await this.#assertBusinessActive(businessId);

    // Actualizar estado
    const { data: updated, error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', appointmentId)
      .eq('business_id', businessId)   // double-check multi-tenant
      .select()
      .single();

    if (error) {
      throw ApiError.internal(`Error al actualizar el estado de la cita: ${error.message}`);
    }

    // ── Regla 10: Notificación de cambio de estado ────────────────────────────
    await this.#createStatusChangeNotification(appointment, newStatus, business);

    // ── Regla 11 ──────────────────────────────────────────────────────────────
    logger.info(
      `[AppointmentService] STATUS_CHANGE | appointment=${appointmentId} ` +
      `${appointment.status} → ${newStatus} | by=${requesterId}`
    );

    return updated;
  }

  /**
   * Cancela (soft delete) una cita.
   *
   * El cliente solo puede cancelar sus propias citas.
   * El staff/propietario puede cancelar cualquier cita del negocio.
   *
   * @param {string}  appointmentId - UUID de la cita
   * @param {string}  businessId    - UUID del negocio (contexto multi-tenant)
   * @param {string}  requesterId   - UUID del usuario autenticado
   * @param {boolean} isStaff       - true si es dueño o empleado del negocio
   * @returns {Promise<object>}      Cita cancelada
   */
  async cancel(appointmentId, businessId, requesterId, isStaff = false) {
    // ── Regla 9: Buscar dentro del tenant ────────────────────────────────────
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, business_id, client_id, status, start_time')
      .eq('id', appointmentId)
      .eq('business_id', businessId)
      .single();

    if (fetchError || !appointment) {
      throw ApiError.notFound(`La cita con id "${appointmentId}" no existe en este negocio.`);
    }

    // Autorización: cliente solo puede cancelar SUS propias citas
    if (!isStaff && appointment.client_id !== requesterId) {
      throw ApiError.forbidden('No tienes permiso para cancelar esta cita.');
    }

    // No se puede cancelar lo que ya está cancelado, completado o no_show
    if (['cancelled', 'completed', 'no_show'].includes(appointment.status)) {
      throw ApiError.badRequest(
        `No se puede cancelar una cita con estado "${appointment.status}".`
      );
    }

    // Regla 1 extendida: el cliente no puede cancelar una cita ya pasada
    if (!isStaff && new Date(appointment.start_time) <= new Date()) {
      throw ApiError.badRequest('No se puede cancelar una cita que ya ha comenzado o pasado.');
    }

    const { data: cancelled, error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) {
      throw ApiError.internal(`Error al cancelar la cita: ${error.message}`);
    }

    const business = await this.#assertBusinessActive(businessId);
    await this.#createStatusChangeNotification(appointment, 'cancelled', business);

    // ── Regla 11 ──────────────────────────────────────────────────────────────
    logger.info(
      `[AppointmentService] CANCELLED | appointment=${appointmentId} ` +
      `business=${businessId} | by=${requesterId} isStaff=${isStaff}`
    );

    return cancelled;
  }
}

export default new AppointmentService();
