import userService from './user.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { createAuthenticatedClient } from '../../config/supabase.js';

/**
 * Controlador de Usuarios / Perfiles
 */
class UserController {
  /**
   * Obtiene la información del perfil del usuario autenticado
   */
  getMe = async (req, res, next) => {
    try {
      // req.user es inyectado por el middleware requireAuth
      const userId = req.user.id;
      
      // Crear un cliente autenticado con el JWT del usuario
      const authenticatedClient = createAuthenticatedClient(req.token);
      const profileData = await userService.getProfile(userId, authenticatedClient);
      
      return sendSuccess(
        res,
        'Perfil obtenido correctamente.',
        profileData,
        200
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualiza el perfil del usuario autenticado
   */
  updateMe = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { fullName, avatarUrl } = req.body;
      
      // Crear un cliente autenticado con el JWT del usuario
      const authenticatedClient = createAuthenticatedClient(req.token);
      const updatedProfile = await userService.updateProfile(userId, {
        fullName,
        avatarUrl,
      }, authenticatedClient);
      
      return sendSuccess(
        res,
        'Perfil actualizado correctamente.',
        updatedProfile,
        200
      );
    } catch (error) {
      next(error);
    }
  };
}

export default new UserController();
