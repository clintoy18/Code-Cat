import { Router } from 'express';
import { Role } from '@/shared';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import {
  createAnnouncement,
  createLevel,
  deleteLevel,
  generateReport,
  getPlayerProgress,
  getPlayers,
  getReports,
  updateLevel,
} from './admin.controller';
import {
  createAnnouncementSchema,
  createLevelSchema,
  generateReportSchema,
  levelIdParamsSchema,
  playerIdParamsSchema,
  updateLevelSchema,
} from './admin.schema';

export const adminRouter = Router();

adminRouter.use(authenticate, authorize(Role.ADMIN));
adminRouter.get('/players', getPlayers);
adminRouter.get('/players/:id/progress', validate({ params: playerIdParamsSchema }), getPlayerProgress);
adminRouter.post('/levels', validate({ body: createLevelSchema }), createLevel);
adminRouter.put('/levels/:id', validate({ params: levelIdParamsSchema, body: updateLevelSchema }), updateLevel);
adminRouter.delete('/levels/:id', validate({ params: levelIdParamsSchema }), deleteLevel);
adminRouter.post('/announcements', validate({ body: createAnnouncementSchema }), createAnnouncement);
adminRouter.get('/reports', getReports);
adminRouter.post('/reports/generate', validate({ body: generateReportSchema }), generateReport);
