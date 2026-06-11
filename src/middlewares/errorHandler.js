import env from '../config/env.js';
import logger from '../config/logger.js';
import ApiError from '../utils/apiError.js';

/**
 * Middleware global para capturar y formatear errores en Express.
 * 
 * @param {Error|ApiError} err - Instancia del error capturado.
 * @param {import('express').Request} req - Objeto de solicitud.
 * @param {import('express').Response} res - Objeto de respuesta.
 * @param {import('express').NextFunction} next - Siguiente middleware en la cadena.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  let errors = err.errors || null;
  let isOperational = err.isOperational;

  // Si el error no es una instancia de nuestro ApiError, lo encapsulamos por defecto como 500
  if (!(err instanceof ApiError)) {
    statusCode = err.statusCode || 500;
    message = err.message || 'Error interno del servidor';
    isOperational = false; // No operacional significa un bug imprevisto
  }

  // Registrar el error en logs centralizados de Winston
  const logDetails = `[${req.method}] ${req.originalUrl} - IP: ${req.ip} - Status: ${statusCode} - Msg: ${message}`;
  if (statusCode >= 500) {
    logger.error(`${logDetails}\nStack: ${err.stack || 'No stack trace available'}`);
  } else {
    logger.warn(logDetails);
  }

  // Formatear respuesta estándar
  const response = {
    success: false,
    message,
    ...(errors && { errors }),
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  // Sanitizar mensajes de error 500 no controlados en producción para evitar fugas de información
  if (env.NODE_ENV === 'production' && !isOperational && statusCode === 500) {
    response.message = 'Algo salió mal en el servidor. Por favor, inténtelo de nuevo más tarde.';
  }

  return res.status(statusCode).json(response);
};

export default errorHandler;
