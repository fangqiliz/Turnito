import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../ui/Spinner'

// Permite acceso a cualquier usuario autenticado (clientes puros y usuarios híbridos).
export default function ProtectedClientRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner fullPage size="lg" />

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
