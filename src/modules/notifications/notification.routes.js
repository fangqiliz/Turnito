import { Router } from 'express'
import notificationController from './notification.controller.js'
import { getNotificationsQuery, uuidParam, markMultipleAsReadBody } from './notification.validation.js'
import validate from '../../middlewares/validate.js'
import { requireAuth } from '../../middlewares/auth.js'

const router = Router()

// Todas las rutas requieren autenticación
router.use(requireAuth)

// Rutas sin parámetros PRIMERO (más específicas)
router.get('/unread/count', notificationController.getUnreadCount)
router.delete('/clear-read', notificationController.clearReadNotifications)

// Luego rutas generales
router.get('/', validate({ query: getNotificationsQuery }), notificationController.getNotifications)

// Rutas con parámetros después
router.put('/:id/read', validate({ params: uuidParam }), notificationController.markAsRead)
router.put('/mark-all', validate({ body: markMultipleAsReadBody }), notificationController.markMultipleAsRead)
router.delete('/:id', validate({ params: uuidParam }), notificationController.deleteNotification)
router.get('/employee', validate({ query: getNotificationsQuery }), notificationController.getEmployeeNotifications)

export default router
