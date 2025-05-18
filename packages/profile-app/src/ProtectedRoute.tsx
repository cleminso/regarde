import { useIsAuthenticated } from 'jazz-react';
import { Navigate, Outlet } from 'react-router-dom';

export function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
