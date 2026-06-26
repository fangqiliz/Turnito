import multer from 'multer';
import ApiError from '../utils/apiError.js';

// Configurable constants
export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      ApiError.badRequest(
        `Formato de archivo no permitido. Tipos permitidos: ${ALLOWED_MIME_TYPES.map(type => type.split('/')[1]).join(', ')}`
      ),
      false
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter,
});

/**
 * Middleware wrapper to handle a single file upload using multer.
 * Gracefully formats and catches multer-specific errors, converting them into ApiError.
 *
 * @param {string} fieldName - The name of the multipart form field containing the file.
 * @returns {function} Express middleware
 */
export const uploadSingleImage = (fieldName) => {
  const multerUpload = upload.single(fieldName);

  return (req, res, next) => {
    multerUpload(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(
              ApiError.badRequest(
                `El archivo es demasiado grande. El tamaño máximo permitido es de ${MAX_FILE_SIZE_MB}MB.`
              )
            );
          }
          return next(ApiError.badRequest(`Error de subida de archivo: ${err.message}`));
        }
        return next(err);
      }

      // Check if file was actually uploaded
      if (!req.file) {
        return next(ApiError.badRequest('Archivo no enviado. Asegúrate de incluir el archivo en la solicitud.'));
      }

      next();
    });
  };
};
