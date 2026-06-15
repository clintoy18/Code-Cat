import type { Role } from '@/shared';

declare global {
  namespace Express {
    interface UserContext {
      id: string;
      email: string;
      username: string;
      role: Role;
    }

    interface Request {
      user?: UserContext;
    }
  }
}

export {};
