import { z } from 'zod';

/**
 * Esquema de validación para la subida del logo del negocio.
 * Valida que el campo businessId sea un UUID válido.
 */
export const uploadLogoSchema = z.object({
  businessId: z
    .string({ required_error: 'El businessId es requerido para asociar el logo a un negocio' })
    .uuid('El businessId debe ser un UUID válido'),
});

export default {
  uploadLogoSchema,
};
