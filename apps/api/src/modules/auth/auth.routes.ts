import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { validate } from '@/middleware/validate';
import { getMe, loginUser, logoutUser, registerUser } from './auth.controller';
import { loginSchema, registerSchema } from './auth.schema';

export const authRouter = Router();

authRouter.post('/register', validate({ body: registerSchema }), registerUser);
authRouter.post('/login', validate({ body: loginSchema }), loginUser);
authRouter.post('/logout', logoutUser);
authRouter.get('/me', authenticate, getMe);
