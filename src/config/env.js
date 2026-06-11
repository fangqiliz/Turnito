import dotenv from 'dotenv';
import { z } from 'zod';

// Cargar variables de entorno del archivo .env
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().url('SUPABASE_URL debe ser una URL válida'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY es requerido'),
  CORS_ORIGIN: z.string().default('*'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Error de validación en variables de entorno:');
    const formattedErrors = result.error.format();
    for (const [key, value] of Object.entries(formattedErrors)) {
      if (key !== '_errors') {
        console.error(`  - ${key}: ${value._errors.join(', ')}`);
      }
    }
    process.exit(1);
  }
  
  return result.data;
};

const env = parseEnv();

export default env;
