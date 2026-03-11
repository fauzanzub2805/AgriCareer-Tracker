import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Wraps a route so only authenticated users (with the correct role) can access it.
 *
 * @param {string[]} roles - allowed roles; if empty, any authenticated user is allowed.
 */
export default function ProtectedRoute({ children, roles = [] }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    // Not logged in → redirect to login, preserving intended destination
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
