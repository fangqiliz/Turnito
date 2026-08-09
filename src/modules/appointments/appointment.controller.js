import appointmentService from './appointment.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

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
      const appointment = await appointmentService.create(req.body, clientId);

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
      console.log('[AppointmentController.getByUser] req.user:', req.user);
      const result = await appointmentService.findByUser(req.user.id, req.query);
      console.log('[AppointmentController.getByUser] result:', result);

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
   * @access Privado – Solo dueño o empleado activo del negocio (validado en el servicio con checkIsStaff)
   */
  getByBusiness = async (req, res, next) => {
    try {
      const result = await appointmentService.findByBusiness(
        req.params.id,
        req.query,
        req.user.id
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
      const updated = await appointmentService.updateStatus(
        appointmentId,
        businessId,
        status,
        req.user.id
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

      // Determinar si el solicitante es staff del negocio (delegado al servicio)
      const isStaff = await appointmentService.checkIsStaff(requesterId, businessId);

      const cancelled = await appointmentService.cancel(
        appointmentId,
        businessId,
        requesterId,
        isStaff
      );

      return sendSuccess(res, 'Cita cancelada correctamente.', cancelled);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /appointments/available-slots
   * Obtiene los horarios disponibles para un empleado en una fecha específica.
   *
   * Query params:
   *   ?employeeId=UUID      (requerido)
   *   ?date=YYYY-MM-DD      (requerido)
   *   ?serviceId=UUID       (requerido - para obtener duration_minutes)
   *   ?slotDuration=30      (opcional - intervalo en minutos, default 30)
   *
   * @access Público - No requiere autenticación
   * @returns {date, slots: ["09:00", "09:30", ...], timezone: "UTC"}
   */
  getAvailableSlots = async (req, res, next) => {
    try {
      const { employeeId, date, serviceId, slotDuration = 30 } = req.query;

      // Validar parámetros requeridos
      if (!employeeId || !date || !serviceId) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros faltantes',
          data: {
            error: 'Se requieren employeeId, date y serviceId'
          }
        });
      }

      // Obtener duración del servicio
      const service = await appointmentService.getServiceDuration(serviceId);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Servicio no encontrado',
          data: { date, slots: [] }
        });
      }

      // Obtener slots disponibles
      const result = await appointmentService.getAvailableSlots(
        employeeId,
        date,
        service.duration_minutes,
        parseInt(slotDuration)
      );

      return sendSuccess(
        res,
        'Horarios disponibles obtenidos correctamente.',
        result
      );
    } catch (error) {
      next(error);
    }
  };
}

export default new AppointmentController();
