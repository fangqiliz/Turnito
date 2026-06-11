import supabase from '../../config/supabase.js';
import ApiError from '../../utils/apiError.js';

/**
 * Servicio del módulo Employees.
 * Gestiona la lógica de negocio multi-tenant para empleados:
 *  – Valida existencia del negocio (tenant).
 *  – Valida existencia del empleado antes de actualizar / eliminar.
 *  – Evita duplicados (business_id + profile_id únicos).
 *  – Valida ownership del negocio (solo el propietario puede gestionar empleados).
 */
class EmployeeService {
  // ──────────────────────────────────────────────────────────────
  // Helpers privados
  // ──────────────────────────────────────────────────────────────

  /**
   * Verifica que el negocio exista y retorna su registro.
   * @private
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
   * Verifica que el empleado exista dentro del contexto del negocio (multi-tenant).
   * @private
   */
  async #assertEmployeeExists(employeeId, businessId) {
    const { data: employee, error } = await supabase
      .from('employees')
      .select('id, business_id, profile_id, owner_id')
      .eq('id', employeeId)
      .eq('business_id', businessId)
      .single();

    if (error || !employee) {
      throw ApiError.notFound(
        `El empleado con id "${employeeId}" no existe en este negocio.`
      );
    }

    return employee;
  }

  /**
   * Verifica que el solicitante sea el propietario del negocio.
   * @private
   */
  #assertIsOwner(business, requesterId) {
    if (business.owner_id !== requesterId) {
      throw ApiError.forbidden(
        'Solo el propietario del negocio puede gestionar sus empleados.'
      );
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Métodos públicos
  // ──────────────────────────────────────────────────────────────

  /**
   * Registra un nuevo empleado en un negocio.
   *
   * Reglas:
   *  1. El negocio debe existir.
   *  2. El solicitante debe ser el propietario del negocio.
   *  3. Si se proporciona un profile_id, no puede existir ya en ese negocio
   *     (restricción UNIQUE business_id + profile_id).
   *
   * @param {object} payload   - Datos validados del empleado
   * @param {string} requesterId - UUID del usuario autenticado
   */
  async create(payload, requesterId) {
    const { business_id, profile_id } = payload;

    // 1. Validar existencia del negocio y ownership
    const business = await this.#assertBusinessExists(business_id);
    this.#assertIsOwner(business, requesterId);

    // 2. Evitar duplicado: mismo profile_id en el mismo negocio
    if (profile_id) {
      const { data: duplicate } = await supabase
        .from('employees')
        .select('id')
        .eq('business_id', business_id)
        .eq('profile_id', profile_id)
        .maybeSingle();

      if (duplicate) {
        throw ApiError.badRequest(
          'Este usuario ya está registrado como empleado en el negocio.'
        );
      }
    }

    // 3. Insertar
    const { data: employee, error } = await supabase
      .from('employees')
      .insert({
        business_id,
        profile_id: profile_id ?? null,
        full_name: payload.full_name,
        email:     payload.email ?? null,
        phone:     payload.phone ?? null,
        specialty: payload.specialty ?? null,
        role:      payload.role ?? 'staff',
        is_active: payload.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      // Captura de violación de unicidad a nivel DB (condición de carrera)
      if (error.code === '23505') {
        throw ApiError.badRequest(
          'Este usuario ya está registrado como empleado en el negocio.'
        );
      }
      throw ApiError.internal(`Error al crear el empleado: ${error.message}`);
    }

    return employee;
  }

  /**
   * Retorna la lista de empleados de un negocio (multi-tenant).
   * Incluye datos del perfil vinculado si existe.
   *
   * @param {string} businessId  - UUID del negocio (tenant)
   * @param {string} requesterId - UUID del usuario autenticado
   */
  async findByBusiness(businessId, requesterId) {
    // Validar que el negocio exista
    await this.#assertBusinessExists(businessId);

    const { data: employees, error } = await supabase
      .from('employees')
      .select(`
        id,
        business_id,
        profile_id,
        full_name,
        email,
        phone,
        specialty,
        role,
        is_active,
        created_at,
        updated_at,
        profile:profile_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      throw ApiError.internal(`Error al obtener empleados: ${error.message}`);
    }

    return employees;
  }

  /**
   * Actualiza los datos de un empleado existente.
   *
   * Reglas:
   *  1. El negocio y el empleado deben existir.
   *  2. El solicitante debe ser propietario del negocio.
   *  3. Si se cambia el profile_id, verificar que no genere duplicado.
   *
   * @param {string} employeeId  - UUID del empleado a actualizar
   * @param {string} businessId  - UUID del negocio (tenant) — extraído del registro
   * @param {object} payload     - Campos a actualizar (validados por Zod)
   * @param {string} requesterId - UUID del usuario autenticado
   */
  async update(employeeId, businessId, payload, requesterId) {
    // 1. Validar existencia del negocio y ownership
    const business = await this.#assertBusinessExists(businessId);
    this.#assertIsOwner(business, requesterId);

    // 2. Validar existencia del empleado dentro del tenant
    await this.#assertEmployeeExists(employeeId, businessId);

    // 3. Si se cambia el profile_id, verificar unicidad
    if (payload.profile_id !== undefined && payload.profile_id !== null) {
      const { data: conflict } = await supabase
        .from('employees')
        .select('id')
        .eq('business_id', businessId)
        .eq('profile_id', payload.profile_id)
        .neq('id', employeeId)
        .maybeSingle();

      if (conflict) {
        throw ApiError.badRequest(
          'El perfil seleccionado ya está vinculado a otro empleado en este negocio.'
        );
      }
    }

    // 4. Actualizar
    const { data: updated, error } = await supabase
      .from('employees')
      .update(payload)
      .eq('id', employeeId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw ApiError.badRequest(
          'El perfil seleccionado ya está vinculado a otro empleado en este negocio.'
        );
      }
      throw ApiError.internal(`Error al actualizar el empleado: ${error.message}`);
    }

    return updated;
  }

  /**
   * Elimina (soft-delete o hard-delete) un empleado del negocio.
   * Se realiza un hard-delete. Para soft-delete, cambiar a update is_active=false.
   *
   * Reglas:
   *  1. El negocio y el empleado deben existir.
   *  2. El solicitante debe ser propietario del negocio.
   *
   * @param {string} employeeId  - UUID del empleado
   * @param {string} businessId  - UUID del negocio (tenant)
   * @param {string} requesterId - UUID del usuario autenticado
   */
  async remove(employeeId, businessId, requesterId) {
    // 1. Validar existencia del negocio y ownership
    const business = await this.#assertBusinessExists(businessId);
    this.#assertIsOwner(business, requesterId);

    // 2. Validar existencia del empleado dentro del tenant
    await this.#assertEmployeeExists(employeeId, businessId);

    // 3. Eliminar
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', employeeId);

    if (error) {
      throw ApiError.internal(`Error al eliminar el empleado: ${error.message}`);
    }

    return true;
  }
}

export default new EmployeeService();
