import supabase from '../../config/supabase.js';
import ApiError from '../../utils/apiError.js';
import logger from '../../config/logger.js';

/**
 * ReviewService – Lógica de negocio para el módulo Reviews.
 * 
 * Reglas implementadas:
 *  1. Solo clientes con citas completadas pueden dejar reseña.
 *  2. Una única reseña por cita (UNIQUE constraint).
 *  3. Calificación entre 1-5 estrellas.
 *  4. Comentario opcional, máximo 1000 caracteres.
 *  5. Las reseñas son públicas pero solo el cliente puede editarlas/eliminarlas.
 *  6. Registrar logs de eventos con Winston.
 */
class ReviewService {
  /**
   * Crear una reseña para una cita completada.
   * 
   * @param {string} clientId - UUID del cliente autenticado
   * @param {string} appointmentId - UUID de la cita
   * @param {number} rating - Calificación 1-5
   * @param {string} comment - Comentario opcional
   * @returns {Promise<object>} review creada
   */
  async create(clientId, appointmentId, rating, comment = '') {
    // Validar rating
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw ApiError.badRequest('La calificación debe ser un número entre 1 y 5');
    }

    // Validar comentario
    if (comment && comment.length > 1000) {
      throw ApiError.badRequest('El comentario no puede superar los 1000 caracteres');
    }

    // Obtener la cita y verificar que esté completada
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('id, business_id, client_id, status')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      throw ApiError.notFound('Cita no encontrada');
    }

    if (appointment.client_id !== clientId) {
      throw ApiError.forbidden('No puedes reseñar una cita que no es tuya');
    }

    if (appointment.status !== 'completed') {
      throw ApiError.badRequest('Solo puedes reseñar citas que han sido completadas');
    }

    // Crear reseña
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        business_id: appointment.business_id,
        appointment_id: appointmentId,
        client_id: clientId,
        rating,
        comment: comment.trim() || null,
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes('unique_review_per_appointment')) {
        throw ApiError.conflict('Ya has dejado una reseña para esta cita');
      }
      throw ApiError.internal(`Error al crear la reseña: ${error.message}`);
    }

    logger.info(
      `[ReviewService] Reseña creada | appointmentId=${appointmentId} clientId=${clientId} rating=${rating}`
    );

    return review;
  }

  /**
   * Obtener todas las reseñas de un negocio.
   * 
   * @param {string} businessId - UUID del negocio
   * @param {object} query - Filtros opcionales (page, limit)
   * @returns {Promise<{data: object[], total: number, page: number, limit: number, avgRating: number}>}
   */
  async findByBusiness(businessId, query = {}) {
    const { page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    // Obtener reseñas del negocio con paginación
    const { data: reviews, error, count } = await supabase
      .from('reviews')
      .select(
        `id, appointment_id, rating, comment, created_at, client_id`,
        { count: 'exact' }
      )
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw ApiError.internal(`Error al obtener reseñas: ${error.message}`);
    }

    // Enriquecer cada reseña con datos del perfil del cliente
    const enrichedReviews = await Promise.all(
      (reviews || []).map(async (review) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', review.client_id)
          .single();

        return {
          ...review,
          profiles: profile || { full_name: 'Cliente Anónimo', avatar_url: null },
        };
      })
    );

    // Calcular promedio de calificación
    const { data: stats } = await supabase
      .from('reviews')
      .select('rating')
      .eq('business_id', businessId);

    const avgRating = stats && stats.length > 0
      ? (stats.reduce((sum, r) => sum + r.rating, 0) / stats.length).toFixed(1)
      : 0;

    logger.info(
      `[ReviewService] Reseñas del negocio obtenidas | businessId=${businessId} count=${count} avgRating=${avgRating}`
    );

    return {
      data: enrichedReviews,
      total: count,
      page,
      limit,
      avgRating: parseFloat(avgRating),
      totalReviews: count,
    };
  }

  /**
   * Obtener una reseña específica.
   * 
   * @param {string} reviewId - UUID de la reseña
   * @returns {Promise<object>} review
   */
  async findById(reviewId) {
    const { data: review, error } = await supabase
      .from('reviews')
      .select('id, appointment_id, business_id, client_id, rating, comment, created_at')
      .eq('id', reviewId)
      .single();

    if (error || !review) {
      throw ApiError.notFound('Reseña no encontrada');
    }

    // Obtener datos del perfil del cliente
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', review.client_id)
      .single();

    return {
      ...review,
      profiles: profile || { full_name: 'Cliente Anónimo', avatar_url: null },
    };
  }

  /**
   * Actualizar una reseña (solo el cliente propietario).
   * 
   * @param {string} reviewId - UUID de la reseña
   * @param {string} clientId - UUID del cliente autenticado
   * @param {number} rating - Nueva calificación
   * @param {string} comment - Nuevo comentario
   * @returns {Promise<object>} review actualizada
   */
  async update(reviewId, clientId, rating, comment = '') {
    // Validar rating
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw ApiError.badRequest('La calificación debe ser un número entre 1 y 5');
    }

    if (comment && comment.length > 1000) {
      throw ApiError.badRequest('El comentario no puede superar los 1000 caracteres');
    }

    // Obtener reseña y verificar permisos
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id, client_id')
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      throw ApiError.notFound('Reseña no encontrada');
    }

    if (review.client_id !== clientId) {
      throw ApiError.forbidden('No puedes editar una reseña que no es tuya');
    }

    // Actualizar reseña
    const { data: updated, error } = await supabase
      .from('reviews')
      .update({
        rating,
        comment: comment.trim() || null,
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      throw ApiError.internal(`Error al actualizar la reseña: ${error.message}`);
    }

    logger.info(
      `[ReviewService] Reseña actualizada | reviewId=${reviewId} clientId=${clientId} rating=${rating}`
    );

    return updated;
  }

  /**
   * Eliminar una reseña (solo el cliente propietario).
   * 
   * @param {string} reviewId - UUID de la reseña
   * @param {string} clientId - UUID del cliente autenticado
   * @returns {Promise<void>}
   */
  async delete(reviewId, clientId) {
    // Obtener reseña y verificar permisos
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id, client_id')
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      throw ApiError.notFound('Reseña no encontrada');
    }

    if (review.client_id !== clientId) {
      throw ApiError.forbidden('No puedes eliminar una reseña que no es tuya');
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      throw ApiError.internal(`Error al eliminar la reseña: ${error.message}`);
    }

    logger.info(
      `[ReviewService] Reseña eliminada | reviewId=${reviewId} clientId=${clientId}`
    );
  }

  /**
   * Obtener reseña de una cita específica (si existe).
   * 
   * @param {string} appointmentId - UUID de la cita
   * @returns {Promise<object|null>} review o null
   */
  async findByAppointment(appointmentId) {
    const { data: review, error } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, client_id')
      .eq('appointment_id', appointmentId)
      .single();

    if (!review) return null;

    // Obtener datos del perfil del cliente
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', review.client_id)
      .single();

    return {
      ...review,
      profiles: profile || { full_name: 'Cliente Anónimo', avatar_url: null },
    };
  }
}

export default new ReviewService();
