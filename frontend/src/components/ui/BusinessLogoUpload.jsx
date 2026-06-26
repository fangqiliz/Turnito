import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Camera, AlertCircle, X } from 'lucide-react'
import { uploadLogo } from '../../services/uploads.service'
import styles from './BusinessLogoUpload.module.css'

/**
 * BusinessLogoUpload – Componente reutilizable para subir el logo de un negocio.
 *
 * Props:
 *  @param {string}   currentUrl  – URL actual del logo (para preview inicial)
 *  @param {function} onSuccess   – Callback(url: string) llamado cuando la subida termina OK
 *  @param {string}   [label]     – Etiqueta visible sobre el dropzone, default 'Logo del Negocio'
 *  @param {boolean}  [disabled]  – Deshabilitar el componente (ej. cuando el form está enviándose)
 */
export default function BusinessLogoUpload({
  currentUrl,
  onSuccess,
  businessId,
  label = 'Logo del Negocio',
  disabled = false,
}) {
  const inputRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(currentUrl || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isInteractive = !disabled && !loading

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Preview optimista inmediato
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    setLoading(true)
    try {
      const url = await uploadLogo(file, businessId)
      URL.revokeObjectURL(objectUrl)
      setPreviewUrl(url)
      onSuccess?.(url)
    } catch (err) {
      URL.revokeObjectURL(objectUrl)
      setPreviewUrl(currentUrl || null)
      setError(err.message || 'Error al subir el logo. Intenta de nuevo.')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setPreviewUrl(null)
    setError(null)
    onSuccess?.('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={styles.uploadArea}>
      {label && <span className={styles.label}>{label}</span>}

      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={!isInteractive}
        aria-label="Seleccionar logo del negocio"
        id="logo-upload-input"
      />

      {/* Dropzone clickeable */}
      <button
        type="button"
        className={`${styles.dropzone} ${previewUrl ? styles.hasPreview : ''}`}
        onClick={() => isInteractive && inputRef.current?.click()}
        disabled={!isInteractive}
        aria-label="Subir logo del negocio"
        title="Haz clic para seleccionar un logo"
        style={{ cursor: isInteractive ? 'pointer' : 'default' }}
      >
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Logo del negocio"
              className={styles.preview}
              onError={() => setPreviewUrl(null)}
            />
            {/* Overlay hover con cámara */}
            {!loading && (
              <div className={styles.previewOverlay}>
                <Camera size={18} />
                <span>Cambiar logo</span>
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyContent}>
            <ImagePlus size={32} />
            <span className={styles.emptyText}>Haz clic para subir tu logo</span>
            <span className={styles.emptyHint}>JPG, PNG o WEBP · Máx. 5 MB</span>
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className={styles.loadingOverlay}>
            <Loader2 size={20} className={styles.spin} />
            <span>Subiendo logo…</span>
          </div>
        )}
      </button>

      {/* Footer: hint + botón limpiar */}
      <div className={styles.footer}>
        <span className={styles.hint}>
          {previewUrl ? 'Haz clic en la imagen para cambiarla.' : 'Formatos: JPG, PNG, WEBP'}
        </span>
        {previewUrl && !loading && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: 'var(--font-size-xs)',
              padding: '2px 4px',
              borderRadius: 'var(--radius-sm)',
              transition: 'color var(--transition-fast)',
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
            aria-label="Quitar logo"
          >
            <X size={12} />
            Quitar
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className={styles.error}>
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  )
}
