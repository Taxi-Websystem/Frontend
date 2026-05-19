import { Navigate, Outlet } from 'react-router-dom';
import { clearAuth, getCurrentRole, getToken, type AppRole } from '../utils/auth';

interface ProtectedRouteProps {
  requiredRole: AppRole;
}

function getDashboardPathForRole(role: AppRole): string {
  return role === 'Driver' ? '/driver/dashboard' : '/manager/dashboard';
}

function hasRequiredRole(currentRole: AppRole, requiredRole: AppRole): boolean {
  return (
    currentRole === requiredRole ||
    (requiredRole === 'Manager' && currentRole === 'SuperAdmin')
  );
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }

  const currentRole = getCurrentRole();

  if (!currentRole) {
    clearAuth();
    return <Navigate to="/login" replace />;
  }

  if (!hasRequiredRole(currentRole, requiredRole)) {
    return <Navigate to={getDashboardPathForRole(currentRole)} replace />;
  }

  return <Outlet />;
}
