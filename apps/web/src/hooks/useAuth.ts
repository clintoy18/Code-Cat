import { useAuthStore } from '@/store/authStore';

export const useAuth = () =>
  useAuthStore((state) => ({
    hasHydrated: state.hasHydrated,
    isAuthenticated: state.isAuthenticated,
    role: state.role,
    user: state.user,
    setSession: state.setSession,
    logout: state.logout,
  }));
