import env from './config/env.js'; // Debe importarse primero para asegurar que las variables de entorno se validen antes de que corra cualquier módulo
import app from './app.js';
import logger from './config/logger.js';
import './config/supabase.js'; // Inicializa el cliente Supabase al arrancar


const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Servidor de Turnito ejecutándose en modo [${env.NODE_ENV}] en el puerto: ${env.PORT}`);
});

/**
 * Cierre controlado y elegante del servidor HTTP y liberación de recursos en caso de fallos críticos.
 * 
 * @param {Error} error - Error capturado.
 * @param {string} type - Tipo de error del proceso.
 */
const gracefulShutdown = (error, type) => {
  logger.error(`🚨 Fatal: Se detectó un error de tipo [${type}]. Apagando servidor...`);
  logger.error(error.stack || error.message);
  
  // Detener la aceptación de nuevas conexiones HTTP
  server.close(() => {
    logger.info('💤 Servidor HTTP cerrado de forma segura.');
    process.exit(1);
  });

  // Limitar el tiempo de espera de apagado para evitar colgar el proceso indefinidamente (Timeout de 10s)
  setTimeout(() => {
    logger.error('⚠️ Apagado forzado del servidor debido a un retraso excesivo en el cierre.');
    process.exit(1);
  }, 10000);
};

// Captura de errores no controlados a nivel de proceso
process.on('uncaughtException', (error) => gracefulShutdown(error, 'uncaughtException'));
process.on('unhandledRejection', (error) => gracefulShutdown(error, 'unhandledRejection'));
