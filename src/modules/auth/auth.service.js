import supabase from '../../config/supabase.js';
import ApiError from '../../utils/apiError.js';

class AuthService {
  /**
   * Registra un nuevo usuario.
   * - accountType 'client'   → crea solo user + profile (vía trigger)
   * - accountType 'business' → además crea business + employee(role=owner)
   */
  async register(email, password, fullName, avatarUrl, accountType = 'client', businessName = null) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, avatar_url: avatarUrl || '' },
      },
    });

    if (error) throw ApiError.badRequest(`Error de registro: ${error.message}`);

    const { user, session } = data;
    if (!user) throw ApiError.internal('El usuario no pudo ser creado en el proveedor de autenticación');

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const sessionPayload = session
      ? {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: session.expires_in,
          token_type: session.token_type,
        }
      : null;

    const baseResult = {
      user: { id: user.id, email: user.email },
      profile: profile ?? { id: user.id, email: user.email, full_name: fullName, avatar_url: avatarUrl || '' },
      session: sessionPayload,
      requiresEmailConfirmation: !session,
    };

    if (accountType !== 'business' || !businessName) {
      return baseResult;
    }

    // Registro como negocio: business + employee owner
    const slug = await this._uniqueSlug(this._toSlug(businessName));

    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .insert({ owner_id: user.id, name: businessName, slug })
      .select()
      .single();

    if (bizError) {
      throw ApiError.internal(`Error al crear el negocio: ${bizError.message}`);
    }

    const { error: empError } = await supabase.from('employees').insert({
      business_id: business.id,
      profile_id: user.id,
      full_name: fullName,
      email: email,
      role: 'owner',
      is_active: true,
    });

    if (empError) {
      console.error('[AuthService] Error al crear employee owner:', empError.message);
    }

    return { ...baseResult, business };
  }

  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw new ApiError(401, 'Credenciales de acceso inválidas');

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
      user: { id: user.id, email: user.email },
      profile,
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        token_type: session.token_type,
      },
    };
  }

  async logout(token) {
    const { error } = await supabase.auth.admin.signOut(token);
    if (error) throw ApiError.badRequest(`Error de cierre de sesión: ${error.message}`);
    return true;
  }

  _toSlug(name) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50)
      .replace(/^-|-$/g, '') || 'negocio';
  }

  async _uniqueSlug(base) {
    let slug = base;
    for (let i = 1; i <= 10; i++) {
      const { data: existing } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (!existing) return slug;
      slug = `${base}-${i}`;
    }
    return `${base}-${Date.now()}`;
  }
}

export default new AuthService();
