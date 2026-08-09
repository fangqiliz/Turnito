import { Trash2, Edit2 } from 'lucide-react'
import StarRating from './StarRating'
import styles from './ReviewCard.module.css'

/**
 * Componente para mostrar una reseña existente.
 * 
 * @param {object} review - Objeto de reseña con { id, rating, comment, created_at, profiles }
 * @param {boolean} isOwner - Si es dueño de la reseña (true = mostrar opciones de editar/eliminar)
 * @param {function} onEdit - Callback para editar (opcional)
 * @param {function} onDelete - Callback para eliminar (opcional)
 */
export default function ReviewCard({ review, isOwner = false, onEdit, onDelete, loading = false }) {
  const clientName = review.profiles?.full_name || 'Cliente Anónimo'
  const clientAvatar = review.profiles?.avatar_url
  const date = new Date(review.created_at).toLocaleDateString('es-ES')

  return (
    <div className={styles.reviewCard}>
      <div className={styles.header}>
        <div className={styles.clientInfo}>
          {clientAvatar && (
            <img src={clientAvatar} alt={clientName} className={styles.avatar} />
          )}
          <div>
            <h4 className={styles.clientName}>{clientName}</h4>
            <p className={styles.date}>{date}</p>
          </div>
        </div>

        {isOwner && (
          <div className={styles.actions}>
            {onEdit && (
              <button
                className={styles.actionBtn}
                onClick={() => onEdit(review)}
                disabled={loading}
                title="Editar reseña"
              >
                <Edit2 size={16} />
              </button>
            )}
            {onDelete && (
              <button
                className={`${styles.actionBtn} ${styles.delete}`}
                onClick={() => {
                  if (confirm('¿Eliminar esta reseña?')) {
                    onDelete(review.id)
                  }
                }}
                disabled={loading}
                title="Eliminar reseña"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className={styles.rating}>
        <StarRating rating={review.rating} />
      </div>

      {review.comment && (
        <p className={styles.comment}>{review.comment}</p>
      )}
    </div>
  )
}
