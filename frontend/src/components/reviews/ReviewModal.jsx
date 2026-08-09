import { X } from 'lucide-react'
import ReviewForm from './ReviewForm'
import ReviewCard from './ReviewCard'
import styles from './ReviewModal.module.css'

/**
 * Modal para crear/editar/ver reseña de una cita.
 * 
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {object} appointment - Objeto de cita
 * @param {object} review - Reseña existente (null si no hay)
 * @param {boolean} loading - Si está cargando/enviando
 * @param {function} onCreateOrUpdate - Callback al crear/actualizar: (rating, comment)
 * @param {function} onDelete - Callback para eliminar reseña
 * @param {function} onClose - Callback al cerrar modal
 */
export default function ReviewModal({
  isOpen,
  appointment,
  review,
  loading,
  onCreateOrUpdate,
  onDelete,
  onClose,
}) {
  if (!isOpen) return null

  const hasReview = !!review
  const appointmentDate = new Date(appointment.start_time).toLocaleDateString('es-ES')

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>
              {hasReview ? 'Tu Reseña' : 'Dejar una Reseña'}
            </h2>
            <p className={styles.subtitle}>{appointmentDate}</p>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            title="Cerrar"
          >
            <X size={24} />
          </button>
        </div>

        <div className={styles.content}>
          {hasReview ? (
            <>
              <ReviewCard
                review={review}
                isOwner={true}
                onDelete={onDelete}
                loading={loading}
              />
              <div className={styles.divider}>
                <span>O editar tu reseña</span>
              </div>
              <ReviewForm
                appointmentId={appointment.id}
                initialReview={review}
                onSubmit={({ rating, comment }) => onCreateOrUpdate(rating, comment)}
                loading={loading}
                onCancel={onClose}
              />
            </>
          ) : (
            <ReviewForm
              appointmentId={appointment.id}
              initialReview={null}
              onSubmit={({ rating, comment }) => onCreateOrUpdate(rating, comment)}
              loading={loading}
              onCancel={onClose}
            />
          )}
        </div>
      </div>
    </div>
  )
}
