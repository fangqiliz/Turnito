/**
 * Envía una respuesta HTTP de éxito estandarizada.
 * 
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @param {string} message - Mensaje descriptivo de la operación.
 * @param {any} [data=null] - Datos adicionales de respuesta (objetos, arreglos, etc).
 * @param {number} [statusCode=200] - Código de estado HTTP (por defecto 200).
 * @returns {import('express').Response}
 */
export const sendSuccess = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};
