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
   * Retorna la lista de negocios registrados, paginada.
   * Los resultados se ordenan por fecha de creación (más reciente primero).
   *
   * Mismo formato de respuesta paginada que appointment.service.js
   * (findByUser / findByBusiness): { data, total, page, limit }.
   *
   * @param {object} [query]        - Filtros/paginación
   * @param {string} [query.slug]   - Filtra por slug exacto (ej. búsqueda de un único negocio)
   * @param {number} [query.page]   - Página solicitada (default: 1)
   * @param {number} [query.limit]  - Tamaño de página (default: 20, max: 100)
   * @returns {Promise<{data: object[], total: number, page: number, limit: number}>}
   */
  async findAll(query = {}) {
    const { slug, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    let dbQuery = supabase
      .from('businesses')
      .select(
        'id, name, slug, description, phone, address, logo_url, owner_id, created_at, updated_at',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (slug) {
      dbQuery = dbQuery.eq('slug', slug);
    }

    const { data: businesses, error, count } = await dbQuery;

    if (error) {
      throw ApiError.internal(`Error al obtener los negocios: ${error.message}`);
    }

    return { data: businesses, total: count, page, limit };
  }

  /**
   * Obtiene un negocio por su identificador único (UUID).
   * Incluye información pública del propietario (perfil).
   *
   * Nota: este endpoint es de lectura semi-pública (alimenta la ficha del
   * negocio en el flujo de reserva de clientes), por lo que el `owner` NO
   * incluye `email` — solo datos de presentación (nombre y avatar).
   *
   * @param {string} businessId - UUID del negocio
   * @returns {Promise<object>} Negocio encontrado
   */
  async findById(businessId) {
    const { data, error } = await supabase
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
          avatar_url
        )
      `)
      .eq('id', businessId)
      .maybeSingle();

    if (error) {
      throw ApiError.internal(`Error al obtener el negocio: ${error.message}`);
    }

    if (!data) {
      throw ApiError.notFound(`Negocio con id "${businessId}" no encontrado`);
    }

    return data;
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
