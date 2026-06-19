import jwt from 'jsonwebtoken';
import type { Role } from '@shared/types/user';
import { env } from '@/config/env';

export interface IJwtPayload {
  sub: string;
  email: string;
  username: string;
  role: Role;
}

export const signJwt = (payload: IJwtPayload) =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

export const verifyJwt = (token: string) => jwt.verify(token, env.JWT_SECRET) as IJwtPayload;
