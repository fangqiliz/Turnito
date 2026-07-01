import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useUserRole } from '../../hooks/useUserRole'
import Spinner from '../ui/Spinner'

export default function ProtectedAdminRoute({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { isAdmin, loading: roleLoading } = useUserRole()
  const location = useLocation()

  if (authLoading || (isAuthenticated && roleLoading)) {
    return <Spinner fullPage size="lg" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}
