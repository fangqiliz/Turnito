import scheduleService from './schedule.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

/**
 * Controlador del módulo Schedules.
 * Delega toda la lógica de negocio a ScheduleService.
 *
 * Convención multi-tenant:
 *  – POST:   business_id y employee_id vienen en el body.
 *  – GET:    businessId como param de ruta (:id).
 *  – PUT:    scheduleId en params, ?businessId=<uuid> en query.
 *  – DELETE: scheduleId en params, ?businessId=<uuid> en query.
 */
class ScheduleController {
  /**
   * POST /schedules
   * Crea un nuevo horario para un empleado de un negocio.
   *
   * @access Privado – Solo propietario del negocio
   */
  create = async (req, res, next) => {
    try {
      const schedule = await scheduleService.create(req.body, req.user.id);

      return sendSuccess(res, 'Horario creado correctamente.', schedule, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /schedules/business/:id
   * Lista todos los horarios de un negocio (multi-tenant).
   * Ordenados por día de la semana y hora de inicio.
   *
   * @access Privado (Requiere Token)
   */
  getByBusiness = async (req, res, next) => {
    try {
      const schedules = await scheduleService.findByBusiness(req.params.id);

      return sendSuccess(
        res,
        'Horarios del negocio obtenidos correctamente.',
        schedules
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /schedules/:id?businessId=<uuid>
   * Actualiza un horario existente.
   * Re-valida solapamientos con los valores resultantes.
   *
   * @access Privado – Solo propietario del negocio
   */
  update = async (req, res, next) => {
    try {
      const { id: scheduleId } = req.params;
      const { businessId } = req.query;

      const updated = await scheduleService.update(
        scheduleId,
        businessId,
        req.body,
        req.user.id
      );

      return sendSuccess(res, 'Horario actualizado correctamente.', updated);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /schedules/:id?businessId=<uuid>
   * Elimina un horario de forma permanente.
   * Para desactivar sin eliminar, usar PUT con { is_active: false }.
   *
   * @access Privado – Solo propietario del negocio
   */
  remove = async (req, res, next) => {
    try {
      const { id: scheduleId } = req.params;
      const { businessId } = req.query;

      await scheduleService.remove(scheduleId, businessId, req.user.id);

      return sendSuccess(res, 'Horario eliminado correctamente.', null);
    } catch (error) {
      next(error);
    }
  };
}

export default new ScheduleController();
