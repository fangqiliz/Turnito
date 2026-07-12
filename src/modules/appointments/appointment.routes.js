import { Router } from 'express';
import appointmentController from './appointment.controller.js';
import {
  createAppointmentSchema,
  updateStatusSchema,
  appointmentIdParamSchema,
  businessIdParamSchema,
  listBusinessAppointmentsQuerySchema,
  listUserAppointmentsQuerySchema,
} from './appointment.validation.js';
import validate from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.js';
import ApiError from '../../utils/apiError.js';
import { z } from 'zod';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Guards de Query Params
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Guard: valida que ?businessId=<uuid> esté presente en los endpoints
 * que requieren contexto multi-tenant via query string (PUT status, DELETE).
 */
const requireBusinessIdQuery = (req, res, next) => {
  try {
    const schema = z.object({
      businessId: z
        .string({ required_error: 'El query param businessId es requerido para identificar el tenant' })
        .uuid('businessId debe ser un UUID válido'),
    });

    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      throw ApiError.badRequest('Error de validación en query params', errors);
    }

    // Normalizar con los datos parseados
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
 * @route  POST /appointments
 * @desc   Crea una nueva cita aplicando todas las reglas de negocio:
 *         – No pasado, negocio activo, servicio activo, empleado activo,
 *           cálculo de end_time, horario laboral, disponibilidad, doble reserva,
 *           notificaciones automáticas y log de eventos.
 * @access Privado – Usuario autenticado (cliente)
 *
 * Body:
 *   business_id   UUID        (requerido)
 *   service_id    UUID        (requerido)
 *   employee_id   UUID        (requerido)
 *   start_time    ISO 8601    (requerido, debe ser futuro)
 *   client_name   string      (requerido, 2-100 chars)
 *   client_email  string      (requerido, email válido)
 *   [client_phone] string?    (max 30 chars)
 *   [notes]        string?    (max 500 chars)
 */
router.post(
  '/',
  requireAuth,
  validate({ body: createAppointmentSchema }),
  appointmentController.create
);

/**
 * @route  GET /appointments/user
 * @desc   Lista las citas del usuario autenticado con paginación y filtros opcionales.
 * @access Privado – Solo el usuario autenticado
 *
 * Query:
 *   ?status=pending|confirmed|cancelled|completed|no_show
 *   ?page=1   (default: 1)
 *   ?limit=20 (default: 20, max: 100)
 */
router.get(
  '/user',
  requireAuth,
  validate({ query: listUserAppointmentsQuerySchema }),
  appointmentController.getByUser
);

/**
 * @route  GET /appointments/business/:id
 * @desc   Lista las citas de un negocio.
 *         Solo accesible para dueños o empleados activos del negocio.
 * @access Privado – Dueño o empleado del negocio
 *
 * Params:
 *   :id   UUID del negocio
 *
 * Query:
 *   ?status=...
 *   ?date=YYYY-MM-DD        (filtra citas del día)
 *   ?employee_id=UUID       (filtra por empleado)
 *   ?page=1   ?limit=20
 */
router.get(
  '/business/:id',
  requireAuth,
  validate({
    params: businessIdParamSchema,
    query: listBusinessAppointmentsQuerySchema,
  }),
  appointmentController.getByBusiness
);

/**
 * @route  PUT /appointments/:id/status
 * @desc   Actualiza el estado de una cita (flujo de gestión del negocio).
 *         Transiciones válidas:
 *           pending → confirmed | cancelled
 *           confirmed → completed | no_show | cancelled
 *         Estados finales (no modificables): completed, no_show
 * @access Privado – Dueño o empleado activo del negocio (validado en el servicio con checkIsStaff)
 *
 * Params:
 *   :id   UUID de la cita
 *
 * Query:
 *   ?businessId  UUID del negocio (contexto multi-tenant)
 *
 * Body:
 *   status  'pending'|'confirmed'|'cancelled'|'completed'|'no_show'
 */
router.put(
  '/:id/status',
  requireAuth,
  requireBusinessIdQuery,
  validate({
    params: appointmentIdParamSchema,
    body: updateStatusSchema,
  }),
  appointmentController.updateStatus
);

/**
 * @route  DELETE /appointments/:id
 * @desc   Cancela (soft delete) una cita.
 *         – El cliente autenticado puede cancelar únicamente sus propias citas futuras.
 *         – El staff/dueño del negocio puede cancelar cualquier cita del negocio.
 * @access Privado – Usuario autenticado (cliente o staff)
 *
 * Params:
 *   :id   UUID de la cita
 *
 * Query:
 *   ?businessId  UUID del negocio (contexto multi-tenant, requerido)
 */
router.delete(
  '/:id',
  requireAuth,
  requireBusinessIdQuery,
  validate({ params: appointmentIdParamSchema }),
  appointmentController.cancel
);

export default router;
