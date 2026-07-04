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
      .select('id, business_id, profile_id')
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
   * Flujo:
   *  1. Validar negocio y ownership.
   *  2. Crear usuario en Supabase Auth (email + password).
   *  3. Asegurar que el profile exista (trigger automático o upsert manual).
   *  4. Insertar en employees con profile_id del usuario creado.
   *  5. Si el insert falla, eliminar el usuario de Auth para evitar huérfanos.
   *
   * La contraseña NO se almacena en la tabla employees.
   *
   * @param {object} payload     - Datos validados del empleado (incluye password)
   * @param {string} requesterId - UUID del usuario autenticado
   */
  async create(payload, requesterId) {
    const { business_id, password, ...employeeData } = payload;

    // 1. Validar existencia del negocio y ownership
    const business = await this.#assertBusinessExists(business_id);
    this.#assertIsOwner(business, requesterId);

    // 2. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email:          employeeData.email,
      password,
      email_confirm:  true, // confirmar email sin necesidad de verificación
      user_metadata:  { full_name: employeeData.full_name },
    });

    if (authError) {
      const msg = authError.message ?? '';
      if (msg.toLowerCase().includes('already registered') || authError.code === 'email_exists') {
        throw ApiError.badRequest('Ya existe una cuenta registrada con ese email.');
      }
      throw ApiError.internal(`Error al crear la cuenta del empleado: ${msg}`);
    }

    const newUserId = authData.user.id;

    // 3. Garantizar que el profile exista (puede crearse via trigger de DB)
    await supabase.from('profiles').upsert(
      {
        id:         newUserId,
        full_name:  employeeData.full_name,
        email:      employeeData.email,
        avatar_url: '',
      },
      { onConflict: 'id', ignoreDuplicates: true }
    );

    // 4. Evitar duplicado: mismo profile en el mismo negocio
    const { data: duplicate } = await supabase
      .from('employees')
      .select('id')
      .eq('business_id', business_id)
      .eq('profile_id', newUserId)
      .maybeSingle();

    if (duplicate) {
      // El usuario ya era empleado; eliminamos el Auth user que acabamos de crear
      await supabase.auth.admin.deleteUser(newUserId);
      throw ApiError.badRequest('Este usuario ya está registrado como empleado en el negocio.');
    }

    // 5. Insertar employee (sin password)
    const { data: employee, error: insertError } = await supabase
      .from('employees')
      .insert({
        business_id,
        profile_id: newUserId,
        full_name:  employeeData.full_name,
        email:      employeeData.email,
        phone:      employeeData.phone  ?? null,
        specialty:  employeeData.specialty ?? null,
        role:       employeeData.role   ?? 'staff',
        is_active:  employeeData.is_active ?? true,
      })
      .select()
      .single();

    if (insertError) {
      // Rollback: eliminar el usuario de Auth para no dejar huérfanos
      await supabase.auth.admin.deleteUser(newUserId);

      if (insertError.code === '23505') {
        throw ApiError.badRequest('Este usuario ya está registrado como empleado en el negocio.');
      }
      throw ApiError.internal(`Error al crear el empleado: ${insertError.message}`);
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
   * Actualiza el teléfono del propio registro de empleado del usuario autenticado.
   * A diferencia de `update()`, no requiere ownership del negocio: el requester
   * solo puede modificar su propio registro (business_id + profile_id) y únicamente
   * el campo `phone`.
   *
   * @param {string} profileId  - UUID del usuario autenticado (auth.users.id)
   * @param {string} businessId - UUID del negocio en el que trabaja
   * @param {string|null} phone - Nuevo teléfono
   */
  async updateOwnPhone(profileId, businessId, phone) {
    const { data: employee, error } = await supabase
      .from('employees')
      .select('id, business_id, profile_id, is_active')
      .eq('business_id', businessId)
      .eq('profile_id', profileId)
      .eq('is_active', true)
      .single();

    if (error || !employee) {
      throw ApiError.notFound(
        'No se encontró un registro de empleado activo para este usuario en este negocio.'
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('employees')
      .update({ phone: phone ?? null })
      .eq('id', employee.id)
      .select()
      .single();

    if (updateError) {
      throw ApiError.internal(`Error al actualizar el teléfono: ${updateError.message}`);
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
