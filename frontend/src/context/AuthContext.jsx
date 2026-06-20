import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import supabase from '../config/supabase'
import api from '../config/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get('/users/me')
      if (response.success) {
        setProfile(response.data.profile)
        return response.data
      }
    } catch (error) {
      console.error('Error al obtener perfil:', error)
    }
    return null
  }, [])

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      if (currentSession?.user) {
        fetchProfile()
      }
      setLoading(false)
    })

    // Escuchar cambios de estado de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (event === 'SIGNED_IN' && currentSession?.user) {
          // Pequeño delay para que el trigger de DB cree el perfil
          setTimeout(() => fetchProfile(), 500)
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  const register = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          avatar_url: '',
        },
      },
    })
    if (error) throw error
    return data
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  const updateProfile = async (updates) => {
    const response = await api.put('/users/me', updates)
    if (response.success) {
      setProfile(response.data)
    }
    return response
  }

  const value = {
    user,
    profile,
    session,
    loading,
    isAuthenticated: !!session,
    login,
    register,
    logout,
    updateProfile,
    refreshProfile: fetchProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}

export default AuthContext
