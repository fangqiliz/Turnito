import { Router } from 'express';
import { z } from 'zod';
import employeeController from './employee.controller.js';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  updateOwnEmployeeSchema,
  employeeIdParamSchema,
  businessIdParamSchema,
} from './employee.validation.js';
import validate from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.js';
import ApiError from '../../utils/apiError.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Guard: requireBusinessIdQuery
// Verifica que el query param ?businessId=<uuid> esté presente y sea un UUID
// válido. Se usa en PUT y DELETE para mantener el contexto multi-tenant.
// ─────────────────────────────────────────────────────────────────────────────
const businessIdQuerySchema = z.object({
  businessId: z
    .string({ required_error: 'El query param businessId es requerido' })
    .uuid('businessId debe ser un UUID válido'),
});

const requireBusinessIdQuery = (req, res, next) => {
  try {
    const result = businessIdQuerySchema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      throw ApiError.badRequest(
        'Error de validación en query params',
        errors
      );
    }
    req.query = result.data; // sustituir con datos parseados
    next();
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Rutas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route  POST /employees
 * @desc   Registra un nuevo empleado en un negocio
 * @access Privado – Solo el propietario del negocio (validado en el servicio)
 *
 * Body requerido:
 *   business_id  UUID
 *   full_name    string
 *   [profile_id] UUID?
 *   [email]      string?
 *   [phone]      string?
 *   [specialty]  string?
 *   [role]       'owner'|'admin'|'manager'|'staff'   (default: 'staff')
 *   [is_active]  boolean                              (default: true)
 */
router.post(
  '/',
  requireAuth,
  validate({ body: createEmployeeSchema }),
  employeeController.create
);

/**
 * @route  GET /employees/business/:id
 * @desc   Lista todos los empleados de un negocio (multi-tenant)
 * @access Privado (Requiere Token)
 *
 * Params:
 *   :id  UUID del negocio
 */
router.get(
  '/business/:id',
  requireAuth,
  validate({ params: businessIdParamSchema }),
  employeeController.getByBusiness
);

/**
 * @route  PUT /employees/me
 * @desc   Actualiza el teléfono del propio registro de empleado del usuario autenticado
 * @access Privado (Requiere Token) — solo modifica el propio registro, no requiere ownership
 *
 * Body requerido:
 *   businessId  UUID del negocio (identifica el registro dentro del tenant)
 *   [phone]     string?
 *
 * Nota: debe declararse antes de PUT /:id para que Express no interprete
 * "me" como un :id.
 */
router.put(
  '/me',
  requireAuth,
  validate({ body: updateOwnEmployeeSchema }),
  employeeController.updateOwn
);

/**
 * @route  PUT /employees/:id
 * @desc   Actualiza un empleado (solo el propietario del negocio)
 * @access Privado – Solo owner del negocio
 *
 * Params:
 *   :id  UUID del empleado
 * Query:
 *   ?businessId  UUID del negocio (contexto multi-tenant)
 */
router.put(
  '/:id',
  requireAuth,
  requireBusinessIdQuery,
  validate({ params: employeeIdParamSchema, body: updateEmployeeSchema }),
  employeeController.update
);

/**
 * @route  DELETE /employees/:id
 * @desc   Elimina un empleado del negocio (solo el propietario del negocio)
 * @access Privado – Solo owner del negocio
 *
 * Params:
 *   :id  UUID del empleado
 * Query:
 *   ?businessId  UUID del negocio (contexto multi-tenant)
 */
router.delete(
  '/:id',
  requireAuth,
  requireBusinessIdQuery,
  validate({ params: employeeIdParamSchema }),
  employeeController.remove
);

export default router;
