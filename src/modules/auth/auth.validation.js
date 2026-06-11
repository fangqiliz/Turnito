import { z } from 'zod';

/**
 * Esquema de validación para el registro de nuevos usuarios.
 */
export const registerSchema = z.object({
  email: z
    .string({ required_error: 'El correo electrónico es requerido' })
    .email('El formato del correo electrónico es inválido')
    .trim(),
  password: z
    .string({ required_error: 'La contraseña es requerida' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  fullName: z
    .string({ required_error: 'El nombre completo es requerido' })
    .min(2, 'El nombre completo debe tener al menos 2 caracteres')
    .trim(),
  avatarUrl: z
    .string()
    .url('La URL del avatar no es válida')
    .or(z.literal(''))
    .optional()
    .default(''),
});

/**
 * Esquema de validación para el inicio de sesión.
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'El correo electrónico es requerido' })
    .email('El formato del correo electrónico es inválido')
    .trim(),
  password: z
    .string({ required_error: 'La contraseña es requerida' })
    .min(1, 'La contraseña es requerida'),
});

export default {
  registerSchema,
  loginSchema,
};
