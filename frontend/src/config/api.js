import supabase from './supabase'

const API_URL = import.meta.env.VITE_API_URL || ''

/**
 * Cliente API centralizado para comunicación con el backend Express.
 * Obtiene el JWT de Supabase Auth y lo inyecta automáticamente.
 */
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  const headers = {
    'Content-Type': 'application/json',
  }
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }
  return headers
}

async function handleResponse(response) {
  const data = await response.json()

  if (!response.ok) {
    if (response.status === 401) {
      await supabase.auth.signOut()
      window.location.href = '/login'
    }
    const error = new Error(data.message || 'Error en la solicitud')
    error.status = response.status
    error.errors = data.errors || []
    throw error
  }

  return data
}

export const api = {
  async get(endpoint) {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers,
    })
    return handleResponse(response)
  },

  async post(endpoint, body) {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    return handleResponse(response)
  },

  async put(endpoint, body) {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    })
    return handleResponse(response)
  },

  async delete(endpoint) {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    })
    return handleResponse(response)
  },
}

export default api
