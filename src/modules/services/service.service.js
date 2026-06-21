import supabase from '../../config/supabase.js';
import ApiError from '../../utils/apiError.js';

/**
 * Servicio del módulo Services.
 *
 * Gestiona la lógica de negocio multi-tenant para servicios de un negocio:
 *  – Valida existencia del negocio (tenant).
 *  – Valida existencia del servicio antes de actualizar / eliminar.
 *  – Valida ownership: solo el propietario del negocio gestiona sus servicios.
 *  – Soporta soft-delete (is_active = false) y hard-delete.
 */
class ServiceService {
  // ──────────────────────────────────────────────────────────────
  // Helpers privados
  // ──────────────────────────────────────────────────────────────

  /**
   * Verifica que el negocio exista y lo retorna.
   * @private
   * @param {string} businessId
   * @returns {Promise<object>} Registro del negocio
   */
  async #assertBusinessExists(businessId) {
    const { data: business, error } = await supabase
      .from('businesses')
      .select('id, owner_id, name')
      .eq('id', businessId)
      .single();

    if (error || !business) {
      throw ApiError.notFound(`El negocio con id "${businessId}" no existe.`);
    }

    return business;
  }

  /**
   * Verifica que el servicio exista dentro del tenant y lo retorna.
   * @private
   * @param {string} serviceId
   * @param {string} businessId
   * @returns {Promise<object>} Registro del servicio
   */
  async #assertServiceExists(serviceId, businessId) {
    const { data: service, error } = await supabase
      .from('services')
      .select('id, business_id, name, is_active')
      .eq('id', serviceId)
      .eq('business_id', businessId)
      .single();

    if (error || !service) {
      throw ApiError.notFound(
        `El servicio con id "${serviceId}" no existe en este negocio.`
      );
    }

    return service;
  }

  /**
   * Verifica que el solicitante sea el propietario del negocio.
   * @private
   * @param {object} business   - Registro del negocio (debe contener owner_id)
   * @param {string} requesterId
   */
  #assertIsOwner(business, requesterId) {
    if (business.owner_id !== requesterId) {
      throw ApiError.forbidden(
        'Solo el propietario del negocio puede gestionar sus servicios.'
      );
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Métodos públicos
  // ──────────────────────────────────────────────────────────────

  /**
   * Crea un nuevo servicio para un negocio.
   *
   * @param {object} payload     - Datos validados (Zod)
   * @param {string} requesterId - UUID del usuario autenticado
   * @param {object} [authenticatedClient] - Cliente Supabase autenticado con JWT del usuario (para RLS)
   * @returns {Promise<object>}  Servicio creado
   */
  async create(payload, requesterId, authenticatedClient = null) {
    const client = authenticatedClient ?? supabase;
    const { business_id, name, description, price, duration_minutes, is_active } = payload;

    // 1. Validar existencia del negocio y ownership
    const business = await this.#assertBusinessExists(business_id);
    this.#assertIsOwner(business, requesterId);

    // 2. Insertar el servicio
    const { data: service, error } = await client
      .from('services')
      .insert({
        business_id,
        name,
        description:      description      ?? null,
        price:            price             ?? 0,
        duration_minutes: duration_minutes,
        is_active:        is_active         ?? true,
      })
      .select()
      .single();

    if (error) {
      throw ApiError.internal(`Error al crear el servicio: ${error.message}`);
    }

    return service;
  }

  /**
   * Retorna todos los servicios de un negocio.
   * Los usuarios autenticados ven todos (activos e inactivos).
   * El filtrado público de solo activos ocurre vía RLS en Supabase.
   *
   * @param {string} businessId  - UUID del negocio (tenant)
   * @returns {Promise<object[]>} Lista de servicios ordenados por nombre
   */
  async findByBusiness(businessId) {
    // Validar que el negocio exista
    await this.#assertBusinessExists(businessId);

    const { data: services, error } = await supabase
      .from('services')
      .select(
        'id, business_id, name, description, price, duration_minutes, is_active, created_at, updated_at'
      )
      .eq('business_id', businessId)
      .order('name', { ascending: true });

    if (error) {
      throw ApiError.internal(`Error al obtener los servicios: ${error.message}`);
    }

    return services;
  }

  /**
   * Actualiza los datos de un servicio existente.
   *
   * @param {string} serviceId   - UUID del servicio
   * @param {string} businessId  - UUID del negocio (contexto multi-tenant)
   * @param {object} payload     - Campos a actualizar (validados por Zod)
   * @param {string} requesterId - UUID del usuario autenticado
   * @param {object} [authenticatedClient] - Cliente Supabase autenticado con JWT del usuario (para RLS)
   * @returns {Promise<object>}  Servicio actualizado
   */
  async update(serviceId, businessId, payload, requesterId, authenticatedClient = null) {
    const client = authenticatedClient ?? supabase;
    // 1. Validar existencia del negocio y ownership
    const business = await this.#assertBusinessExists(businessId);
    this.#assertIsOwner(business, requesterId);

    // 2. Validar existencia del servicio en el tenant
    await this.#assertServiceExists(serviceId, businessId);

    // 3. Actualizar
    const { data: updated, error } = await client
      .from('services')
      .update(payload)
      .eq('id', serviceId)
      .select()
      .single();

    if (error) {
      throw ApiError.internal(`Error al actualizar el servicio: ${error.message}`);
    }

    return updated;
  }

  /**
   * Elimina un servicio del negocio.
   *
   * Estrategia por defecto: SOFT DELETE (is_active = false).
   * Si se pasa `{ hard: true }` en las opciones se realiza hard delete.
   *
   * El soft-delete preserva la integridad referencial con la tabla
   * `appointments` (que referencia service_id con ON DELETE RESTRICT).
   *
   * @param {string}  serviceId   - UUID del servicio
   * @param {string}  businessId  - UUID del negocio (contexto multi-tenant)
   * @param {string}  requesterId - UUID del usuario autenticado
   * @param {object}  [opts]      - Opciones adicionales
   * @param {boolean} [opts.hard] - Si true, realiza hard delete
   * @param {object} [authenticatedClient] - Cliente Supabase autenticado con JWT del usuario (para RLS)
   * @returns {Promise<object|true>} Servicio desactivado o true si hard delete
   */
  async remove(serviceId, businessId, requesterId, opts = { hard: false }, authenticatedClient = null) {
    const client = authenticatedClient ?? supabase;
    // 1. Validar existencia del negocio y ownership
    const business = await this.#assertBusinessExists(businessId);
    this.#assertIsOwner(business, requesterId);

    // 2. Validar existencia del servicio en el tenant
    await this.#assertServiceExists(serviceId, businessId);

    // 3a. Hard delete
    if (opts.hard) {
      const { error } = await client
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) {
        // ON DELETE RESTRICT puede impedir eliminación si hay citas activas
        if (error.code === '23503') {
          throw ApiError.badRequest(
            'No se puede eliminar el servicio porque tiene citas asociadas activas. ' +
            'Desactívalo en su lugar (soft delete).'
          );
        }
        throw ApiError.internal(`Error al eliminar el servicio: ${error.message}`);
      }

      return true;
    }

    // 3b. Soft delete: marcar como inactivo
    const { data: deactivated, error } = await client
      .from('services')
      .update({ is_active: false })
      .eq('id', serviceId)
      .select()
      .single();

    if (error) {
      throw ApiError.internal(`Error al desactivar el servicio: ${error.message}`);
    }

    return deactivated;
  }
}

export default new ServiceService();
