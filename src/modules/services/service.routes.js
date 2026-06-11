import { Router } from 'express';
import serviceController from './service.controller.js';
import {
  createServiceSchema,
  updateServiceSchema,
  serviceIdParamSchema,
  businessIdParamSchema,
  businessIdQuerySchema,
} from './service.validation.js';
import validate from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.js';
import ApiError from '../../utils/apiError.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Guard: requireBusinessIdQuery
// Valida que ?businessId=<uuid> esté presente en PUT y DELETE.
// Garantiza el contexto multi-tenant sin rutas anidadas.
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
    // Reemplazar req.query con el objeto parseado (garantiza tipado y limpieza)
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
 * @route  POST /services
 * @desc   Crea un nuevo servicio para un negocio
 * @access Privado – Solo propietario del negocio (validado en el servicio)
 *
 * Body:
 *   business_id      UUID        (requerido)
 *   name             string      (requerido, 2-100 chars)
 *   price            number      (requerido, >= 0)
 *   duration_minutes number      (requerido, entero > 0)
 *   [description]    string?     (max 500 chars)
 *   [is_active]      boolean     (default: true)
 */
router.post(
  '/',
  requireAuth,
  validate({ body: createServiceSchema }),
  serviceController.create
);

/**
 * @route  GET /services/business/:id
 * @desc   Lista todos los servicios de un negocio (activos e inactivos para owners)
 * @access Privado (Requiere Token)
 *
 * Params:
 *   :id  UUID del negocio
 */
router.get(
  '/business/:id',
  requireAuth,
  validate({ params: businessIdParamSchema }),
  serviceController.getByBusiness
);

/**
 * @route  PUT /services/:id?businessId=<uuid>
 * @desc   Actualiza un servicio existente
 * @access Privado – Solo propietario del negocio
 *
 * Params:
 *   :id           UUID del servicio
 * Query:
 *   ?businessId   UUID del negocio (contexto multi-tenant, requerido)
 */
router.put(
  '/:id',
  requireAuth,
  requireBusinessIdQuery,
  validate({ params: serviceIdParamSchema, body: updateServiceSchema }),
  serviceController.update
);

/**
 * @route  DELETE /services/:id?businessId=<uuid>[&hard=true]
 * @desc   Desactiva (soft delete) o elimina permanentemente (hard delete) un servicio
 * @access Privado – Solo propietario del negocio
 *
 * Params:
 *   :id           UUID del servicio
 * Query:
 *   ?businessId   UUID del negocio (contexto multi-tenant, requerido)
 *   ?hard         'true' para hard delete (default: soft delete)
 *
 * IMPORTANTE: El hard delete fallará si el servicio tiene citas activas
 * asociadas (FK ON DELETE RESTRICT en la tabla appointments).
 * En ese caso, usar el soft delete predeterminado.
 */
router.delete(
  '/:id',
  requireAuth,
  requireBusinessIdQuery,
  validate({ params: serviceIdParamSchema }),
  serviceController.remove
);

export default router;
