import { Router } from 'express';
import scheduleController from './schedule.controller.js';
import {
  createScheduleSchema,
  updateScheduleSchema,
  scheduleIdParamSchema,
  businessIdParamSchema,
  businessIdQuerySchema,
} from './schedule.validation.js';
import validate from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.js';
import ApiError from '../../utils/apiError.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Guard: requireBusinessIdQuery
// Valida que ?businessId=<uuid> esté presente en PUT y DELETE.
// Reutiliza el schema Zod del módulo para garantizar consistencia.
// ─────────────────────────────────────────────────────────────────────────────
const requireBusinessIdQuery = (req, res, next) => {
  try {
    const result = businessIdQuerySchema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      throw ApiError.badRequest('Error de validación en query params', errors);
    }
    req.query = { ...req.query, ...result.data };
    next();
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Rutas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route  POST /schedules
 * @desc   Crea un horario laboral para un empleado de un negocio
 * @access Privado – Solo propietario del negocio
 *
 * Body:
 *   business_id  UUID     (requerido)
 *   employee_id  UUID     (requerido)
 *   day_of_week  number   0-6  (requerido, 0=domingo ... 6=sábado)
 *   start_time   string   HH:MM (requerido)
 *   end_time     string   HH:MM (requerido, > start_time)
 *   [is_active]  boolean  (default: true)
 */
router.post(
  '/',
  requireAuth,
  validate({ body: createScheduleSchema }),
  scheduleController.create
);

/**
 * @route  GET /schedules/business/:id
 * @desc   Lista todos los horarios de un negocio (multi-tenant)
 *         Ordenados por día y hora de inicio. Incluye datos del empleado.
 * @access Privado (Requiere Token)
 *
 * Params:
 *   :id  UUID del negocio
 */
router.get(
  '/business/:id',
  requireAuth,
  validate({ params: businessIdParamSchema }),
  scheduleController.getByBusiness
);

/**
 * @route  PUT /schedules/:id?businessId=<uuid>
 * @desc   Actualiza un horario (day_of_week, start_time, end_time, is_active)
 *         Re-valida solapamientos al cambiar día u horario.
 *         Para desactivar sin eliminar: { is_active: false }
 * @access Privado – Solo propietario del negocio
 *
 * Params: :id        UUID del horario
 * Query:  ?businessId UUID del negocio (requerido)
 */
router.put(
  '/:id',
  requireAuth,
  requireBusinessIdQuery,
  validate({ params: scheduleIdParamSchema, body: updateScheduleSchema }),
  scheduleController.update
);

/**
 * @route  DELETE /schedules/:id?businessId=<uuid>
 * @desc   Elimina permanentemente un horario del negocio.
 *         Para desactivar sin borrar: PUT con { is_active: false }.
 * @access Privado – Solo propietario del negocio
 *
 * Params: :id        UUID del horario
 * Query:  ?businessId UUID del negocio (requerido)
 */
router.delete(
  '/:id',
  requireAuth,
  requireBusinessIdQuery,
  validate({ params: scheduleIdParamSchema }),
  scheduleController.remove
);

export default router;
