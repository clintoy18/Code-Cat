import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Role, IUser } from '@shared/types';

interface IAuthState {
  token: string | null;
  user: IUser | null;
  role: Role | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setSession: (payload: { token: string; user: IUser }) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<IAuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      role: null,
      isAuthenticated: false,
      hasHydrated: true,
      setSession: ({ token, user }) =>
        set({
          token,
          user,
          role: user.role,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          token: null,
          user: null,
          role: null,
          isAuthenticated: false,
        }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'codecat-auth',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => persistedState as IAuthState,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
