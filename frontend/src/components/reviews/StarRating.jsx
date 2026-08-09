import { Star } from 'lucide-react'
import styles from './StarRating.module.css'

/**
 * Componente para mostrar o seleccionar calificación de estrellas.
 * 
 * @param {number} rating - Calificación actual (1-5)
 * @param {function} onChange - Callback cuando se cambia el rating (opcional, modo lectura si no se proporciona)
 * @param {number} size - Tamaño de las estrellas en píxeles (default: 20)
 */
export default function StarRating({ rating = 0, onChange, size = 20 }) {
  const isInteractive = onChange !== undefined

  return (
    <div className={`${styles.starRating} ${isInteractive ? styles.interactive : styles.static}`}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => isInteractive && onChange(star)}
          disabled={!isInteractive}
          className={`${styles.star} ${star <= rating ? styles.filled : styles.empty}`}
          title={`${star} estrellas`}
          aria-label={`Calificar ${star} estrellas`}
        >
          <Star
            size={size}
            fill={star <= rating ? 'currentColor' : 'none'}
            strokeWidth={1.5}
          />
        </button>
      ))}
      {rating > 0 && (
        <span className={styles.ratingText}>
          {rating.toFixed(1)}/5.0
        </span>
      )}
    </div>
  )
}
