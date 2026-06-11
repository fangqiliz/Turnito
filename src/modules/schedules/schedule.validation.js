import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convierte un string "HH:MM" o "HH:MM:SS" a minutos desde medianoche.
 * Usado internamente en el refinement de solapamiento en el schema.
 */
const timeToMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Regex para validar formato de hora HH:MM (24 h).
 * Acepta también HH:MM:SS para compatibilidad con valores de Postgres.
 */
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

// ─────────────────────────────────────────────────────────────────────────────
// Esquemas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Esquema para crear un horario.
 *
 * Reglas de negocio aplicadas aquí:
 *  – day_of_week: entero 0 (domingo) a 6 (sábado).
 *  – start_time y end_time: formato HH:MM en 24 h.
 *  – end_time debe ser estrictamente posterior a start_time.
 */
export const createScheduleSchema = z
  .object({
    business_id: z
      .string({ required_error: 'El business_id es requerido' })
      .uuid('El business_id debe ser un UUID válido'),

    employee_id: z
      .string({ required_error: 'El employee_id es requerido' })
      .uuid('El employee_id debe ser un UUID válido'),

    day_of_week: z
      .number({ required_error: 'El día de la semana es requerido' })
      .int('El día de la semana debe ser un entero')
      .min(0, 'El día de la semana mínimo es 0 (domingo)')
      .max(6, 'El día de la semana máximo es 6 (sábado)'),

    start_time: z
      .string({ required_error: 'La hora de inicio es requerida' })
      .regex(TIME_REGEX, 'start_time debe tener formato HH:MM (24 h), ej: 09:00'),

    end_time: z
      .string({ required_error: 'La hora de fin es requerida' })
      .regex(TIME_REGEX, 'end_time debe tener formato HH:MM (24 h), ej: 18:00'),

    is_active: z.boolean().default(true),
  })
  .refine(
    ({ start_time, end_time }) =>
      timeToMinutes(end_time) > timeToMinutes(start_time),
    {
      message: 'La hora de fin (end_time) debe ser posterior a la hora de inicio (start_time)',
      path: ['end_time'],
    }
  );

/**
 * Esquema para actualizar un horario.
 * Todos los campos son opcionales; al menos uno debe estar presente.
 * No se permite cambiar el tenant (business_id) ni el empleado (employee_id).
 */
export const updateScheduleSchema = z
  .object({
    day_of_week: z
      .number()
      .int('El día de la semana debe ser un entero')
      .min(0, 'El día mínimo es 0 (domingo)')
      .max(6, 'El día máximo es 6 (sábado)')
      .optional(),

    start_time: z
      .string()
      .regex(TIME_REGEX, 'start_time debe tener formato HH:MM (24 h), ej: 09:00')
      .optional(),

    end_time: z
      .string()
      .regex(TIME_REGEX, 'end_time debe tener formato HH:MM (24 h), ej: 18:00')
      .optional(),

    is_active: z.boolean().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Debe proporcionar al menos un campo para actualizar' }
  )
  .refine(
    ({ start_time, end_time }) => {
      // Solo validar el rango si ambos campos están presentes
      if (start_time && end_time) {
        return timeToMinutes(end_time) > timeToMinutes(start_time);
      }
      return true;
    },
    {
      message: 'La hora de fin (end_time) debe ser posterior a la hora de inicio (start_time)',
      path: ['end_time'],
    }
  );

/**
 * Esquema para el parámetro de ruta :id (scheduleId).
 */
export const scheduleIdParamSchema = z.object({
  id: z
    .string({ required_error: 'El id del horario es requerido' })
    .uuid('El id del horario debe ser un UUID válido'),
});

/**
 * Esquema para el parámetro de ruta :id cuando representa un businessId.
 * Usado en GET /schedules/business/:id.
 */
export const businessIdParamSchema = z.object({
  id: z
    .string({ required_error: 'El id del negocio es requerido' })
    .uuid('El id del negocio debe ser un UUID válido'),
});

/**
 * Esquema para el query param ?businessId=<uuid> en PUT y DELETE.
 */
export const businessIdQuerySchema = z.object({
  businessId: z
    .string({ required_error: 'El query param businessId es requerido' })
    .uuid('businessId debe ser un UUID válido'),
});

export default {
  createScheduleSchema,
  updateScheduleSchema,
  scheduleIdParamSchema,
  businessIdParamSchema,
  businessIdQuerySchema,
};
