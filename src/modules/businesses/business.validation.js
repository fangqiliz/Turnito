import { z } from 'zod';

/**
 * Genera un slug URL-safe a partir de un string de texto.
 * Convierte a minúsculas, reemplaza espacios y caracteres especiales por guiones.
 *
 * @param {string} text
 * @returns {string}
 */
const toSlug = (text) =>
  text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos (tildes, ñ → n, etc.)
    .replace(/[^a-z0-9\s-]/g, '')   // Eliminar caracteres no alfanuméricos
    .replace(/\s+/g, '-')           // Espacios → guiones
    .replace(/-+/g, '-');           // Colapsar guiones múltiples

/**
 * Esquema de validación para la creación de un negocio.
 * Solo administradores pueden acceder a este endpoint (validado en el controlador).
 */
export const createBusinessSchema = z.object({
  name: z
    .string({ required_error: 'El nombre del negocio es requerido' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar los 100 caracteres')
    .trim(),

  description: z
    .string()
    .max(500, 'La descripción no puede superar los 500 caracteres')
    .trim()
    .optional()
    .nullable(),

  phone: z
    .string()
    .max(20, 'El teléfono no puede superar los 20 caracteres')
    .trim()
    .optional()
    .nullable(),

  address: z
    .string()
    .max(255, 'La dirección no puede superar los 255 caracteres')
    .trim()
    .optional()
    .nullable(),

  logo_url: z
    .string()
    .url('La URL del logo no es válida')
    .optional()
    .nullable(),

  /**
   * El slug es opcional en la petición: si no se proporciona se deriva del `name`.
   * Debe ser único en la base de datos (validado a nivel de servicio).
   */
  slug: z
    .string()
    .min(2, 'El slug debe tener al menos 2 caracteres')
    .max(100, 'El slug no puede superar los 100 caracteres')
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener minúsculas, números y guiones')
    .trim()
    .optional(),
}).transform((data) => ({
  ...data,
  // Derivar el slug del nombre si no fue proporcionado explícitamente
  slug: data.slug || toSlug(data.name),
}));

/**
 * Esquema de validación para la actualización parcial (PATCH-style) de un negocio.
 * Todos los campos son opcionales; al menos uno debe estar presente.
 */
export const updateBusinessSchema = z
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

    phone: z
      .string()
      .max(20, 'El teléfono no puede superar los 20 caracteres')
      .trim()
      .nullable()
      .optional(),

    address: z
      .string()
      .max(255, 'La dirección no puede superar los 255 caracteres')
      .trim()
      .nullable()
      .optional(),

    logo_url: z
      .string()
      .url('La URL del logo no es válida')
      .nullable()
      .optional(),

    slug: z
      .string()
      .min(2, 'El slug debe tener al menos 2 caracteres')
      .max(100, 'El slug no puede superar los 100 caracteres')
      .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener minúsculas, números y guiones')
      .trim()
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Debe proporcionar al menos un campo para actualizar' }
  );

/**
 * Esquema de validación para los parámetros de ruta `:id`.
 */
export const businessIdParamSchema = z.object({
  id: z
    .string({ required_error: 'El identificador del negocio es requerido' })
    .uuid('El identificador del negocio debe ser un UUID válido'),
});

export default {
  createBusinessSchema,
  updateBusinessSchema,
  businessIdParamSchema,
};
