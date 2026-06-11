import { z } from 'zod';

/**
 * Esquema de validación para actualizar el perfil del usuario autenticado.
 * Todos los campos son opcionales para permitir actualizaciones parciales.
 */
export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'El nombre completo debe tener al menos 2 caracteres')
    .trim()
    .optional(),
  avatarUrl: z
    .string()
    .url('La URL del avatar no es válida')
    .or(z.literal(''))
    .optional(),
});

export default {
  updateProfileSchema,
};
