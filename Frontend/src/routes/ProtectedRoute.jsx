import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../constants/routes.constants';

export default function ProtectedRoute({ children, permission }) {
  const { isLoggedIn, user, hasPermission } = useApp();
  if (!isLoggedIn) return <Navigate to={ROUTES.LOGIN} replace />;
  if (permission && user?.role !== 'SUPER_ADMIN' && !hasPermission(permission)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }
  return children;
}
