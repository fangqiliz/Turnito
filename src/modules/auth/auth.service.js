import { createClient } from '@supabase/supabase-js';
import supabase from '../../config/supabase.js';
import env from '../../config/env.js';
import ApiError from '../../utils/apiError.js';

/**
 * Servicio encargado de gestionar los flujos de autenticación de Supabase Auth
 */
class AuthService {
  /**
   * Registra un nuevo usuario en Supabase Auth y retorna su información básica.
   * La tabla public.profiles se alimenta automáticamente mediante un Trigger de base de datos.
   * 
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña
   * @param {string} fullName - Nombre completo
   * @param {string} avatarUrl - URL del avatar
   */
  async register(email, password, fullName, avatarUrl) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          avatar_url: avatarUrl || '',
        },
      },
    });

    if (error) {
      throw ApiError.badRequest(`Error de registro: ${error.message}`);
    }

    const { user, session } = data;

    if (!user) {
      throw ApiError.internal('El usuario no pudo ser creado en el proveedor de autenticación');
    }

    // Consultar el perfil recién creado (creado vía Trigger postgres)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // Si por alguna razón el trigger no terminó (o requiere confirmación de email y aún no está visible)
      // retornamos la información simulada para evitar colapsar la respuesta.
      return {
        user: {
          id: user.id,
          email: user.email,
          emailConfirmRequired: user.identities?.length === 0 || !session,
        },
        profile: {
          id: user.id,
          email: user.email,
          full_name: fullName,
          avatar_url: avatarUrl || '',
        },
        session: session || null,
      };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
      session: session || null,
    };
  }

  /**
   * Inicia sesión con credenciales tradicionales de email y password.
   * Retorna los datos del usuario, el perfil y la sesión JWT de Supabase.
   * 
   * @param {string} email 
   * @param {string} password 
   */
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // 400 Bad Request o 401 Unauthorized dependiendo de las políticas
      throw new ApiError(401, 'Credenciales de acceso inválidas');
    }

    const { user, session } = data;

    // Obtener el perfil asociado desde la base de datos
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw ApiError.notFound('Perfil de usuario asociado no encontrado en la base de datos');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        token_type: session.token_type,
      },
    };
  }

  /**
   * Cierra sesión del usuario autenticado invalidando el token JWT en Supabase Auth.
   * Dado que el servidor API es stateless, creamos un cliente Supabase con el scope del usuario para el logout.
   * 
   * @param {string} token - Token JWT a invalidar
   */
  async logout(token) {
    // Instanciar un cliente Supabase efímero para realizar la operación
    const userClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Establecer la sesión activa con el token del usuario
    const { error: sessionError } = await userClient.auth.setSession({
      access_token: token,
      refresh_token: token, // Pasamos el access_token como refresh para cumplir el formato si es requerido
    });

    if (sessionError) {
      throw ApiError.badRequest(`Error al preparar la sesión para cierre: ${sessionError.message}`);
    }

    // Cerrar sesión invalidando el token en el servidor de Supabase
    const { error } = await userClient.auth.signOut();

    if (error) {
      throw ApiError.badRequest(`Error de cierre de sesión: ${error.message}`);
    }

    return true;
  }
}

export default new AuthService();
