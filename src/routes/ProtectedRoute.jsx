import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/auth.js';
import { hasRole } from '../utils/roles.js';

export default function ProtectedRoute({ children, roles }) {
  const user = useSelector(selectUser);
  const loc = useLocation();

  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />;
  if (roles && !hasRole(user.role, roles)) return <Navigate to="/" replace />;
  return children;
}
