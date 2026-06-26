import uploadsService from './uploads.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

/**
 * Controlador para gestionar la subida de archivos del módulo Uploads.
 */
class UploadsController {
  /**
   * Sube la imagen de perfil (avatar) del usuario autenticado.
   * Almacena el archivo en la ruta: avatars/{userId}/{archivo}
   */
  uploadAvatar = async (req, res, next) => {
    try {
      const userId = req.user.id;

      // Carpeta organizada por el ID del usuario
      const folderPath = userId;

      const publicUrl = await uploadsService.uploadFile(
        req.file,
        'avatars',
        folderPath
      );

      return sendSuccess(
        res,
        'Avatar de usuario subido correctamente.',
        { url: publicUrl },
        201
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Sube el logo de un negocio.
   * Almacena el archivo en la ruta: business-logos/{businessId}/{archivo}
   * Valida previamente que el usuario tenga permisos en el negocio.
   */
  uploadLogo = async (req, res, next) => {
    try {
      console.log('BODY:', req.body);
      console.log('BUSINESS_ID:', req.body.businessId);
      console.log('FILE:', req.file);

      const userId = req.user.id;
      const { businessId } = req.body;

      // Validar permisos del usuario sobre el negocio especificado
      await uploadsService.validateBusinessPermissions(
        businessId,
        userId
      );

      // Carpeta organizada por el ID del negocio
      const folderPath = businessId;

      const publicUrl = await uploadsService.uploadFile(
        req.file,
        'business-logos',
        folderPath
      );

      return sendSuccess(
        res,
        'Logo del negocio subido correctamente.',
        { url: publicUrl },
        201
      );
    } catch (error) {
      next(error);
    }
  };
}

export default new UploadsController();
