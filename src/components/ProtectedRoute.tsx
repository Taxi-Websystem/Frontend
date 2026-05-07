import { Navigate, Outlet } from 'react-router-dom';
import { JWT_BASE64URL_DASH_REGEX, JWT_BASE64URL_UNDERSCORE_REGEX } from '../utils/regex';

type AllowedRole = 'Manager' | 'Driver' | 'SuperAdmin';

interface ProtectedRouteProps {
  requiredRole: AllowedRole;
}

function decodeJwtPayload(token: string): Record<string, string> | null {
  try {
    const payloadBase64 = token.split('.')[1];
    const decoded = atob(
      payloadBase64
        .replace(JWT_BASE64URL_DASH_REGEX, '+')
        .replace(JWT_BASE64URL_UNDERSCORE_REGEX, '/')
    );
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

function getRoleFromToken(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return payload[ROLE_CLAIM] ?? payload['role'] ?? null;
}

function getDashboardForRole(role: string): string {
  return role === 'Driver' ? '/driver/dashboard' : '/manager/dashboard';
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const role = getRoleFromToken();

  if (!role) {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    return <Navigate to="/login" replace />;
  }

  const hasAccess =
    role === requiredRole ||
    (requiredRole === 'Manager' && role === 'SuperAdmin');

  if (!hasAccess) {
    return <Navigate to={getDashboardForRole(role)} replace />;
  }

  return <Outlet />;
}
