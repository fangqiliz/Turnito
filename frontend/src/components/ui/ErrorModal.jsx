import { useEffect } from 'react'
import { AlertCircle, X } from 'lucide-react'
import styles from './ErrorModal.module.css'

/**
 * Modal de error que se auto-cierra después de un tiempo
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {string} message - Mensaje de error a mostrar
 * @param {function} onClose - Función para cerrar el modal
 * @param {number} [autoCloseDuration=5000] - Duración en ms antes de auto-cerrar (0 = no cerrar)
 */
export default function ErrorModal({ isOpen, message, onClose, autoCloseDuration = 5000 }) {
  useEffect(() => {
    if (!isOpen || autoCloseDuration === 0) return

    const timer = setTimeout(onClose, autoCloseDuration)
    return () => clearTimeout(timer)
  }, [isOpen, autoCloseDuration, onClose])

  if (!isOpen || !message) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.errorModal}>
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <AlertCircle size={24} className={styles.icon} />
            <h2 className={styles.title}>Error</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <div className={styles.body}>
          <p className={styles.message}>{message}</p>
        </div>
        <div className={styles.footer}>
          <button className={styles.dismissBtn} onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
