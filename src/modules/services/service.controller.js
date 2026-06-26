import serviceService from './service.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

/**
 * Controlador del módulo Services.
 * Delega toda la lógica de negocio a ServiceService.
 *
 * Convención multi-tenant:
 *  – POST:   business_id viene en el body.
 *  – GET:    businessId viene como param de ruta (:id).
 *  – PUT:    serviceId en params, ?businessId=<uuid> en query.
 *  – DELETE: serviceId en params, ?businessId=<uuid> en query.
 *            ?hard=true activa el hard delete (default: soft delete).
 */
class ServiceController {
  /**
   * POST /services
   * Crea un nuevo servicio para un negocio.
   *
   * @access Privado – Solo propietario del negocio (validado en el servicio)
   */
  create = async (req, res, next) => {
    try {
      const service = await serviceService.create(req.body, req.user.id);

      return sendSuccess(res, 'Servicio creado correctamente.', service, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /services/business/:id
   * Lista todos los servicios de un negocio (multi-tenant).
   *
   * @access Privado (Requiere Token)
   */
  getByBusiness = async (req, res, next) => {
    try {
      const services = await serviceService.findByBusiness(req.params.id);

      return sendSuccess(
        res,
        'Servicios del negocio obtenidos correctamente.',
        services
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /services/:id?businessId=<uuid>
   * Actualiza un servicio existente.
   *
   * @access Privado – Solo propietario del negocio
   */
  update = async (req, res, next) => {
    try {
      const { id: serviceId } = req.params;
      const { businessId } = req.query;

      const updated = await serviceService.update(
        serviceId,
        businessId,
        req.body,
        req.user.id
      );

      return sendSuccess(res, 'Servicio actualizado correctamente.', updated);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /services/:id?businessId=<uuid>[&hard=true]
   * Elimina o desactiva un servicio.
   *
   * Por defecto realiza soft delete (is_active = false).
   * Pasar ?hard=true para eliminar físicamente el registro.
   *
   * @access Privado – Solo propietario del negocio
   */
  remove = async (req, res, next) => {
    try {
      const { id: serviceId } = req.params;
      const { businessId, hard } = req.query;

      // Convertir el query string 'true'/'false' a boolean
      const isHardDelete = hard === 'true';

      const result = await serviceService.remove(
        serviceId,
        businessId,
        req.user.id,
        { hard: isHardDelete }
      );

      const message = isHardDelete
        ? 'Servicio eliminado permanentemente.'
        : 'Servicio desactivado correctamente (soft delete).';

      return sendSuccess(res, message, isHardDelete ? null : result);
    } catch (error) {
      next(error);
    }
  };
}

export default new ServiceController();
