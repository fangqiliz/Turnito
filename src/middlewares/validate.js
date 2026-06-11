import ApiError from '../utils/apiError.js';

/**
 * Middleware para validar datos de entrada de la solicitud usando esquemas Zod.
 * Reemplaza automáticamente los valores originales en req con los valores parseados y validados (con coerción aplicada si existiera).
 * 
 * @param {object} schemas - Esquemas de validación opcionales para la petición.
 * @param {import('zod').ZodTypeAny} [schemas.body] - Esquema para req.body.
 * @param {import('zod').ZodTypeAny} [schemas.query] - Esquema para req.query.
 * @param {import('zod').ZodTypeAny} [schemas.params] - Esquema para req.params.
 * @returns {function(import('express').Request, import('express').Response, import('express').NextFunction): void}
 */
const validate = (schemas) => (req, res, next) => {
  try {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.query) {
      req.query = schemas.query.parse(req.query);
    }
    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }
    return next();
  } catch (error) {
    // Si el error proviene de la validación de Zod, estructurar mensajes amigables
    if (error.name === 'ZodError' || error.errors) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return next(ApiError.badRequest('Error de validación en la solicitud', formattedErrors));
    }
    
    return next(error);
  }
};

export default validate;
