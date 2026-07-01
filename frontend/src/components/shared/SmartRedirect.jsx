import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useUserRole } from '../../hooks/useUserRole'
import Spinner from '../ui/Spinner'

/**
 * Redirige a cada usuario a su portal según su rol derivado.
 *
 * ADMIN    → /dashboard
 * EMPLOYEE → /employee
 * CLIENT   → /client
 */
export default function SmartRedirect() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { isAdmin, isEmployee, loading: roleLoading } = useUserRole()

  if (authLoading || (isAuthenticated && roleLoading)) {
    return <Spinner fullPage size="lg" />
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isAdmin)          return <Navigate to="/dashboard" replace />
  if (isEmployee)       return <Navigate to="/employee" replace />
  return                       <Navigate to="/client" replace />
}
