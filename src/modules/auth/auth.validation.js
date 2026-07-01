import { z } from 'zod';

export const registerSchema = z
  .object({
    accountType: z.enum(['client', 'business']).optional().default('client'),
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
    businessName: z
      .string()
      .min(2, 'El nombre del negocio debe tener al menos 2 caracteres')
      .max(100, 'El nombre del negocio no puede superar los 100 caracteres')
      .trim()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.accountType === 'business' && !data.businessName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El nombre del negocio es requerido para cuentas de tipo negocio',
        path: ['businessName'],
      });
    }
  });

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'El correo electrónico es requerido' })
    .email('El formato del correo electrónico es inválido')
    .trim(),
  password: z
    .string({ required_error: 'La contraseña es requerida' })
    .min(1, 'La contraseña es requerida'),
});

export default { registerSchema, loginSchema };
