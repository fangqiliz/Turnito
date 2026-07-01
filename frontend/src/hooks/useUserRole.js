import { useMemo } from 'react'
import { useBusiness } from '../context/BusinessContext'

/**
 * Deriva el rol del usuario a partir de los datos ya cargados en BusinessContext.
 * No hace llamadas extra a la API ni introduce nuevos campos en la DB.
 *
 * ADMIN    → dueño de negocio ó empleado con role 'owner'|'admin'
 * EMPLOYEE → empleado con role 'staff'|'manager' sin ownership
 * CLIENT   → sin ninguna asociación a negocios
 */
export function useUserRole() {
  const { ownedBusinesses, employeeRoles, loading } = useBusiness()

  const { isAdmin, isEmployee, isClient } = useMemo(() => {
    const admin =
      ownedBusinesses.length > 0 ||
      employeeRoles.some(
        (r) => (r.role === 'owner' || r.role === 'admin') && r.isActive
      )

    const employee =
      !admin &&
      employeeRoles.some(
        (r) => (r.role === 'staff' || r.role === 'manager') && r.isActive
      )

    return { isAdmin: admin, isEmployee: employee, isClient: !admin && !employee }
  }, [ownedBusinesses, employeeRoles])

  return { isAdmin, isEmployee, isClient, loading }
}
