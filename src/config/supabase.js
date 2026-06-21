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

/**
 * Crea un cliente Supabase autenticado con el JWT token de un usuario.
 * Esto es necesario para que las políticas RLS funcionen correctamente,
 * ya que auth.uid() se resolverá al ID del usuario propietario.
 * 
 * @param {string} userToken - Token JWT del usuario autenticado
 * @returns {object} Cliente Supabase autenticado
 */
export const createAuthenticatedClient = (userToken) => {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    },
  });
};

logger.info('🔌 Cliente de Supabase inicializado correctamente.');

export default supabase;
