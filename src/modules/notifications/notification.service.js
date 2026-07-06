import supabase from '../../config/supabase.js'
import ApiError from '../../utils/apiError.js'
import logger from '../../config/logger.js'

class NotificationService {
  /**
   * Obtener todas las notificaciones del usuario
   */
  async getNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    try {
      const offset = (page - 1) * limit

      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('recipient_id', userId)
        .eq('recipient_type', 'user')
        .order('created_at', { ascending: false })

      if (unreadOnly) {
        query = query.eq('is_read', false)
      }

      query = query.range(offset, offset + limit - 1)

      const { data, count, error } = await query

      if (error) throw error

      return {
        notifications: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      }
    } catch (err) {
      logger.error(`[NotificationService] Error getting notifications: ${err.message}`)
      throw new ApiError('Error al obtener notificaciones', 500)
    }
  }

  /**
   * Obtener notificaciones no leídas del usuario
   */
  async getUnreadCount(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('recipient_type', 'user')
        .eq('is_read', false)

      if (error) throw error

      return count || 0
    } catch (err) {
      logger.error(`[NotificationService] Error getting unread count: ${err.message}`)
      throw new ApiError('Error al obtener contador de notificaciones', 500)
    }
  }

  /**
   * Marcar una notificación como leída
   */
  async markAsRead(notificationId, userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('recipient_id', userId)
        .eq('recipient_type', 'user')
        .select()
        .single()

      if (error) throw error
      if (!data) {
        throw new ApiError('Notificación no encontrada', 404)
      }

      return data
    } catch (err) {
      if (err instanceof ApiError) throw err
      logger.error(`[NotificationService] Error marking as read: ${err.message}`)
      throw new ApiError('Error al marcar como leído', 500)
    }
  }

  /**
   * Marcar múltiples notificaciones como leídas
   */
  async markMultipleAsRead(notificationIds, userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('recipient_id', userId)
        .eq('recipient_type', 'user')
        .in('id', notificationIds)
        .select()

      if (error) throw error

      return data || []
    } catch (err) {
      logger.error(`[NotificationService] Error marking multiple as read: ${err.message}`)
      throw new ApiError('Error al marcar notificaciones', 500)
    }
  }

  /**
   * Eliminar una notificación
   */
  async deleteNotification(notificationId, userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('recipient_id', userId)
        .eq('recipient_type', 'user')

      if (error) throw error

      return { success: true }
    } catch (err) {
      logger.error(`[NotificationService] Error deleting notification: ${err.message}`)
      throw new ApiError('Error al eliminar notificación', 500)
    }
  }

  /**
   * Eliminar todas las notificaciones leídas del usuario
   */
  async clearReadNotifications(userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('recipient_id', userId)
        .eq('recipient_type', 'user')
        .eq('is_read', true)

      if (error) throw error

      return { success: true }
    } catch (err) {
      logger.error(`[NotificationService] Error clearing read notifications: ${err.message}`)
      throw new ApiError('Error al limpiar notificaciones', 500)
    }
  }

  /**
   * [INTERNO] Crear una notificación (usado por triggers y servicios)
   */
  async createNotification({
    recipientId,
    recipientType = 'user',
    businessId,
    type,
    title,
    message,
    appointmentId = null,
    data = null,
  }) {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert([
          {
            recipient_id: recipientId,
            recipient_type: recipientType,
            business_id: businessId,
            type,
            title,
            message,
            appointment_id: appointmentId,
            data,
            is_read: false,
          },
        ])
        .select()
        .single()

      if (error) throw error

      logger.info(
        `[NotificationService] Notification created: ${type} for ${recipientType}:${recipientId}`,
      )

      return notification
    } catch (err) {
      logger.error(`[NotificationService] Error creating notification: ${err.message}`)
      throw err
    }
  }

  /**
   * [CRON] Enviar recordatorios de citas próximas (24h y 1h)
   */
  async sendAppointmentReminders() {
    try {
      // Recordatorios de 24 horas
      const { data: appointments24h, error: error24h } = await supabase
        .from('appointments')
        .select('*')
        .eq('status', 'confirmed')
        .gte('start_time', new Date().toISOString())
        .lte(
          'start_time',
          new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // +25h
        )

      if (error24h) throw error24h

      // Recordatorios de 1 hora
      const { data: appointments1h, error: error1h } = await supabase
        .from('appointments')
        .select('*')
        .eq('status', 'confirmed')
        .gte('start_time', new Date().toISOString())
        .lte('start_time', new Date(Date.now() + 61 * 60 * 1000).toISOString()) // +61min

      if (error1h) throw error1h

      let sentCount = 0

      // Procesar recordatorios de 24h
      for (const appt of appointments24h || []) {
        const existsNotification = await supabase
          .from('notifications')
          .select('id')
          .eq('appointment_id', appt.id)
          .eq('type', 'appointment_reminder_24h')
          .single()

        // No enviar duplicados
        if (!existsNotification.data) {
          await this.createNotification({
            recipientId: appt.client_id,
            recipientType: 'user',
            businessId: appt.business_id,
            type: 'appointment_reminder_24h',
            title: 'Recordatorio: Tu cita es mañana',
            message: `Tu cita está programada para mañana a las ${new Date(
              appt.start_time,
            ).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
            appointmentId: appt.id,
            data: { reminderHours: 24 },
          })
          sentCount++
        }
      }

      // Procesar recordatorios de 1h
      for (const appt of appointments1h || []) {
        const existsNotification = await supabase
          .from('notifications')
          .select('id')
          .eq('appointment_id', appt.id)
          .eq('type', 'appointment_reminder_1h')
          .single()

        if (!existsNotification.data) {
          await this.createNotification({
            recipientId: appt.client_id,
            recipientType: 'user',
            businessId: appt.business_id,
            type: 'appointment_reminder_1h',
            title: 'Recordatorio: Tu cita es en 1 hora',
            message: 'Tu cita está por comenzar',
            appointmentId: appt.id,
            data: { reminderHours: 1 },
          })
          sentCount++
        }
      }

      logger.info(`[NotificationService] Sent ${sentCount} appointment reminders`)

      return { success: true, sentCount }
    } catch (err) {
      logger.error(`[NotificationService] Error sending reminders: ${err.message}`)
      throw err
    }
  }

  /**
   * Obtener notificaciones de un empleado
   */
  async getEmployeeNotifications(employeeId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    try {
      const offset = (page - 1) * limit

      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('recipient_id', employeeId)
        .eq('recipient_type', 'employee')
        .order('created_at', { ascending: false })

      if (unreadOnly) {
        query = query.eq('is_read', false)
      }

      query = query.range(offset, offset + limit - 1)

      const { data, count, error } = await query

      if (error) throw error

      return {
        notifications: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      }
    } catch (err) {
      logger.error(`[NotificationService] Error getting employee notifications: ${err.message}`)
      throw new ApiError('Error al obtener notificaciones', 500)
    }
  }
}

export default new NotificationService()
