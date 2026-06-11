import supabase from '../../config/supabase.js';
import ApiError from '../../utils/apiError.js';

/**
 * Servicio encargado de la lógica de negocio para el módulo Businesses.
 * Interactúa directamente con la tabla `public.businesses` en Supabase.
 */
class BusinessService {
  /**
   * Crea un nuevo negocio asociado al usuario autenticado como propietario.
   * Verifica que el slug sea único antes de insertar.
   *
   * @param {object} payload - Datos del negocio
   * @param {string} payload.name        - Nombre del negocio
   * @param {string} payload.slug        - Slug único (URL-safe)
   * @param {string} [payload.description]
   * @param {string} [payload.phone]
   * @param {string} [payload.address]
   * @param {string} [payload.logo_url]
   * @param {string} ownerId - UUID del usuario propietario (auth.users)
   * @returns {Promise<object>} Negocio creado
   */
  async create(payload, ownerId) {
    const { name, slug, description, phone, address, logo_url } = payload;

    // Verificar unicidad del slug antes de intentar insertar
    const { data: existing } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      throw ApiError.badRequest(
        `El slug "${slug}" ya está en uso. Elige otro identificador para tu negocio.`
      );
    }

    const { data: business, error } = await supabase
      .from('businesses')
      .insert({
        owner_id: ownerId,
        name,
        slug,
        description: description ?? null,
        phone: phone ?? null,
        address: address ?? null,
        logo_url: logo_url ?? null,
      })
      .select()
      .single();

    if (error) {
      // Captura de violación de unicidad a nivel DB (condición de carrera)
      if (error.code === '23505') {
        throw ApiError.badRequest(
          `El slug "${slug}" ya está en uso. Elige otro identificador para tu negocio.`
        );
      }
      throw ApiError.internal(`Error al crear el negocio: ${error.message}`);
    }

    return business;
  }

  /**
   * Retorna la lista de todos los negocios registrados.
   * Los resultados se ordenan por fecha de creación (más reciente primero).
   *
   * @returns {Promise<object[]>} Lista de negocios
   */
  async findAll() {
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, name, slug, description, phone, address, logo_url, owner_id, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw ApiError.internal(`Error al obtener los negocios: ${error.message}`);
    }

    return businesses;
  }

  /**
   * Obtiene un negocio por su identificador único (UUID).
   * Incluye información del propietario (perfil).
   *
   * @param {string} businessId - UUID del negocio
   * @returns {Promise<object>} Negocio encontrado
   */
  async findById(businessId) {
    const { data: business, error } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        slug,
        description,
        phone,
        address,
        logo_url,
        owner_id,
        created_at,
        updated_at,
        owner:owner_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('id', businessId)
      .single();

    if (error || !business) {
      throw ApiError.notFound(`Negocio con id "${businessId}" no encontrado`);
    }

    return business;
  }

  /**
   * Actualiza los campos de un negocio existente.
   * Valida que el usuario solicitante sea el propietario del negocio (ownership check).
   * Si se modifica el slug, verifica que el nuevo slug no esté ya en uso.
   *
   * @param {string}  businessId  - UUID del negocio a actualizar
   * @param {object}  payload     - Campos a actualizar
   * @param {string}  requesterId - UUID del usuario que hace la solicitud
   * @returns {Promise<object>} Negocio actualizado
   */
  async update(businessId, payload, requesterId) {
    // 1. Obtener el negocio para validar ownership
    const { data: business, error: fetchError } = await supabase
      .from('businesses')
      .select('id, owner_id')
      .eq('id', businessId)
      .single();

    if (fetchError || !business) {
      throw ApiError.notFound(`Negocio con id "${businessId}" no encontrado`);
    }

    // 2. Validar que el solicitante es el propietario
    if (business.owner_id !== requesterId) {
      throw ApiError.forbidden(
        'No tienes permisos para modificar este negocio. Solo el propietario puede realizar esta acción.'
      );
    }

    // 3. Si se intenta cambiar el slug, verificar unicidad
    if (payload.slug) {
      const { data: slugConflict } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', payload.slug)
        .neq('id', businessId)
        .maybeSingle();

      if (slugConflict) {
        throw ApiError.badRequest(
          `El slug "${payload.slug}" ya está en uso por otro negocio.`
        );
      }
    }

    // 4. Realizar la actualización
    const { data: updated, error: updateError } = await supabase
      .from('businesses')
      .update(payload)
      .eq('id', businessId)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        throw ApiError.badRequest(
          `El slug "${payload.slug}" ya está en uso por otro negocio.`
        );
      }
      throw ApiError.internal(`Error al actualizar el negocio: ${updateError.message}`);
    }

    return updated;
  }
}

export default new BusinessService();
