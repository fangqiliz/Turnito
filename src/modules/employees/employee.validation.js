import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Esquemas de validación – Módulo Employees
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Esquema para crear un empleado.
 * El `business_id` identifica el tenant al que pertenece el empleado.
 * El `profile_id` es opcional: puede asociarse después de que el usuario
 * se registre en la app. El campo `specialty` es opcional.
 */
export const createEmployeeSchema = z.object({
  business_id: z
    .string({ required_error: 'El business_id es requerido' })
    .uuid('El business_id debe ser un UUID válido'),

  profile_id: z
    .string()
    .uuid('El profile_id debe ser un UUID válido')
    .optional()
    .nullable(),

  full_name: z
    .string({ required_error: 'El nombre completo es requerido' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar los 100 caracteres')
    .trim(),

  email: z
    .string()
    .email('El formato del correo electrónico es inválido')
    .trim()
    .optional()
    .nullable(),

  phone: z
    .string()
    .max(20, 'El teléfono no puede superar los 20 caracteres')
    .trim()
    .optional()
    .nullable(),

  specialty: z
    .string()
    .max(100, 'La especialidad no puede superar los 100 caracteres')
    .trim()
    .optional()
    .nullable(),

  role: z
    .enum(['owner', 'admin', 'manager', 'staff'], {
      errorMap: () => ({
        message: 'El rol debe ser uno de: owner, admin, manager, staff',
      }),
    })
    .default('staff'),

  is_active: z.boolean().default(true),
});

/**
 * Esquema para actualizar un empleado.
 * Todos los campos son opcionales; al menos uno debe estar presente.
 * No se permite reasignar `business_id` desde este endpoint.
 */
export const updateEmployeeSchema = z
  .object({
    profile_id: z
      .string()
      .uuid('El profile_id debe ser un UUID válido')
      .nullable()
      .optional(),

    full_name: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede superar los 100 caracteres')
      .trim()
      .optional(),

    email: z
      .string()
      .email('El formato del correo electrónico es inválido')
      .trim()
      .nullable()
      .optional(),

    phone: z
      .string()
      .max(20, 'El teléfono no puede superar los 20 caracteres')
      .trim()
      .nullable()
      .optional(),

    specialty: z
      .string()
      .max(100, 'La especialidad no puede superar los 100 caracteres')
      .trim()
      .nullable()
      .optional(),

    role: z
      .enum(['owner', 'admin', 'manager', 'staff'], {
        errorMap: () => ({
          message: 'El rol debe ser uno de: owner, admin, manager, staff',
        }),
      })
      .optional(),

    is_active: z.boolean().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Debe proporcionar al menos un campo para actualizar' }
  );

/**
 * Esquema para el parámetro de ruta :id (employeeId).
 */
export const employeeIdParamSchema = z.object({
  id: z
    .string({ required_error: 'El id del empleado es requerido' })
    .uuid('El id del empleado debe ser un UUID válido'),
});

/**
 * Esquema para el parámetro de ruta :id cuando representa un businessId.
 * Se usa en GET /employees/business/:id.
 */
export const businessIdParamSchema = z.object({
  id: z
    .string({ required_error: 'El id del negocio es requerido' })
    .uuid('El id del negocio debe ser un UUID válido'),
});

export default {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeIdParamSchema,
  businessIdParamSchema,
};
