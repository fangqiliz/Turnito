import { useState, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import reviewsService from '../services/reviews.service'

/**
 * Hook para manejar reseñas de un negocio.
 * 
 * @param {string} businessId - UUID del negocio
 * @returns {object} { reviews, loading, avgRating, totalReviews, refreshReviews }
 */
export function useBusinessReviews(businessId) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [avgRating, setAvgRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)

  const refresh = useCallback(async () => {
    if (!businessId) return
    setLoading(true)
    try {
      const data = await reviewsService.getByBusiness(businessId)
      setReviews(data.data || [])
      setAvgRating(data.avgRating || 0)
      setTotalReviews(data.totalReviews || 0)
    } catch (err) {
      toast.error('Error al cargar reseñas')
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { reviews, loading, avgRating, totalReviews, refreshReviews: refresh }
}

/**
 * Hook para crear/editar una reseña de una cita.
 * 
 * @param {string} appointmentId - UUID de la cita
 * @param {function} onSuccess - Callback después de crear/editar (opcional)
 * @returns {object} { review, loading, createReview, updateReview, deleteReview, fetchReview }
 */
export function useAppointmentReview(appointmentId, onSuccess) {
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchReview = useCallback(async () => {
    if (!appointmentId) return
    try {
      const data = await reviewsService.getByAppointment(appointmentId)
      setReview(data || null)
    } catch (err) {
      console.error('Error fetching review:', err)
      setReview(null)
    }
  }, [appointmentId])

  const createReview = async (rating, comment) => {
    setLoading(true)
    try {
      const data = await reviewsService.create(appointmentId, rating, comment)
      setReview(data)
      toast.success('Reseña creada exitosamente')
      onSuccess && onSuccess(data)
      return data
    } catch (err) {
      toast.error(err.message || 'Error al crear reseña')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateReview = async (reviewId, rating, comment) => {
    setLoading(true)
    try {
      const data = await reviewsService.update(reviewId, rating, comment)
      setReview(data)
      toast.success('Reseña actualizada exitosamente')
      onSuccess && onSuccess(data)
      return data
    } catch (err) {
      toast.error(err.message || 'Error al actualizar reseña')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteReview = async (reviewId) => {
    setLoading(true)
    try {
      await reviewsService.delete(reviewId)
      setReview(null)
      toast.success('Reseña eliminada exitosamente')
      onSuccess && onSuccess(null)
    } catch (err) {
      toast.error(err.message || 'Error al eliminar reseña')
      throw err
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReview()
  }, [fetchReview])

  return { review, loading, createReview, updateReview, deleteReview, fetchReview }
}
