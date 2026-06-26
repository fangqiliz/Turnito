import { createClient } from '@supabase/supabase-js';
import env from './env.js';
import logger from './logger.js';

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  logger.error('Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.');
  process.exit(1);
}

// Cliente admin del backend. Usa exclusivamente la service role key.
const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

logger.info('Cliente admin de Supabase inicializado correctamente.');

export default supabase;
