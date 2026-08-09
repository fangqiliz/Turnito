import reviewService from './review.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

class ReviewController {
  /**
   * POST /reviews
   * Crear una nueva reseña para una cita completada.
   * 
   * Body:
   *   appointment_id: UUID (requerido)
   *   rating: 1-5 (requerido)
   *   comment: string (opcional, max 1000 chars)
   */
  create = async (req, res, next) => {
    try {
      const { appointment_id, rating, comment } = req.body;
      const result = await reviewService.create(
        req.user.id,
        appointment_id,
        rating,
        comment || ''
      );

      return sendSuccess(res, 'Reseña creada correctamente', result, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /reviews/business/:id
   * Obtener todas las reseñas de un negocio con paginación.
   * 
   * Query:
   *   ?page=1 ?limit=10
   */
  getByBusiness = async (req, res, next) => {
    try {
      const result = await reviewService.findByBusiness(req.params.id, req.query);

      return sendSuccess(res, 'Reseñas del negocio obtenidas correctamente', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /reviews/:id
   * Obtener una reseña específica.
   */
  getById = async (req, res, next) => {
    try {
      const result = await reviewService.findById(req.params.id);

      return sendSuccess(res, 'Reseña obtenida correctamente', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /reviews/:id
   * Actualizar una reseña (solo el cliente propietario).
   * 
   * Body:
   *   rating: 1-5 (requerido)
   *   comment: string (opcional)
   */
  update = async (req, res, next) => {
    try {
      const { rating, comment } = req.body;
      const result = await reviewService.update(
        req.params.id,
        req.user.id,
        rating,
        comment || ''
      );

      return sendSuccess(res, 'Reseña actualizada correctamente', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /reviews/:id
   * Eliminar una reseña (solo el cliente propietario).
   */
  delete = async (req, res, next) => {
    try {
      await reviewService.delete(req.params.id, req.user.id);

      return sendSuccess(res, 'Reseña eliminada correctamente', null);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /reviews/appointment/:id
   * Obtener la reseña de una cita (si existe).
   */
  getByAppointment = async (req, res, next) => {
    try {
      const result = await reviewService.findByAppointment(req.params.id);

      return sendSuccess(
        res,
        'Reseña de la cita obtenida',
        result || { message: 'Esta cita no tiene reseña aún' }
      );
    } catch (error) {
      next(error);
    }
  };
}

export default new ReviewController();
