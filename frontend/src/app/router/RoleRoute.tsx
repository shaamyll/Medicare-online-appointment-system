import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserRole } from '@/features/auth/types/auth.types';

export interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
