import { useState, useEffect, useCallback } from 'react'
import api from '../config/api'

/**
 * Hook genérico para peticiones fetch con estados de loading, error y data.
 * @param {string} endpoint - Endpoint de la API (null para no ejecutar automáticamente)
 * @param {object} options - { immediate: true, onSuccess, onError }
 */
export function useFetch(endpoint, options = {}) {
  const { immediate = true, onSuccess, onError } = options
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate && !!endpoint)
  const [error, setError] = useState(null)

  const execute = useCallback(async (overrideEndpoint) => {
    const url = overrideEndpoint || endpoint
    if (!url) return null

    setLoading(true)
    setError(null)

    try {
      const response = await api.get(url)
      setData(response.data)
      onSuccess?.(response.data)
      return response.data
    } catch (err) {
      setError(err.message || 'Error al cargar datos')
      onError?.(err)
      return null
    } finally {
      setLoading(false)
    }
  }, [endpoint, onSuccess, onError])

  useEffect(() => {
    if (immediate && endpoint) {
      execute()
    }
  }, [endpoint, immediate]) // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(() => execute(), [execute])

  return { data, loading, error, refetch, setData }
}

export default useFetch
