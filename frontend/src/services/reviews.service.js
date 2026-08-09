import api from '../config/api'

const reviewsService = {
  /**
   * Crear una reseña para una cita completada.
   * @param {string} appointmentId - UUID de la cita
   * @param {number} rating - Calificación 1-5
   * @param {string} comment - Comentario opcional
   * @returns {Promise<object>} review creada
   */
  async create(appointmentId, rating, comment = '') {
    const res = await api.post('/reviews', {
      appointment_id: appointmentId,
      rating,
      comment: comment.trim(),
    })
    return res.data
  },

  /**
   * Obtener todas las reseñas de un negocio.
   * @param {string} businessId - UUID del negocio
   * @param {number} page - Número de página
   * @param {number} limit - Cantidad por página
   * @returns {Promise<object>} { data, total, avgRating, totalReviews }
   */
  async getByBusiness(businessId, page = 1, limit = 10) {
    const res = await api.get(`/reviews/business/${businessId}?page=${page}&limit=${limit}`)
    return res.data
  },

  /**
   * Obtener la reseña de una cita.
   * @param {string} appointmentId - UUID de la cita
   * @returns {Promise<object|null>} review o null
   */
  async getByAppointment(appointmentId) {
    const res = await api.get(`/reviews/appointment/${appointmentId}`)
    return res.data
  },

  /**
   * Obtener una reseña específica.
   * @param {string} reviewId - UUID de la reseña
   * @returns {Promise<object>} review
   */
  async getById(reviewId) {
    const res = await api.get(`/reviews/${reviewId}`)
    return res.data
  },

  /**
   * Actualizar una reseña.
   * @param {string} reviewId - UUID de la reseña
   * @param {number} rating - Nueva calificación
   * @param {string} comment - Nuevo comentario
   * @returns {Promise<object>} review actualizada
   */
  async update(reviewId, rating, comment = '') {
    const res = await api.put(`/reviews/${reviewId}`, {
      rating,
      comment: comment.trim(),
    })
    return res.data
  },

  /**
   * Eliminar una reseña.
   * @param {string} reviewId - UUID de la reseña
   * @returns {Promise<void>}
   */
  async delete(reviewId) {
    await api.delete(`/reviews/${reviewId}`)
  },
}

export default reviewsService
