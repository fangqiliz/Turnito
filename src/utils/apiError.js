/**
 * Clase de error personalizada para solicitudes API operacionales.
 * Permite capturar códigos de estado HTTP, mensajes descriptivos y detalles adicionales de validación.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - Código de estado HTTP (ej. 400, 404, 401).
   * @param {string} message - Mensaje de error general.
   * @param {any} [errors=null] - Detalles adicionales del error (por ejemplo, errores de validación de Zod).
   * @param {boolean} [isOperational=true] - Indica si es un error operacional (esperado) o un bug inesperado.
   * @param {string} [stack=''] - Pila de llamadas (stack trace).
   */
  constructor(statusCode, message, errors = null, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // Métodos de conveniencia para instanciar errores comunes
  static badRequest(message, errors = null) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'No autorizado') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Acceso prohibido') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Recurso no encontrado') {
    return new ApiError(404, message);
  }

  static internal(message = 'Error interno del servidor', errors = null) {
    return new ApiError(500, message, errors, false);
  }
}

export default ApiError;
