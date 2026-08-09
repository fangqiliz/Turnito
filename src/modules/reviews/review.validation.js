import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Esquemas de validación – Módulo Reviews
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Esquema para crear una reseña.
 */
export const createReviewSchema = z.object({
  appointment_id: z
    .string({ required_error: 'El appointment_id es requerido' })
    .uuid('El appointment_id debe ser un UUID válido'),

  rating: z
    .number({ required_error: 'La calificación es requerida' })
    .int('La calificación debe ser un número entero')
    .min(1, 'La calificación mínima es 1')
    .max(5, 'La calificación máxima es 5'),

  comment: z
    .string('El comentario debe ser texto')
    .max(1000, 'El comentario no puede superar los 1000 caracteres')
    .optional()
    .transform(val => val?.trim() || ''),
});

/**
 * Esquema para actualizar una reseña.
 */
export const updateReviewSchema = z.object({
  rating: z
    .number({ required_error: 'La calificación es requerida' })
    .int('La calificación debe ser un número entero')
    .min(1, 'La calificación mínima es 1')
    .max(5, 'La calificación máxima es 5'),

  comment: z
    .string('El comentario debe ser texto')
    .max(1000, 'El comentario no puede superar los 1000 caracteres')
    .optional()
    .transform(val => val?.trim() || ''),
});

/**
 * Esquema para params con UUID de reseña.
 */
export const reviewIdParamSchema = z.object({
  id: z
    .string({ required_error: 'El id de la reseña es requerido' })
    .uuid('El id debe ser un UUID válido'),
});

/**
 * Esquema para params con UUID de cita.
 */
export const appointmentIdParamSchema = z.object({
  id: z
    .string({ required_error: 'El id de la cita es requerido' })
    .uuid('El id debe ser un UUID válido'),
});

/**
 * Esquema para query params de paginación.
 */
export const reviewPaginationSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'page debe ser un número entero positivo')
    .transform(Number)
    .pipe(z.number().int().positive())
    .optional()
    .default(1),

  limit: z
    .string()
    .regex(/^\d+$/, 'limit debe ser un número entero positivo')
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default(10),
});

export default {
  createReviewSchema,
  updateReviewSchema,
  reviewIdParamSchema,
  appointmentIdParamSchema,
  reviewPaginationSchema,
};
