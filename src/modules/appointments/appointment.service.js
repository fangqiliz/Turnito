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
      .select('id, owner_id, name')
      .eq('id', businessId)
      .single();

    if (error || !business) {
      throw ApiError.notFound(`El negocio con id "${businessId}" no existe.`);
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
   * @returns {Promise<object|null>} employee record o null si no existe o no está activo
   */
  async #getActiveEmployee(employeeId, businessId) {
    const { data: employee, error } = await supabase
      .from('employees')
      .select('id, business_id, full_name, is_active')
      .eq('id', employeeId)
      .eq('business_id', businessId)
      .single();

    if (error || !employee) {
      return null;
    }

    if (!employee.is_active) {
      return null;
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
   * Retorna true si está dentro del horario, false en caso contrario.
   * No lanza excepción.
   *
   * @private
   * @param {string} employeeId
   * @param {string} startTime  - ISO 8601
   * @param {string} endTime    - ISO 8601
   * @returns {Promise<boolean>} true si está dentro del horario laboral
   */
  async #isWithinWorkSchedule(employeeId, startTime, endTime) {
    try {
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

      if (error || !schedules || schedules.length === 0) {
        return false;
      }

      // Verificar que ALGÚN bloque de horario cubra completamente la cita
      const isWithinSchedule = schedules.some(
        (s) => startTimeStr >= s.start_time && endTimeStr <= s.end_time
      );

      return isWithinSchedule;
    } catch (err) {
      logger.warn(
        `[AppointmentService] Error al verificar horario laboral: ${err.message}`
      );
      return false;
    }
  }

  /**
   * Reglas 7 y 8: Verifica que el empleado no tenga citas solapadas.
   *
   * Retorna true si NO hay solapamiento, false si hay conflicto.
   * No lanza excepción.
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
   * @returns {Promise<boolean>} true si NO hay solapamiento
   */
  async #hasNoOverlap(employeeId, startTime, endTime, excludeId = null) {
    try {
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
        logger.warn(
          `[AppointmentService] Error al verificar disponibilidad: ${error.message}`
        );
        return false;
      }

      // Retorna true si NO hay conflictos
      return !conflicts || conflicts.length === 0;
    } catch (err) {
      logger.warn(
        `[AppointmentService] Error al verificar solapamiento: ${err.message}`
      );
      return false;
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
   * Crea una nueva cita aplicando las reglas de negocio.
   *
   * Cambio: Si el empleado seleccionado no tiene horario o no está disponible,
   * la cita se crea sin asignarle empleado (employee_id = null) en lugar de
   * lanzar un error. Solo se lanzan errores para casos realmente inválidos:
   * - Negocio no existe
   * - Servicio no existe
   * - Fecha es en el pasado
   * - etc.
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

    // ── Regla 5: Calcular end_time ────────────────────────────────────────────
    const end_time = this.#calculateEndTime(start_time, service.duration_minutes);

    // ── Nuevo comportamiento ESTRICTO: Verificar disponibilidad del empleado ───
    // Si se proporciona un employee_id, DEBE estar disponible.
    // De lo contrario, se rechaza la solicitud con un mensaje claro.
    let finalEmployeeId = null;

    if (employee_id) {
      // Verificar que el empleado existe y está activo
      const employee = await this.#getActiveEmployee(employee_id, business_id);

      if (!employee) {
        throw ApiError.badRequest(
          `El profesional seleccionado no está disponible.`
        );
      }

      // Verificar horario laboral
      const isWithinSchedule = await this.#isWithinWorkSchedule(
        employee_id,
        start_time,
        end_time
      );

      if (!isWithinSchedule) {
        throw ApiError.badRequest(
          `El horario solicitado está fuera del horario de trabajo del profesional. ` +
          `Selecciona otro horario.`
        );
      }

      // Verificar disponibilidad (sin solapamientos)
      const hasNoOverlap = await this.#hasNoOverlap(
        employee_id,
        start_time,
        end_time
      );

      if (!hasNoOverlap) {
        throw ApiError.badRequest(
          `El horario seleccionado ya no está disponible. ` +
          `Puede haber sido reservado recientemente. Intenta con otro horario.`
        );
      }

      finalEmployeeId = employee_id;
    }

    // ── Regla 9: Insertar con aislamiento multi-tenant ────────────────────────
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        business_id,
        service_id,
        employee_id: finalEmployeeId,  // Puede ser null si no se seleccionó empleado
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
      // Pero como ahora allowimos employee_id = null, esto no debe pasar frecuentemente.
      if (error.code === '23P01') {
        throw ApiError.badRequest(
          'Conflicto al crear la cita. Por favor, intenta de nuevo.'
        );
      }
      throw ApiError.internal(`Error al crear la cita: ${error.message}`);
    }

    // ── Regla 10: Notificaciones automáticas ─────────────────────────────────
    await this.#createNotifications(appointment, business, client_name);

    // ── Regla 11: Registro de eventos ─────────────────────────────────────────
    logger.info(
      `[AppointmentService] CREATED | appointment=${appointment.id} ` +
      `business=${business_id} employee=${finalEmployeeId ?? 'unassigned'} service=${service_id} ` +
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

    logger.info(`[AppointmentService] findByUser START | userId=${userId} status=${status ?? 'all'} page=${page}`);

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

    logger.info(`[AppointmentService] findByUser RESULT | userId=${userId} returned=${data?.length ?? 0} total=${count} error=${error?.message ?? 'none'}`);

    if (error) {
      throw ApiError.internal(`Error al obtener las citas del usuario: ${error.message}`);
    }

    // ── Regla 11 ──────────────────────────────────────────────────────────────
    logger.info(
      `[AppointmentService] LIST_USER | user=${userId} status=${status ?? 'all'} page=${page} dataCount=${data?.length}`
    );

    return { data, total: count, page, limit };
  }

  /**
   * Lista las citas de un negocio (multi-tenant).
   * Solo accesible para el dueño o un empleado activo del negocio
   * (verificado internamente con checkIsStaff).
   *
   * @param {string} businessId  - UUID del negocio
   * @param {object} query       - Filtros opcionales (status, date, employee_id, page, limit)
   * @param {string} requesterId - UUID del usuario autenticado que solicita el listado
   * @returns {Promise<{data: object[], total: number, page: number, limit: number}>}
   * @throws {ApiError} 403 si requesterId no es dueño ni empleado activo del negocio
   */
  async findByBusiness(businessId, query = {}, requesterId) {
    const { status, date, employee_id, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    // ── Regla 2 & 9: Confirmar que el negocio existe ──────────────────────────
    await this.#assertBusinessActive(businessId);

    // ── Autorización: solo el dueño o un empleado activo del negocio puede
    // ver su agenda completa (incluye datos de contacto de los clientes).
    const isStaff = await this.checkIsStaff(requesterId, businessId);
    if (!isStaff) {
      throw ApiError.forbidden('No tienes permiso para ver las citas de este negocio.');
    }

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
   * Autorización: solo el dueño del negocio o un empleado activo pueden
   * ejecutar esta acción (verificado internamente con checkIsStaff).
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
   * @throws {ApiError} 403 si requesterId no es dueño ni empleado activo del negocio
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

    // ── Autorización: solo el dueño o un empleado activo del negocio puede
    // cambiar el estado de una cita (a diferencia de cancel(), aquí no existe
    // una vía de "cliente actuando sobre su propia cita" — este endpoint es
    // exclusivamente el flujo de gestión del negocio, ver appointment.routes.js).
    const isStaff = await this.checkIsStaff(requesterId, businessId);
    if (!isStaff) {
      throw ApiError.forbidden('No tienes permiso para gestionar las citas de este negocio.');
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

  /**
   * Obtiene la duración de un servicio por su ID.
   * Utilizado por getAvailableSlots para calcular la duración de los slots.
   *
   * @public
   * @param {string} serviceId - UUID del servicio
   * @returns {Promise<object|null>} { id, duration_minutes } o null si no existe
   */
  async getServiceDuration(serviceId) {
    try {
      const { data: service, error } = await supabase
        .from('services')
        .select('id, duration_minutes')
        .eq('id', serviceId)
        .single();

      if (error || !service) {
        return null;
      }

      return service;
    } catch (err) {
      logger.warn(`[AppointmentService] Error al obtener duración del servicio: ${err.message}`);
      return null;
    }
  }

  /**
   * Verifica la disponibilidad de un horario específico para un empleado.
   * Valida horario laboral Y ausencia de solapamientos.
   *
   * @public
   * @param {string} employeeId
   * @param {string} startTime  - ISO 8601
   * @param {string} endTime    - ISO 8601
   * @returns {Promise<{available: boolean, reason?: string}>}
   */
  async checkAvailability(employeeId, startTime, endTime) {
    try {
      const isWithinSchedule = await this.#isWithinWorkSchedule(employeeId, startTime, endTime);
      if (!isWithinSchedule) {
        return {
          available: false,
          reason: 'El horario está fuera del horario laboral del profesional.'
        };
      }

      const hasNoOverlap = await this.#hasNoOverlap(employeeId, startTime, endTime);
      if (!hasNoOverlap) {
        return {
          available: false,
          reason: 'El horario se solapa con otra cita existente.'
        };
      }

      return { available: true };
    } catch (err) {
      logger.warn(`[AppointmentService] Error al verificar disponibilidad: ${err.message}`);
      return { available: false, reason: 'Error al verificar disponibilidad' };
    }
  }

  /**
   * Obtiene los horarios disponibles para un empleado en una fecha específica.
   * Retorna un array de horarios de inicio posibles, con granularidad configurable (ej. cada 30 min).
   *
   * @public
   * @param {string} employeeId    - UUID del empleado
   * @param {string} date          - Fecha en formato YYYY-MM-DD
   * @param {number} durationMin   - Duración del servicio en minutos
   * @param {number} [slotDuration=30] - Intervalo de slots en minutos (30 = cada media hora)
   * @returns {Promise<{date: string, slots: string[], timezone: string}>}
   *   slots es un array de horarios disponibles en formato "HH:MM" (ej. ["09:00", "09:30", "10:00"])
   */
  async getAvailableSlots(employeeId, date, durationMin, slotDuration = 30) {
    try {
      // Convertir fecha a day_of_week (UTC)
      const dateObj = new Date(`${date}T00:00:00Z`);
      const dayOfWeek = dateObj.getUTCDay();

      // 1. Obtener horarios laborales del empleado para ese día
      const { data: schedules, error: schedError } = await supabase
        .from('schedules')
        .select('start_time, end_time')
        .eq('employee_id', employeeId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true);

      if (schedError || !schedules || schedules.length === 0) {
        return { date, slots: [], timezone: 'UTC' };
      }

      // 2. Obtener citas existentes del empleado para esa fecha
      const dayStart = `${date}T00:00:00.000Z`;
      const dayEnd = `${date}T23:59:59.999Z`;

      const { data: appointments, error: apptError } = await supabase
        .from('appointments')
        .select('start_time, end_time, status')
        .eq('employee_id', employeeId)
        .gte('start_time', dayStart)
        .lte('start_time', dayEnd)
        .neq('status', 'cancelled');

      if (apptError) {
        logger.warn(`[AppointmentService] Error al obtener citas: ${apptError.message}`);
      }

      // 3. Generar todos los slots posibles dentro de los horarios laborales
      const allSlots = [];
      for (const schedule of schedules) {
        const [startHour, startMin] = schedule.start_time.split(':');
        const [endHour, endMin] = schedule.end_time.split(':');

        const startTotalMin = parseInt(startHour) * 60 + parseInt(startMin);
        const endTotalMin = parseInt(endHour) * 60 + parseInt(endMin);

        for (let totalMin = startTotalMin; totalMin + durationMin <= endTotalMin; totalMin += slotDuration) {
          const slotHour = Math.floor(totalMin / 60);
          const slotMin = totalMin % 60;
          const timeStr = `${String(slotHour).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`;
          allSlots.push(timeStr);
        }
      }

      // 4. Filtrar slots que se solapan con citas existentes
      const availableSlots = [];

      for (const slot of allSlots) {
        const [slotHour, slotMin] = slot.split(':');
        const slotStartMin = parseInt(slotHour) * 60 + parseInt(slotMin);
        const slotEndMin = slotStartMin + durationMin;

        // Convertir minutos a tiempo UTC para esta fecha
        const slotStart = new Date(dateObj);
        slotStart.setUTCHours(Math.floor(slotStartMin / 60), slotStartMin % 60, 0, 0);
        const slotStartIso = slotStart.toISOString();

        const slotEnd = new Date(slotStart);
        slotEnd.setUTCMinutes(slotEnd.getUTCMinutes() + durationMin);
        const slotEndIso = slotEnd.toISOString();

        // Verificar si se solapa con alguna cita existente
        const hasSolapamiento = appointments?.some(apt => {
          const aptStart = new Date(apt.start_time);
          const aptEnd = new Date(apt.end_time);
          return slotStart < aptEnd && slotEnd > aptStart;
        });

        if (!hasSolapamiento) {
          availableSlots.push(slot);
        }
      }

      return { date, slots: availableSlots, timezone: 'UTC' };
    } catch (err) {
      logger.error(`[AppointmentService] Error en getAvailableSlots: ${err.message}`);
      return { date, slots: [], timezone: 'UTC', error: err.message };
    }
  }

  /**
   * Cancela automáticamente las citas vencidas (citas cuyo start_time ya pasó).
   * Solo cancela citas con status 'pending' o 'confirmed'.
   * Se ejecuta automáticamente desde el cron job.
   *
   * @returns {Promise<object>} { cancelledCount: number, errors: string[] }
   */
  async autoCancelExpiredAppointments() {
    try {
      const now = new Date().toISOString();

      // Buscar citas vencidas que aún no han sido canceladas/completadas
      const { data: expiredAppointments, error } = await supabase
        .from('appointments')
        .select('id, business_id, client_id, employee_id, start_time, status')
        .lt('start_time', now)
        .in('status', ['pending', 'confirmed']);

      if (error) {
        throw ApiError.internal(`Error al buscar citas vencidas: ${error.message}`);
      }

      if (!expiredAppointments || expiredAppointments.length === 0) {
        return { cancelledCount: 0, errors: [] };
      }

      const errors = [];
      let cancelledCount = 0;

      // Cancelar cada cita vencida
      for (const appointment of expiredAppointments) {
        try {
          const { error: updateError } = await supabase
            .from('appointments')
            .update({ status: 'cancelled', updated_at: now })
            .eq('id', appointment.id);

          if (updateError) {
            errors.push(`Error al cancelar cita ${appointment.id}: ${updateError.message}`);
            continue;
          }

          // Crear notificación de cancelación automática
          try {
            const business = await this.#assertBusinessActive(appointment.business_id);
            
            const notifications = [];

            // Notificación para el cliente
            if (appointment.client_id) {
              notifications.push({
                business_id: appointment.business_id,
                user_id: appointment.client_id,
                title: '❌ Cita cancelada automáticamente',
                message: `Tu cita programada para el ${new Date(appointment.start_time).toLocaleString('es-ES')} ha sido cancelada automáticamente por no presentarte.`,
                type: 'appointment_cancelled',
              });
            }

            // Notificación para el propietario del negocio
            if (business.owner_id) {
              notifications.push({
                business_id: appointment.business_id,
                user_id: business.owner_id,
                title: '⚠️ Cita cancelada automáticamente',
                message: `La cita de un cliente programada para el ${new Date(appointment.start_time).toLocaleString('es-ES')} ha sido cancelada automáticamente.`,
                type: 'appointment_cancelled',
              });
            }

            if (notifications.length > 0) {
              await supabase.from('notifications').insert(notifications);
            }
          } catch (notifError) {
            logger.warn(`[AppointmentService] Error al crear notificación para cita ${appointment.id}: ${notifError.message}`);
          }

          cancelledCount++;
        } catch (err) {
          errors.push(`Error procesando cita ${appointment.id}: ${err.message}`);
        }
      }

      logger.info(
        `[AppointmentService] Citas vencidas canceladas: ${cancelledCount} | Errores: ${errors.length}`
      );

      return { cancelledCount, errors };
    } catch (err) {
      logger.error(`[AppointmentService] Error en autoCancelExpiredAppointments: ${err.message}`);
      return { cancelledCount: 0, errors: [err.message] };
    }
  }
}

export default new AppointmentService();
