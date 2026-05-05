import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute — checks token and optionally restricts by role.
 * Usage: <ProtectedRoute allowedRoles={['admin']}><Component /></ProtectedRoute>
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to appropriate home based on their actual role
    const homeMap = { admin: '/', supplier: '/supplier', client: '/client' };
    return <Navigate to={homeMap[role] || '/login'} replace />;
  }

  return children;
}
