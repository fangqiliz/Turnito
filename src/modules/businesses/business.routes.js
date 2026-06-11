import { Router } from 'express';
import businessController from './business.controller.js';
import {
  createBusinessSchema,
  updateBusinessSchema,
  businessIdParamSchema,
} from './business.validation.js';
import validate from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.js';
import ApiError from '../../utils/apiError.js';

const router = Router();

/* -----------------------------------------------------------------------
 * Middleware: requireAdmin
 * Verifica que el usuario autenticado tenga el rol 'admin' en sus metadatos
 * de Supabase Auth (user_metadata.role === 'admin').
 *
 * NOTA: Para producción se recomienda manejar roles a través de
 * `app_metadata` (server-side) en lugar de `user_metadata` para evitar
 * que el propio usuario los modifique desde el cliente.
 * ----------------------------------------------------------------------- */
const requireAdmin = (req, res, next) => {
  try {
    const role =
      req.user?.app_metadata?.role ||
      req.user?.user_metadata?.role;

    if (role !== 'admin') {
      throw ApiError.forbidden(
        'Acceso denegado: solo los administradores pueden realizar esta acción.'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * @route  POST /businesses
 * @desc   Crea un nuevo negocio (solo admin)
 * @access Privado – Admin
 */
router.post(
  '/',
  requireAuth,
  requireAdmin,
  validate({ body: createBusinessSchema }),
  businessController.create
);

/**
 * @route  GET /businesses
 * @desc   Lista todos los negocios registrados
 * @access Privado (Requiere Token)
 */
router.get('/', requireAuth, businessController.getAll);

/**
 * @route  GET /businesses/:id
 * @desc   Obtiene un negocio por su UUID
 * @access Privado (Requiere Token)
 */
router.get(
  '/:id',
  requireAuth,
  validate({ params: businessIdParamSchema }),
  businessController.getById
);

/**
 * @route  PUT /businesses/:id
 * @desc   Actualiza un negocio (solo su propietario)
 * @access Privado (Requiere Token + Ownership validado en el servicio)
 */
router.put(
  '/:id',
  requireAuth,
  validate({ params: businessIdParamSchema, body: updateBusinessSchema }),
  businessController.update
);

export default router;
