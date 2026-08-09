import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useUserRole } from '../../hooks/useUserRole'
import Spinner from '../ui/Spinner'

/**
 * Redirige a cada usuario a su portal según su rol derivado.
 *
 * ADMIN    → /dashboard
 * MANAGER  → /manager
 * STAFF    → /employee
 * CLIENT   → /client
 */
export default function SmartRedirect() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { isAdmin, isManager, isStaff, loading: roleLoading } = useUserRole()

  if (authLoading || (isAuthenticated && roleLoading)) {
    return <Spinner fullPage size="lg" />
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isAdmin)          return <Navigate to="/dashboard" replace />
  if (isManager)        return <Navigate to="/manager" replace />
  if (isStaff)          return <Navigate to="/employee" replace />
  return                       <Navigate to="/client" replace />
}
