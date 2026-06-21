import appointmentService from './appointment.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import supabase from '../../config/supabase.js';
import { createAuthenticatedClient } from '../../config/supabase.js';

/**
 * AppointmentController – Módulo Appointments.
 *
 * Delega toda la lógica de negocio a AppointmentService.
 * El controlador es responsable únicamente de:
 *  – Extraer datos de req (params, query, body, user).
 *  – Llamar al servicio correcto.
 *  – Formatear la respuesta HTTP con sendSuccess.
 *  – Pasar errores al middleware centralizado via next(error).
 */
class AppointmentController {
  /**
   * POST /appointments
   * Crea una nueva cita aplicando todas las reglas de negocio.
   *
   * @access Privado – Usuario autenticado (cliente)
   *         Anónimo permitido si la política de RLS lo permite (checkout de invitado).
   */
  create = async (req, res, next) => {
    try {
      // El usuario puede ser autenticado (req.user) o anónimo (null)
      const clientId = req.user?.id ?? null;
      const authenticatedClient = req.token ? createAuthenticatedClient(req.token) : null;

      const appointment = await appointmentService.create(req.body, clientId, authenticatedClient);

      return sendSuccess(res, 'Cita agendada exitosamente.', appointment, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /appointments/user
   * Lista las citas del usuario autenticado (cliente).
   *
   * Query params opcionales:
   *   ?status=pending|confirmed|cancelled|completed|no_show
   *   ?page=1  ?limit=20
   *
   * @access Privado – Solo el usuario autenticado
   */
  getByUser = async (req, res, next) => {
    try {
      const result = await appointmentService.findByUser(req.user.id, req.query);

      return sendSuccess(
        res,
        'Citas del usuario obtenidas correctamente.',
        result
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /appointments/business/:id
   * Lista las citas de un negocio con filtros opcionales.
   *
   * Params:
   *   :id UUID del negocio
   *
   * Query params opcionales:
   *   ?status=...  ?date=YYYY-MM-DD  ?employee_id=UUID  ?page=1  ?limit=20
   *
   * @access Privado – Solo dueño o empleado del negocio (validado por requireRole)
   */
  getByBusiness = async (req, res, next) => {
    try {
      const result = await appointmentService.findByBusiness(
        req.params.id,
        req.query
      );

      return sendSuccess(
        res,
        'Citas del negocio obtenidas correctamente.',
        result
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /appointments/:id/status
   * Actualiza el estado de una cita (flujo del negocio).
   *
   * Params:
   *   :id UUID de la cita
   *
   * Body:
   *   status  'pending'|'confirmed'|'cancelled'|'completed'|'no_show'
   *
   * Query:
   *   ?businessId UUID del negocio (contexto multi-tenant)
   *
   * @access Privado – Dueño o empleado del negocio
   */
  updateStatus = async (req, res, next) => {
    try {
      const { id: appointmentId } = req.params;
      const { businessId } = req.query;
      const { status } = req.body;
      const authenticatedClient = createAuthenticatedClient(req.token);

      const updated = await appointmentService.updateStatus(
        appointmentId,
        businessId,
        status,
        req.user.id,
        authenticatedClient
      );

      return sendSuccess(res, `Estado de la cita actualizado a "${status}".`, updated);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /appointments/:id
   * Cancela (soft delete) una cita.
   *
   * Params:
   *   :id UUID de la cita
   *
   * Query:
   *   ?businessId UUID del negocio (contexto multi-tenant)
   *
   * El cliente solo puede cancelar sus propias citas.
   * El staff del negocio puede cancelar cualquier cita del negocio.
   *
   * @access Privado – Usuario autenticado (cliente o staff)
   */
  cancel = async (req, res, next) => {
    try {
      const { id: appointmentId } = req.params;
      const { businessId } = req.query;
      const requesterId = req.user.id;
      const authenticatedClient = createAuthenticatedClient(req.token);

      // Determinar si el solicitante es staff del negocio
      const isStaff = await this.#checkIsStaff(requesterId, businessId);

      const cancelled = await appointmentService.cancel(
        appointmentId,
        businessId,
        requesterId,
        isStaff,
        authenticatedClient
      );

      return sendSuccess(res, 'Cita cancelada correctamente.', cancelled);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Helper privado: verifica si el usuario es dueño o empleado activo del negocio.
   * Encapsulado aquí para no duplicar lógica con requireRole middleware.
   *
   * @private
   * @param {string} userId
   * @param {string} businessId
   * @returns {Promise<boolean>}
   */
  #checkIsStaff = async (userId, businessId) => {
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
  };
}

export default new AppointmentController();
