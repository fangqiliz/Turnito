import { createClient } from '@supabase/supabase-js';
import env from './env.js';
import logger from './logger.js';

if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
  logger.error('❌ Falta SUPABASE_URL o SUPABASE_ANON_KEY en las variables de entorno.');
  process.exit(1);
}

// Configuración del cliente Supabase optimizado para ambiente de servidor Node.js
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // Desactivar almacenamiento persistente (localStorage es para navegadores)
    autoRefreshToken: false, // El servidor maneja solicitudes stateless, no necesita refresco automático
  },
});

logger.info('🔌 Cliente de Supabase inicializado correctamente.');

export default supabase;
