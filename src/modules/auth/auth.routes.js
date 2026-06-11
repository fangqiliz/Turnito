import { Router } from 'express';
import authController from './auth.controller.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import validate from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.js';

const router = Router();

/**
 * @route POST /auth/register
 * @desc Registra un nuevo usuario y crea su perfil
 * @access Público
 */
router.post('/register', validate({ body: registerSchema }), authController.register);

/**
 * @route POST /auth/login
 * @desc Inicia sesión de usuario y retorna tokens JWT
 * @access Público
 */
router.post('/login', validate({ body: loginSchema }), authController.login);

/**
 * @route POST /auth/logout
 * @desc Cierra la sesión activa invalidando el token JWT
 * @access Privado (Requiere Token)
 */
router.post('/logout', requireAuth, authController.logout);

export default router;
