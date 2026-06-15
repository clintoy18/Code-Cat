import { Role } from '@shared/types';
import { AuthGuard } from '@/features/auth';
import { AppLayout } from '@/components/layout';

export const PlayerRoutes = () => (
  <AuthGuard role={Role.STUDENT}>
    <AppLayout />
  </AuthGuard>
);
