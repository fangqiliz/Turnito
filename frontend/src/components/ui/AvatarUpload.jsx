import { useRef, useState } from 'react'
import { Camera, Loader2, AlertCircle } from 'lucide-react'
import { uploadAvatar } from '../../services/uploads.service'
import styles from './AvatarUpload.module.css'

/**
 * AvatarUpload – Componente reutilizable para subir el avatar del usuario.
 *
 * Props:
 *  @param {string}   currentUrl  – URL actual del avatar (para preview inicial)
 *  @param {string}   name        – Nombre del usuario (para las iniciales de fallback)
 *  @param {function} onSuccess   – Callback(url: string) llamado cuando la subida termina OK
 *  @param {string}   [size]      – Tamaño visual ('sm' | 'md' | 'lg' | 'xl'), default 'xl'
 */
export default function AvatarUpload({ currentUrl, name, onSuccess, size = 'xl' }) {
  const inputRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(currentUrl || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const sizeMap = { sm: 48, md: 64, lg: 80, xl: 96 }
  const px = sizeMap[size] ?? 96

  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Preview instantáneo (optimista)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    setLoading(true)
    try {
      const url = await uploadAvatar(file)
      // Liberar blob de preview y usar la URL definitiva del servidor
      URL.revokeObjectURL(objectUrl)
      setPreviewUrl(url)
      onSuccess?.(url)
    } catch (err) {
      // Revertir preview si falla
      URL.revokeObjectURL(objectUrl)
      setPreviewUrl(currentUrl || null)
      setError(err.message || 'Error al subir el avatar. Intenta de nuevo.')
    } finally {
      setLoading(false)
      // Reset input para poder subir el mismo archivo dos veces
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={styles.uploadZone}>
      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        aria-label="Seleccionar avatar"
        id="avatar-upload-input"
      />

      {/* Trigger clickeable */}
      <button
        type="button"
        className={styles.avatarTrigger}
        onClick={() => !loading && inputRef.current?.click()}
        disabled={loading}
        aria-label="Cambiar avatar"
        title="Haz clic para cambiar tu foto de perfil"
        style={{ width: px, height: px }}
      >
        {/* Imagen de preview o placeholder */}
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={name || 'Avatar'}
            className={styles.preview}
            style={{ width: px, height: px }}
            onError={() => setPreviewUrl(null)}
          />
        ) : (
          <div className={styles.placeholder} style={{ width: px, height: px }}>
            <span style={{ fontSize: px * 0.35, fontWeight: 700, lineHeight: 1 }}>
              {initials}
            </span>
          </div>
        )}

        {/* Overlay de loading */}
        {loading && (
          <div className={styles.loadingOverlay}>
            <Loader2 size={px * 0.3} className={styles.spin} />
          </div>
        )}

        {/* Overlay de cámara (hover) */}
        {!loading && (
          <div className={styles.overlay}>
            <Camera size={px * 0.28} />
          </div>
        )}
      </button>

      {/* Pista de formato y error */}
      <div className={styles.info}>
        <p className={styles.hint}>JPG, PNG o WEBP · Máx. 5 MB</p>
        {error && (
          <p className={styles.error}>
            <AlertCircle size={12} />
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
