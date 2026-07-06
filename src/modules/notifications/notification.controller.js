import notificationService from './notification.service.js'
import supabase from '../../config/supabase.js'
import { sendSuccess } from '../../utils/apiResponse.js'

class NotificationController {
  // GET /api/notifications
  getNotifications = async (req, res, next) => {
    try {
      const userId = req.user.id
      const { page = 1, limit = 20, unreadOnly = false } = req.query

      const result = await notificationService.getNotifications(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        unreadOnly: unreadOnly === 'true' || unreadOnly === true,
      })

      return sendSuccess(res, 'Notificaciones obtenidas', result)
    } catch (error) {
      next(error)
    }
  }

  // GET /api/notifications/unread/count
  getUnreadCount = async (req, res, next) => {
    try {
      const userId = req.user.id
      const count = await notificationService.getUnreadCount(userId)

      return sendSuccess(res, 'Contador obtenido', { unreadCount: count })
    } catch (error) {
      next(error)
    }
  }

  // PUT /api/notifications/:id/read
  markAsRead = async (req, res, next) => {
    try {
      const userId = req.user.id
      const { id } = req.params

      const notification = await notificationService.markAsRead(id, userId)

      return sendSuccess(res, 'Notificación marcada como leída', notification)
    } catch (error) {
      next(error)
    }
  }

  // PUT /api/notifications/mark-all
  markMultipleAsRead = async (req, res, next) => {
    try {
      const userId = req.user.id
      const { notificationIds } = req.body

      const notifications = await notificationService.markMultipleAsRead(
        notificationIds,
        userId,
      )

      return sendSuccess(
        res,
        `${notifications.length} notificaciones marcadas como leídas`,
        { count: notifications.length },
      )
    } catch (error) {
      next(error)
    }
  }

  // DELETE /api/notifications/:id
  deleteNotification = async (req, res, next) => {
    try {
      const userId = req.user.id
      const { id } = req.params

      await notificationService.deleteNotification(id, userId)

      return sendSuccess(res, 'Notificación eliminada')
    } catch (error) {
      next(error)
    }
  }

  // DELETE /api/notifications/clear-read
  clearReadNotifications = async (req, res, next) => {
    try {
      const userId = req.user.id

      await notificationService.clearReadNotifications(userId)

      return sendSuccess(res, 'Notificaciones leídas eliminadas')
    } catch (error) {
      next(error)
    }
  }

  // GET /api/notifications/employee
  getEmployeeNotifications = async (req, res, next) => {
    try {
      const userId = req.user.id
      const { page = 1, limit = 20, unreadOnly = false } = req.query

      // Obtener el empleado del usuario actual
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (empError || !employee) {
        return next(new Error('Empleado no encontrado'))
      }

      const result = await notificationService.getEmployeeNotifications(employee.id, {
        page: parseInt(page),
        limit: parseInt(limit),
        unreadOnly: unreadOnly === 'true' || unreadOnly === true,
      })

      return sendSuccess(res, 'Notificaciones del empleado obtenidas', result)
    } catch (error) {
      next(error)
    }
  }
}

export default new NotificationController()
