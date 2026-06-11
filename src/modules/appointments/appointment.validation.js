import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Esquemas de validación – Módulo Appointments
// ─────────────────────────────────────────────────────────────────────────────

/** Reutilizable: UUID requerido */
const uuidRequired = (label) =>
  z
    .string({ required_error: `${label} es requerido` })
    .uuid(`${label} debe ser un UUID válido`);

/**
 * Esquema para crear una cita.
 *
 * Reglas Zod (las reglas de negocio complejas se validan en el service):
 *  – start_time debe ser un ISO 8601 válido y estar en el futuro.
 *  – notes es opcional.
 *  – client_name y client_email son requeridos para checkout anónimo o cuando
 *    el usuario autenticado no tiene perfil completo.
 */
export const createAppointmentSchema = z
  .object({
    business_id: uuidRequired('El business_id'),

    service_id: uuidRequired('El service_id'),

    employee_id: uuidRequired('El employee_id'),

    /** ISO 8601 UTC. end_time se calcula automáticamente usando duration_minutes. */
    start_time: z
      .string({ required_error: 'El start_time es requerido' })
      .datetime({ message: 'start_time debe ser una fecha ISO 8601 válida (ej. 2026-06-15T10:00:00Z)' })
      .refine(
        (val) => new Date(val) > new Date(),
        { message: 'No se pueden agendar citas en el pasado' }
      ),

    notes: z
      .string()
      .max(500, 'Las notas no pueden superar los 500 caracteres')
      .trim()
      .optional()
      .nullable(),

    /** Nombre del cliente (requerido para invitados o cuando el user no tiene perfil) */
    client_name: z
      .string({ required_error: 'El nombre del cliente es requerido' })
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede superar los 100 caracteres')
      .trim(),

    /** Email del cliente */
    client_email: z
      .string({ required_error: 'El email del cliente es requerido' })
      .email('El email del cliente no es válido')
      .max(254, 'El email no puede superar los 254 caracteres')
      .toLowerCase(),

    /** Teléfono opcional */
    client_phone: z
      .string()
      .max(30, 'El teléfono no puede superar los 30 caracteres')
      .trim()
      .optional()
      .nullable(),
  });

/**
 * Esquema para actualizar el estado de una cita.
 * Solo el campo `status` puede modificarse desde este endpoint.
 */
export const updateStatusSchema = z.object({
  status: z.enum(
    ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
    {
      required_error: 'El status es requerido',
      invalid_type_error: "El status debe ser uno de: 'pending', 'confirmed', 'cancelled', 'completed', 'no_show'",
    }
  ),
});

/**
 * Esquema para el parámetro de ruta :id (appointmentId).
 */
export const appointmentIdParamSchema = z.object({
  id: uuidRequired('El id de la cita'),
});

/**
 * Esquema para el parámetro de ruta :id (businessId).
 * Usado en GET /appointments/business/:id.
 */
export const businessIdParamSchema = z.object({
  id: uuidRequired('El id del negocio'),
});

/**
 * Esquema para query params de paginación y filtros en GET /appointments/business/:id.
 */
export const listBusinessAppointmentsQuerySchema = z.object({
  status: z
    .enum(['pending', 'confirmed', 'cancelled', 'completed', 'no_show'])
    .optional(),

  date: z
    .string()
    .date('El parámetro date debe tener formato YYYY-MM-DD')
    .optional(),

  employee_id: z
    .string()
    .uuid('employee_id debe ser un UUID válido')
    .optional(),

  page: z
    .string()
    .regex(/^\d+$/, 'page debe ser un número entero positivo')
    .transform(Number)
    .pipe(z.number().int().positive())
    .optional()
    .default('1'),

  limit: z
    .string()
    .regex(/^\d+$/, 'limit debe ser un número entero positivo')
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default('20'),
});

/**
 * Esquema para query params de GET /appointments/user.
 */
export const listUserAppointmentsQuerySchema = z.object({
  status: z
    .enum(['pending', 'confirmed', 'cancelled', 'completed', 'no_show'])
    .optional(),

  page: z
    .string()
    .regex(/^\d+$/, 'page debe ser un número entero positivo')
    .transform(Number)
    .pipe(z.number().int().positive())
    .optional()
    .default('1'),

  limit: z
    .string()
    .regex(/^\d+$/, 'limit debe ser un número entero positivo')
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default('20'),
});

export default {
  createAppointmentSchema,
  updateStatusSchema,
  appointmentIdParamSchema,
  businessIdParamSchema,
  listBusinessAppointmentsQuerySchema,
  listUserAppointmentsQuerySchema,
};
