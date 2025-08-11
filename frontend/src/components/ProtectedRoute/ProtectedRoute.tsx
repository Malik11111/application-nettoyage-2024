import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../utils/hooks';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles = [] }) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !roles.includes(user?.role || '')) {
    // Rediriger selon le rôle de l'utilisateur
    const defaultRoute = user?.role === 'AGENT' ? '/agent' : '/dashboard';
    return <Navigate to={defaultRoute} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;