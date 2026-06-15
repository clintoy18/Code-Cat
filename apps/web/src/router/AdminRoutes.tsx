import { Role } from '@shared/types';
import { AuthGuard } from '@/features/auth';
import { AdminLayout } from '@/components/layout';

export const AdminRoutes = () => (
  <AuthGuard role={Role.ADMIN}>
    <AdminLayout />
  </AuthGuard>
);
