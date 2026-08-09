/**
 * Cron Jobs para Turnito
 * Tareas automáticas que se ejecutan en intervalos específicos
 */

import logger from '../config/logger.js'
import notificationService from '../modules/notifications/notification.service.js'
import appointmentService from '../modules/appointments/appointment.service.js'

/**
 * Inicializar todos los cron jobs
 */
export function initializeCronJobs() {
  logger.info('[CronJobs] Iniciando cron jobs...')

  // Job de recordatorios cada 30 minutos
  startAppointmentRemindersJob()

  // Job de cancelación automática de citas vencidas cada 1 hora
  startAutoCancelExpiredAppointmentsJob()

  logger.info('[CronJobs] Todos los cron jobs iniciados exitosamente')
}

/**
 * Job: Enviar recordatorios de citas
 * Se ejecuta cada 30 minutos para enviar recordatorios de:
 * - 24 horas antes
 * - 1 hora antes
 */
function startAppointmentRemindersJob() {
  // Ejecutar inmediatamente
  executeAppointmentRemindersJob()

  // Luego cada 30 minutos
  const interval = setInterval(executeAppointmentRemindersJob, 30 * 60 * 1000)

  logger.info('[AppointmentRemindersJob] Iniciado. Se ejecutará cada 30 minutos.')

  return interval
}

async function executeAppointmentRemindersJob() {
  try {
    const result = await notificationService.sendAppointmentReminders()
    if (result.sentCount > 0) {
      logger.info(`[AppointmentRemindersJob] Enviados ${result.sentCount} recordatorios`)
    }
  } catch (err) {
    logger.error(`[AppointmentRemindersJob] Error: ${err.message}`)
  }
}

/**
 * Job: Cancelar automáticamente las citas vencidas
 * Se ejecuta cada 1 hora para cancelar citas cuyo start_time ya ha pasado
 */
function startAutoCancelExpiredAppointmentsJob() {
  // Ejecutar inmediatamente
  executeAutoCancelExpiredAppointmentsJob()

  // Luego cada 1 hora
  const interval = setInterval(executeAutoCancelExpiredAppointmentsJob, 60 * 60 * 1000)

  logger.info('[AutoCancelExpiredAppointmentsJob] Iniciado. Se ejecutará cada 1 hora.')

  return interval
}

async function executeAutoCancelExpiredAppointmentsJob() {
  try {
    const result = await appointmentService.autoCancelExpiredAppointments()
    if (result.cancelledCount > 0) {
      logger.info(`[AutoCancelExpiredAppointmentsJob] Canceladas ${result.cancelledCount} citas vencidas`)
    }
    if (result.errors.length > 0) {
      logger.warn(`[AutoCancelExpiredAppointmentsJob] Errores: ${result.errors.join(', ')}`)
    }
  } catch (err) {
    logger.error(`[AutoCancelExpiredAppointmentsJob] Error: ${err.message}`)
  }
}

/**
 * Alternativa usando node-cron (si está instalado)
 * Para usar node-cron:
 * 1. npm install node-cron
 * 2. Descomentar el código abajo
 * 3. Comentar el código anterior
 */

// ALTERNATIVA CON NODE-CRON (descomenta si lo prefieres):
// npm install node-cron
// Luego reemplaza initializeCronJobs() con:
//
// import cron from 'node-cron'
// export function initializeCronJobs() {
//   logger.info('[CronJobs] Iniciando cron jobs con node-cron...')
//   cron.schedule('0 */30 * * * *', executeAppointmentRemindersJob)
//   logger.info('[CronJobs] Cron jobs iniciados exitosamente')
// }
// async function executeAppointmentRemindersJob() {
//   try {
//     const result = await notificationService.sendAppointmentReminders()
//     if (result.sentCount > 0) {
//       logger.info(`[AppointmentRemindersJob] Enviados ${result.sentCount} recordatorios`)
//     }
//   } catch (err) {
//     logger.error(`[AppointmentRemindersJob] Error: ${err.message}`)
//   }
// }
