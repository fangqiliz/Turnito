import crypto from 'crypto';
import path from 'path';
import supabase from '../../config/supabase.js';
import ApiError from '../../utils/apiError.js';

/**
 * Servicio encargado de gestionar las operaciones de subida a Supabase Storage
 * y la validación de permisos requerida para el módulo Uploads.
 */
class UploadsService {
  /**
   * Sube un archivo en memoria a un bucket y ruta específicos de Supabase Storage.
   * 
   * @param {object} file - Objeto de archivo de multer (memoryStorage)
   * @param {string} bucket - Nombre del bucket de almacenamiento (ej. 'avatars', 'business-logos')
   * @param {string} folderPath - Ruta de la carpeta dentro del bucket (ej. '{userId}' o '{businessId}')
   * @param {object} client - Cliente de Supabase admin
   * @returns {Promise<string>} URL pública del archivo subido
   */
  async uploadFile(file, bucket, folderPath, client = supabase) {
    const fileExtension = path.extname(file.originalname) || '.jpg';
    const uniqueFileName = `${Date.now()}-${crypto.randomUUID()}${fileExtension}`;
    const fullPath = `${folderPath}/${uniqueFileName}`;

    // Subir el archivo al bucket de Supabase Storage
    const { data, error } = await client.storage
      .from(bucket)
      .upload(fullPath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw ApiError.badRequest(`Error al subir el archivo a Supabase Storage: ${error.message}`);
    }

    // Obtener la URL pública del archivo
    const { data: publicUrlData } = client.storage
      .from(bucket)
      .getPublicUrl(fullPath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw ApiError.internal('No se pudo generar la URL pública del archivo subido.');
    }

    return publicUrlData.publicUrl;
  }

  /**
   * Valida si el usuario tiene permisos suficientes para subir archivos a un negocio.
   * El usuario debe ser el propietario del negocio o un empleado activo con rol: 'owner', 'admin' o 'manager'.
   * 
   * @param {string} businessId - UUID del negocio
   * @param {string} userId - UUID del usuario solicitante
   * @param {object} client - Cliente de Supabase admin
   * @returns {Promise<boolean>} Retorna true si tiene permisos
   */
  async validateBusinessPermissions(businessId, userId, client = supabase) {
    // 1. Validar que el negocio exista
    const { data: business, error: businessError } = await client
      .from('businesses')
      .select('id, owner_id')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      throw ApiError.notFound(`El negocio con ID "${businessId}" no existe.`);
    }

    // 2. Si el usuario es el dueño directo (owner_id), tiene permisos automáticos
    if (business.owner_id === userId) {
      return true;
    }

    // 3. Verificar si es un empleado activo con rol autorizado
    const { data: employee, error: employeeError } = await client
      .from('employees')
      .select('role, is_active')
      .eq('business_id', businessId)
      .eq('profile_id', userId)
      .single();

    if (employeeError || !employee || !employee.is_active) {
      throw ApiError.forbidden('No tienes permisos de acceso en este negocio.');
    }

    const allowedRoles = ['owner', 'admin', 'manager'];
    if (!allowedRoles.includes(employee.role)) {
      throw ApiError.forbidden('Acceso denegado: no tienes permisos de administración en este negocio.');
    }

    return true;
  }
}

export default new UploadsService();
