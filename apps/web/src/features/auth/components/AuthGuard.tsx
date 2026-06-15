import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { Role } from '@shared/types';
import { useAuth } from '@/hooks/useAuth';

const roleHomePath: Record<Role, string> = {
  [Role.STUDENT]: '/',
  [Role.TEACHER]: '/teacher',
  [Role.ADMIN]: '/admin',
};

interface IAuthGuardProps {
  role?: Role | Role[];
}

export const AuthGuard = ({ children, role }: PropsWithChildren<IAuthGuardProps>) => {
  const { isAuthenticated, role: currentRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const allowedRoles = role ? (Array.isArray(role) ? role : [role]) : [];

  if (allowedRoles.length && (!currentRole || !allowedRoles.includes(currentRole))) {
    return <Navigate to={currentRole ? roleHomePath[currentRole] : '/login'} replace />;
  }

  return <>{children}</>;
};
