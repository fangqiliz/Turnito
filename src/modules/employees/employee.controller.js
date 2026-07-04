import employeeService from './employee.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

/**
 * Controlador del módulo Employees.
 * Delega toda la lógica de negocio a EmployeeService.
 * El `businessId` para las operaciones de update/delete se obtiene
 * desde el query param `?businessId=` para mantener la validación
 * multi-tenant sin exponer rutas anidadas complejas.
 */
class EmployeeController {
  /**
   * POST /employees
   * Crea un nuevo empleado en un negocio.
   * El business_id viene en el body (validado por Zod).
   *
   * @access Privado (Requiere Token + Ownership del negocio)
   */
  create = async (req, res, next) => {
    try {
      const employee = await employeeService.create(req.body, req.user.id);

      return sendSuccess(
        res,
        'Empleado registrado correctamente.',
        employee,
        201
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /employees/business/:id
   * Lista todos los empleados de un negocio específico (multi-tenant).
   *
   * @access Privado (Requiere Token)
   */
  getByBusiness = async (req, res, next) => {
    try {
      const employees = await employeeService.findByBusiness(
        req.params.id,
        req.user.id
      );

      return sendSuccess(
        res,
        'Empleados del negocio obtenidos correctamente.',
        employees
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /employees/:id
   * Actualiza los datos de un empleado.
   * El `businessId` se recibe como query param: ?businessId=<uuid>
   * Esto permite al servicio validar el contexto multi-tenant sin
   * necesitar rutas anidadas (/businesses/:bid/employees/:eid).
   *
   * @access Privado (Requiere Token + Ownership del negocio)
   */
  update = async (req, res, next) => {
    try {
      const { id: employeeId } = req.params;
      const { businessId } = req.query;

      const updated = await employeeService.update(
        employeeId,
        businessId,
        req.body,
        req.user.id
      );

      return sendSuccess(res, 'Empleado actualizado correctamente.', updated);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /employees/me
   * Actualiza el teléfono del propio registro de empleado del usuario autenticado.
   * El `businessId` se recibe en el body para identificar el registro dentro del tenant.
   *
   * @access Privado (Requiere Token) — solo modifica el propio registro
   */
  updateOwn = async (req, res, next) => {
    try {
      const { businessId, phone } = req.body;

      const updated = await employeeService.updateOwnPhone(
        req.user.id,
        businessId,
        phone
      );

      return sendSuccess(res, 'Teléfono actualizado correctamente.', updated);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /employees/:id
   * Elimina un empleado del negocio.
   * El `businessId` se recibe como query param: ?businessId=<uuid>
   *
   * @access Privado (Requiere Token + Ownership del negocio)
   */
  remove = async (req, res, next) => {
    try {
      const { id: employeeId } = req.params;
      const { businessId } = req.query;

      await employeeService.remove(employeeId, businessId, req.user.id);

      return sendSuccess(res, 'Empleado eliminado correctamente.', null, 200);
    } catch (error) {
      next(error);
    }
  };
}

export default new EmployeeController();
