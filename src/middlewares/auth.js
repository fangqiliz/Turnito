import supabase from '../config/supabase.js';
import ApiError from '../utils/apiError.js';

/**
 * Middleware de autenticación global para validar el token JWT de Supabase.
 * Extrae el Bearer token del encabezado de Autorización y valida la sesión.
 * Adjunta los objetos `user` y `token` a `req` para su posterior uso.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Token de autenticación no proporcionado o formato incorrecto');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw ApiError.unauthorized('Token de autenticación vacío');
    }

    // Validar el JWT directamente con el servidor de Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw ApiError.unauthorized('Token inválido o sesión expirada');
    }

    // Adjuntar la información del usuario autenticado y el token original
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para validar si el usuario autenticado tiene uno de los roles permitidos en un negocio específico.
 * Extrae el `businessId` de los parámetros, cuerpo o query de la solicitud.
 * Verifica si el usuario es el dueño directo del negocio o un empleado activo con el rol requerido.
 * 
 * @param {string[]} allowedRoles - Roles permitidos (ej. ['owner', 'admin', 'manager', 'staff'])
 */
export const requireRole = (allowedRoles) => async (req, res, next) => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Usuario no autenticado');
    }

    // El businessId puede venir de req.params, req.body o req.query
    const businessId = req.params.businessId || req.body.businessId || req.query.businessId;
    if (!businessId) {
      throw ApiError.badRequest('Se requiere el identificador de negocio (businessId) para validar permisos');
    }

    // 1. Verificar si el usuario es el dueño (owner) directo del negocio en la tabla businesses
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('owner_id')
      .eq('id', businessId)
      .single();

    // Si es el dueño del negocio, otorgar acceso completo independientemente de su estado como empleado
    if (business && business.owner_id === req.user.id) {
      return next();
    }

    // 2. Verificar en la tabla de empleados (employees) si existe y está activo
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('role, is_active')
      .eq('business_id', businessId)
      .eq('profile_id', req.user.id)
      .single();

    if (employeeError || !employee || !employee.is_active) {
      throw ApiError.forbidden('No tienes permisos de acceso en este negocio');
    }

    // 3. Comprobar si el rol del empleado está dentro de los autorizados
    if (!allowedRoles.includes(employee.role)) {
      throw ApiError.forbidden('Acceso denegado: no cuentas con el rol requerido');
    }

    next();
  } catch (error) {
    next(error);
  }
};
