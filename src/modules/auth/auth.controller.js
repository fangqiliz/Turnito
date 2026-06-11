import authService from './auth.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

/**
 * Controlador de Autenticación
 */
class AuthController {
  /**
   * Registro de un nuevo usuario
   */
  register = async (req, res, next) => {
    try {
      const { email, password, fullName, avatarUrl } = req.body;
      
      const result = await authService.register(email, password, fullName, avatarUrl);
      
      return sendSuccess(
        res,
        'Usuario registrado correctamente.',
        result,
        201
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Inicio de sesión del usuario
   */
  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      
      const result = await authService.login(email, password);
      
      return sendSuccess(
        res,
        'Inicio de sesión exitoso.',
        result,
        200
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cierre de sesión del usuario (invalida el token JWT)
   */
  logout = async (req, res, next) => {
    try {
      // req.token es inyectado por el middleware requireAuth
      await authService.logout(req.token);
      
      return sendSuccess(
        res,
        'Cierre de sesión exitoso y sesión terminada.',
        null,
        200
      );
    } catch (error) {
      next(error);
    }
  };
}

export default new AuthController();
