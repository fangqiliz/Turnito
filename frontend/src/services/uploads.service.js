import api from '../config/api'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
const MAX_SIZE_MB = 5

/**
 * Valida un archivo de imagen antes de enviarlo al backend.
 * @param {File} file
 * @throws {Error} Si el archivo no es válido
 */
export function validateImageFile(file) {
  if (!file) {
    throw new Error('No se seleccionó ningún archivo.')
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      `Formato no válido. Solo se permiten: ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()}.`
    )
  }

  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > MAX_SIZE_MB) {
    throw new Error(`El archivo supera el límite de ${MAX_SIZE_MB} MB.`)
  }
}

/**
 * Sube el avatar del usuario autenticado.
 * POST /upload/avatar
 *
 * @param {File} file - Imagen seleccionada
 * @returns {Promise<string>} URL pública del avatar subido
 */
export async function uploadAvatar(file) {
  validateImageFile(file)

  const formData = new FormData()
  formData.append('file', file)

  const response = await api.upload('/upload/avatar', formData)
  return response.data.url
}

/**
 * Sube el logo de un negocio.
 * POST /upload/logo
 *
 * @param {File} file - Imagen seleccionada
 * @returns {Promise<string>} URL pública del logo subido
 */
export async function uploadLogo(file, businessId) {
  validateImageFile(file)

  const formData = new FormData()
  formData.append('file', file)
  formData.append('businessId', String(businessId))

  const response = await api.upload('/upload/logo', formData)
  return response.data.url
}

const uploadsService = { uploadAvatar, uploadLogo, validateImageFile }
export default uploadsService
