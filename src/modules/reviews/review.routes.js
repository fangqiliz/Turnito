import { Router } from 'express';
import { z } from 'zod';
import reviewController from './review.controller.js';
import {
  createReviewSchema,
  updateReviewSchema,
  reviewIdParamSchema,
  appointmentIdParamSchema,
  reviewPaginationSchema,
} from './review.validation.js';
import validate from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.js';

const router = Router();

/**
 * @route  POST /reviews
 * @desc   Crear una reseña para una cita completada.
 * @access Privado – Cliente autenticado (solo de sus propias citas completadas)
 *
 * Body:
 *   appointment_id: UUID (requerido)
 *   rating: 1-5 (requerido)
 *   comment: string (opcional, max 1000 chars)
 */
router.post(
  '/',
  requireAuth,
  validate({ body: createReviewSchema }),
  reviewController.create
);

/**
 * @route  GET /reviews/business/:id
 * @desc   Obtener todas las reseñas de un negocio con paginación.
 * @access Público – Cualquiera puede ver las reseñas
 *
 * Params:
 *   :id   UUID del negocio
 *
 * Query:
 *   ?page=1  ?limit=10
 */
router.get(
  '/business/:id',
  validate({
    params: z.object({ id: z.string().uuid() }),
    query: reviewPaginationSchema,
  }),
  reviewController.getByBusiness
);

/**
 * @route  GET /reviews/appointment/:id
 * @desc   Obtener la reseña de una cita específica.
 * @access Público – Cualquiera puede ver (si existe)
 *
 * Params:
 *   :id   UUID de la cita
 */
router.get(
  '/appointment/:id',
  validate({ params: appointmentIdParamSchema }),
  reviewController.getByAppointment
);

/**
 * @route  GET /reviews/:id
 * @desc   Obtener una reseña específica.
 * @access Público – Cualquiera puede ver
 *
 * Params:
 *   :id   UUID de la reseña
 */
router.get(
  '/:id',
  validate({ params: reviewIdParamSchema }),
  reviewController.getById
);

/**
 * @route  PUT /reviews/:id
 * @desc   Actualizar una reseña (solo el cliente propietario).
 * @access Privado – Cliente autenticado (solo su propia reseña)
 *
 * Params:
 *   :id   UUID de la reseña
 *
 * Body:
 *   rating: 1-5 (requerido)
 *   comment: string (opcional)
 */
router.put(
  '/:id',
  requireAuth,
  validate({
    params: reviewIdParamSchema,
    body: updateReviewSchema,
  }),
  reviewController.update
);

/**
 * @route  DELETE /reviews/:id
 * @desc   Eliminar una reseña (solo el cliente propietario).
 * @access Privado – Cliente autenticado (solo su propia reseña)
 *
 * Params:
 *   :id   UUID de la reseña
 */
router.delete(
  '/:id',
  requireAuth,
  validate({ params: reviewIdParamSchema }),
  reviewController.delete
);

export default router;
