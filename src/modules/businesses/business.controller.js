import businessService from './business.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import ApiError from '../../utils/apiError.js';

/**
 * Controlador del módulo Businesses.
 * Delega toda la lógica de negocio al BusinessService.
 */
class BusinessController {
  /**
   * POST /businesses
   * Crea un nuevo negocio asociado al usuario autenticado como propietario.
   *
   * @route  POST /businesses
   * @access Privado
   */
  create = async (req, res, next) => {
    try {
      const business = await businessService.create(req.body, req.user.id);

      return sendSuccess(res, 'Negocio creado correctamente.', business, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /businesses
   * Retorna la lista de negocios, paginada (?page, ?limit, ?slug opcional).
   *
   * @route  GET /businesses
   * @access Privado (Requiere Token)
   */
  getAll = async (req, res, next) => {
    try {
      const result = await businessService.findAll(req.query);

      return sendSuccess(res, 'Lista de negocios obtenida correctamente.', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /businesses/:id
   * Retorna los detalles de un negocio específico, incluyendo la información del propietario.
   *
   * @route  GET /businesses/:id
   * @access Privado (Requiere Token)
   */
  getById = async (req, res, next) => {
    try {
      const business = await businessService.findById(req.params.id);

      return sendSuccess(res, 'Negocio obtenido correctamente.', business);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /businesses/:id
   * Actualiza los campos de un negocio.
   * Solo el propietario del negocio puede realizar cambios (ownership check en el servicio).
   *
   * @route  PUT /businesses/:id
   * @access Privado (Requiere Token + Ownership)
   */
  update = async (req, res, next) => {
    try {
      const updated = await businessService.update(req.params.id, req.body, req.user.id);

      return sendSuccess(res, 'Negocio actualizado correctamente.', updated);
    } catch (error) {
      next(error);
    }
  };
}

export default new BusinessController();
