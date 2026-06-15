import { Navigate } from 'react-router-dom';
import { Role } from '@shared/types';
import { useAuth } from '@/hooks/useAuth';

export const HomeRedirect = () => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />;
  }

  if (role === Role.TEACHER) {
    return <Navigate to="/teacher" replace />;
  }

  if (role === Role.ADMIN) {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/" replace />;
};
