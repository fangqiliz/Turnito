import { useState } from 'react'
import toast from 'react-hot-toast'
import StarRating from './StarRating'
import styles from './ReviewForm.module.css'

/**
 * Formulario para crear o editar una reseña.
 * 
 * @param {string} appointmentId - UUID de la cita
 * @param {object} initialReview - Reseña inicial (para modo edición, opcional)
 * @param {function} onSubmit - Callback al enviar (rating, comment)
 * @param {boolean} loading - Si está enviando
 * @param {function} onCancel - Callback para cancelar (opcional)
 */
export default function ReviewForm({ appointmentId, initialReview, onSubmit, loading = false, onCancel }) {
  const [rating, setRating] = useState(initialReview?.rating || 0)
  const [comment, setComment] = useState(initialReview?.comment || '')
  const isEditing = !!initialReview

  const handleSubmit = (e) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Por favor selecciona una calificación')
      return
    }

    onSubmit({ appointmentId, rating, comment })
  }

  const handleCommentChange = (e) => {
    const value = e.target.value
    if (value.length <= 1000) {
      setComment(value)
    }
  }

  return (
    <form className={styles.reviewForm} onSubmit={handleSubmit}>
      <h3 className={styles.title}>
        {isEditing ? 'Editar Reseña' : 'Dejar una Reseña'}
      </h3>

      <div className={styles.formGroup}>
        <label className={styles.label}>
          Calificación <span className={styles.required}>*</span>
        </label>
        <StarRating rating={rating} onChange={setRating} size={24} />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="comment" className={styles.label}>
          Comentario (opcional)
        </label>
        <textarea
          id="comment"
          className={styles.textarea}
          placeholder="Comparte tu experiencia..."
          value={comment}
          onChange={handleCommentChange}
          maxLength={1000}
          rows={4}
          disabled={loading}
        />
        <p className={styles.charCount}>
          {comment.length}/1000 caracteres
        </p>
      </div>

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={loading || rating === 0}
        >
          {loading ? 'Enviando...' : isEditing ? 'Actualizar Reseña' : 'Enviar Reseña'}
        </button>

        {onCancel && (
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
