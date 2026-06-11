import supabase from '../../config/supabase.js';
import ApiError from '../../utils/apiError.js';

/**
 * Servicio para gestionar la información de los usuarios y sus perfiles
 */
class UserService {
  /**
   * Obtiene la información del perfil del usuario junto con sus roles en diferentes negocios.
   * Esto proporciona un contexto completo de multi-tenant al usuario autenticado.
   * 
   * @param {string} userId - ID del usuario (UUID de auth.users)
   */
  async getProfile(userId) {
    // 1. Obtener los datos básicos del perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw ApiError.notFound('Perfil de usuario no encontrado');
    }

    // 2. Obtener los negocios de los cuales el usuario es dueño
    const { data: ownedBusinesses, error: ownedError } = await supabase
      .from('businesses')
      .select('id, name, slug, logo_url, created_at')
      .eq('owner_id', userId);

    // 3. Obtener los negocios en los que trabaja como empleado
    const { data: employeeRoles, error: employeeError } = await supabase
      .from('employees')
      .select(`
        id,
        role,
        is_active,
        business:business_id (
          id,
          name,
          slug,
          logo_url
        )
      `)
      .eq('profile_id', userId);

    return {
      profile,
      roles: {
        ownedBusinesses: ownedError ? [] : ownedBusinesses,
        employeeRoles: employeeError ? [] : employeeRoles.map((role) => ({
          employeeId: role.id,
          role: role.role,
          isActive: role.is_active,
          business: role.business,
        })),
      },
    };
  }

  /**
   * Actualiza los datos de perfil de un usuario (Nombre y/o Avatar).
   * 
   * @param {string} userId - ID del usuario
   * @param {object} updatePayload - Datos a actualizar
   * @param {string} [updatePayload.fullName]
   * @param {string} [updatePayload.avatarUrl]
   */
  async updateProfile(userId, updatePayload) {
    const updateData = {};
    
    if (updatePayload.fullName !== undefined) {
      updateData.full_name = updatePayload.fullName;
    }
    if (updatePayload.avatarUrl !== undefined) {
      updateData.avatar_url = updatePayload.avatarUrl;
    }

    if (Object.keys(updateData).length === 0) {
      throw ApiError.badRequest('No se proporcionaron datos válidos para actualizar');
    }

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw ApiError.badRequest(`Error al actualizar el perfil: ${error.message}`);
    }

    return updatedProfile;
  }
}

export default new UserService();
