import { Navigate, Outlet, useLocation } from 'react-router-dom';
import AuthStatus from '../auth/AuthStatus';
import { useAuth } from '../auth/useAuth';

export function PublicOnly() {
  const { state } = useAuth();
  if (state.status === 'checking' || state.status === 'error') return <AuthStatus />;
  return state.status === 'authenticated' ? <Navigate to="/" replace /> : <Outlet />;
}

export function RequireAuth() {
  const { state } = useAuth();
  const location = useLocation();
  if (state.status === 'checking' || state.status === 'error') return <AuthStatus />;
  return state.status === 'authenticated' || state.status === 'guest'
    ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
