import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from '@/config/env';
import { errorHandler } from '@/middleware/errorHandler';
import { achievementsRouter } from '@/modules/achievements';
import { adminRouter } from '@/modules/admin';
import { authRouter } from '@/modules/auth';
import { levelsRouter } from '@/modules/levels';
import { progressRouter } from '@/modules/progress';
import { settingsRouter } from '@/modules/settings';
import { teacherRouter } from '@/modules/teacher';

export const app = express();

const allowedOrigins = [
  env.WEB_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean) as string[];

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
    },
  });
});

app.use('/api/auth', authRouter);
app.use('/api/levels', levelsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/achievements', achievementsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/teacher', teacherRouter);
app.use('/api/admin', adminRouter);
app.use(errorHandler);
