import { Router } from 'express';
import businessController from './business.controller.js';
import {
  createBusinessSchema,
  updateBusinessSchema,
  businessIdParamSchema,
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
