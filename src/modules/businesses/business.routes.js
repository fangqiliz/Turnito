import { Router } from 'express';
import businessController from './business.controller.js';
import {
  createBusinessSchema,
  updateBusinessSchema,
  businessIdParamSchema,
  listBusinessesQuerySchema,
} from './business.validation.js';
import validate from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.js';

const router = Router();

/**
 * @route  POST /businesses
 * @desc   Crea un nuevo negocio asociado al usuario autenticado
 * @access Privado
 */
router.post(
  '/',
  requireAuth,
  validate({ body: createBusinessSchema }),
  businessController.create
);

/**
 * @route  GET /businesses
 * @desc   Lista los negocios registrados, paginado.
 * @access Privado (Requiere Token)
 *
 * Query:
 *   ?page=1   (default: 1)
 *   ?limit=20 (default: 20, max: 100)
 *   ?slug=... (opcional: filtra por slug exacto, para buscar un único negocio)
 */
router.get(
  '/',
  requireAuth,
  validate({ query: listBusinessesQuerySchema }),
  businessController.getAll
);

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
