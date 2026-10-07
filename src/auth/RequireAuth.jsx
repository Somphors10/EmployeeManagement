import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="auth-boot">
        <p>Loading workspace…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export function RequirePermission({ permission, children }) {
  const { can } = useAuth();
  if (!can(permission)) {
    return <Navigate to="/forbidden" replace />;
  }
  return children ?? <Outlet />;
}
