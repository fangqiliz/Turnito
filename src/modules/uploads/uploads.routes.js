import { Router } from 'express';
import uploadsController from './uploads.controller.js';
import { uploadLogoSchema } from './uploads.validation.js';
import validate from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.js';
import { uploadSingleImage } from '../../middlewares/upload.js';

const router = Router();

/**
 * @route   POST /upload/avatar
 * @desc    Sube una imagen de perfil para el usuario autenticado
 * @access  Privado (Requiere Bearer Token)
 * @body    multipart/form-data { file: <File> }
 */
router.post(
  '/avatar',
  requireAuth,
  uploadSingleImage('file'),
  uploadsController.uploadAvatar
);

/**
 * @route   POST /upload/logo
 * @desc    Sube el logo de un negocio tras validar permisos
 * @access  Privado (Requiere Bearer Token + permisos en el negocio)
 * @body    multipart/form-data { file: <File>, businessId: <string> }
 */
router.post(
  '/logo',
  requireAuth,
  uploadSingleImage('file'),
  validate({ body: uploadLogoSchema }),
  uploadsController.uploadLogo
);

export default router;
