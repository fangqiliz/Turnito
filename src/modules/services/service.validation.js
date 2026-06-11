import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Esquemas de validación – Módulo Services
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Esquema para crear un servicio.
 * El `business_id` identifica el tenant propietario del servicio.
 */
export const createServiceSchema = z.object({
  business_id: z
    .string({ required_error: 'El business_id es requerido' })
    .uuid('El business_id debe ser un UUID válido'),

  name: z
    .string({ required_error: 'El nombre del servicio es requerido' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar los 100 caracteres')
    .trim(),

  description: z
    .string()
    .max(500, 'La descripción no puede superar los 500 caracteres')
    .trim()
    .optional()
    .nullable(),

  price: z
    .number({ required_error: 'El precio es requerido' })
    .nonnegative('El precio debe ser mayor o igual a 0')
    .multipleOf(0.01, 'El precio solo puede tener hasta 2 decimales'),

  duration_minutes: z
    .number({ required_error: 'La duración en minutos es requerida' })
    .int('La duración debe ser un número entero')
    .positive('La duración debe ser mayor a 0'),

  is_active: z.boolean().default(true),
});

/**
 * Esquema para actualizar un servicio.
 * Todos los campos son opcionales; al menos uno debe estar presente.
 * No se permite reasignar `business_id` desde este endpoint.
 */
export const updateServiceSchema = z
  .object({
    name: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede superar los 100 caracteres')
      .trim()
      .optional(),

    description: z
      .string()
      .max(500, 'La descripción no puede superar los 500 caracteres')
      .trim()
      .nullable()
      .optional(),

    price: z
      .number()
      .nonnegative('El precio debe ser mayor o igual a 0')
      .multipleOf(0.01, 'El precio solo puede tener hasta 2 decimales')
      .optional(),

    duration_minutes: z
      .number()
      .int('La duración debe ser un número entero')
      .positive('La duración debe ser mayor a 0')
      .optional(),

    is_active: z.boolean().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Debe proporcionar al menos un campo para actualizar' }
  );

/**
 * Esquema para el parámetro de ruta :id (serviceId).
 */
export const serviceIdParamSchema = z.object({
  id: z
    .string({ required_error: 'El id del servicio es requerido' })
    .uuid('El id del servicio debe ser un UUID válido'),
});

/**
 * Esquema para el parámetro de ruta :id cuando representa un businessId.
 * Usado en GET /services/business/:id.
 */
export const businessIdParamSchema = z.object({
  id: z
    .string({ required_error: 'El id del negocio es requerido' })
    .uuid('El id del negocio debe ser un UUID válido'),
});

/**
 * Esquema para validar ?businessId=<uuid> en PUT y DELETE.
 */
export const businessIdQuerySchema = z.object({
  businessId: z
    .string({ required_error: 'El query param businessId es requerido' })
    .uuid('businessId debe ser un UUID válido'),
});

export default {
  createServiceSchema,
  updateServiceSchema,
  serviceIdParamSchema,
  businessIdParamSchema,
  businessIdQuerySchema,
};
