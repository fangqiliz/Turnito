import { Router } from 'express';
import userController from './user.controller.js';
import { updateProfileSchema } from './user.validation.js';
import validate from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.js';

const router = Router();

/**
 * @route GET /users/me
 * @desc Obtiene la información del perfil del usuario autenticado
 * @access Privado (Requiere Token)
 */
router.get('/me', requireAuth, userController.getMe);

/**
 * @route PUT /users/me
 * @desc Actualiza el perfil del usuario autenticado
 * @access Privado (Requiere Token)
 */
router.put('/me', requireAuth, validate({ body: updateProfileSchema }), userController.updateMe);

export default router;
