import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useUserRole } from '../../hooks/useUserRole'
import Spinner from '../ui/Spinner'

export default function ProtectedEmployeeRoute({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { isEmployee, loading: roleLoading } = useUserRole()
  const location = useLocation()

  if (authLoading || (isAuthenticated && roleLoading)) {
    return <Spinner fullPage size="lg" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isEmployee) {
    return <Navigate to="/" replace />
  }

  return children
}
