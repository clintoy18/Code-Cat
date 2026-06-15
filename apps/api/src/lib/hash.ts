import bcrypt from 'bcryptjs';
import { env } from '@/config/env';

export const hashValue = (value: string) => bcrypt.hash(value, env.BCRYPT_ROUNDS);

export const compareHash = (value: string, hash: string) => bcrypt.compare(value, hash);
