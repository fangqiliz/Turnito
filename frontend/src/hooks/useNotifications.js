import { useState, useEffect, useCallback } from 'react'
import supabase from '../config/supabase'

const API_URL = import.meta.env.VITE_API_URL || ''

/**
 * Hook para gestionar notificaciones del usuario
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Obtener headers con autenticación
  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
    }
  }, [])

  // Obtener notificaciones
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL}/notifications?page=1&limit=20`, {
        headers,
      })

      if (!response.ok) throw new Error('Error al obtener notificaciones')

      const data = await response.json()
      setNotifications(data.data?.notifications || data.notifications || [])
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('[useNotifications] Error fetching:', err)
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders])

  // Obtener contador de no leídas
  const fetchUnreadCount = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL}/notifications/unread/count`, {
        headers,
      })

      if (!response.ok) throw new Error('Error al obtener contador')

      const data = await response.json()
      setUnreadCount(data.data?.unreadCount || data.unreadCount || 0)
    } catch (err) {
      console.error('[useNotifications] Error fetching unread count:', err)
    }
  }, [getAuthHeaders])

  // Marcar como leído
  const markAsRead = useCallback(
    async (notificationId) => {
      try {
        const headers = await getAuthHeaders()
        const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
          method: 'PUT',
          headers,
        })

        if (!response.ok) throw new Error('Error al marcar como leído')

        // Actualizar estado local
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true, read_at: new Date() } : n,
          ),
        )

        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch (err) {
        console.error('[useNotifications] Error marking as read:', err)
      }
    },
    [getAuthHeaders],
  )

  // Marcar múltiples como leído
  const markMultipleAsRead = useCallback(
    async (notificationIds) => {
      try {
        const headers = await getAuthHeaders()
        const response = await fetch(`${API_URL}/notifications/mark-all`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ notificationIds }),
        })

        if (!response.ok) throw new Error('Error al marcar notificaciones')

        // Actualizar estado local
        setNotifications((prev) =>
          prev.map((n) =>
            notificationIds.includes(n.id)
              ? { ...n, is_read: true, read_at: new Date() }
              : n,
          ),
        )

        setUnreadCount(0)
      } catch (err) {
        console.error('[useNotifications] Error marking multiple as read:', err)
      }
    },
    [getAuthHeaders],
  )

  // Eliminar notificación
  const deleteNotification = useCallback(
    async (notificationId) => {
      try {
        const headers = await getAuthHeaders()
        const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
          method: 'DELETE',
          headers,
        })

        if (!response.ok) throw new Error('Error al eliminar notificación')

        // Actualizar estado local
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      } catch (err) {
        console.error('[useNotifications] Error deleting notification:', err)
      }
    },
    [getAuthHeaders],
  )

  // Limpiar notificaciones leídas
  const clearReadNotifications = useCallback(
    async () => {
      try {
        const headers = await getAuthHeaders()
        const response = await fetch(`${API_URL}/notifications/clear-read`, {
          method: 'DELETE',
          headers,
        })

        if (!response.ok) throw new Error('Error al limpiar notificaciones')

        // Actualizar estado local
        setNotifications((prev) => prev.filter((n) => !n.is_read))
      } catch (err) {
        console.error('[useNotifications] Error clearing read notifications:', err)
      }
    },
    [getAuthHeaders],
  )

  // Poll para actualizar notificaciones cada 30 segundos
  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()

    const unreadInterval = setInterval(fetchUnreadCount, 30 * 1000)
    const notificationsInterval = setInterval(fetchNotifications, 2 * 60 * 1000)

    return () => {
      clearInterval(unreadInterval)
      clearInterval(notificationsInterval)
    }
  }, [fetchNotifications, fetchUnreadCount])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markMultipleAsRead,
    deleteNotification,
    clearReadNotifications,
  }
}
