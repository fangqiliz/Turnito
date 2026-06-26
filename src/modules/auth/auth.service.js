import supabase from '../../config/supabase.js';
import ApiError from '../../utils/apiError.js';

/**
 * Servicio encargado de gestionar los flujos de autenticacion de Supabase Auth.
 * Usa siempre el cliente admin del backend, configurado con service role key.
 */
class AuthService {
  /**
   * Registra un nuevo usuario en Supabase Auth y retorna su informacion basica.
   * La tabla public.profiles se alimenta automaticamente mediante un trigger.
   *
   * @param {string} email
   * @param {string} password
   * @param {string} fullName
   * @param {string} avatarUrl
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
      throw ApiError.internal('El usuario no pudo ser creado en el proveedor de autenticacion');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
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
   * Inicia sesion con credenciales de email y password.
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
      throw new ApiError(401, 'Credenciales de acceso invalidas');
    }

    const { user, session } = data;

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
   * Cierra sesion invalidando el JWT con la API admin de Supabase.
   *
   * @param {string} token - Token JWT a invalidar
   */
  async logout(token) {
    const { error } = await supabase.auth.admin.signOut(token);

    if (error) {
      throw ApiError.badRequest(`Error de cierre de sesion: ${error.message}`);
    }

    return true;
  }
}

export default new AuthService();
