import { useMemo } from 'react'
import { useBusiness } from '../context/BusinessContext'

/**
 * Deriva el rol del usuario a partir de los datos ya cargados en BusinessContext.
 * No hace llamadas extra a la API ni introduce nuevos campos en la DB.
 *
 * ADMIN    → dueño de negocio ó empleado con role 'owner'|'admin'
 * MANAGER  → empleado con role 'manager' (sin ownership)
 * EMPLOYEE → empleado con role 'staff' (sin ownership)
 * CLIENT   → sin ninguna asociación a negocios
 */
export function useUserRole() {
  const { ownedBusinesses, employeeRoles, loading } = useBusiness()

  const { isAdmin, isManager, isStaff, isEmployee, isClient } = useMemo(() => {
    const admin =
      ownedBusinesses.length > 0 ||
      employeeRoles.some(
        (r) => (r.role === 'owner' || r.role === 'admin') && r.isActive
      )

    // Manager: empleado con role 'manager' y activo (pero no admin)
    const manager =
      !admin &&
      employeeRoles.some(
        (r) => r.role === 'manager' && r.isActive
      )

    // Staff: empleado con role 'staff' y activo (pero no admin ni manager)
    const staff =
      !admin &&
      !manager &&
      employeeRoles.some(
        (r) => r.role === 'staff' && r.isActive
      )

    // Employee (genérico): cualquier empleado activo que no sea admin
    const employee = manager || staff

    return { 
      isAdmin: admin, 
      isManager: manager,
      isStaff: staff,
      isEmployee: employee, 
      isClient: !admin && !employee 
    }
  }, [ownedBusinesses, employeeRoles])

  return { isAdmin, isManager, isStaff, isEmployee, isClient, loading }
}
