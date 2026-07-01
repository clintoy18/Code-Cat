import { Router } from 'express';
import { Role } from '@shared/types/user';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import {
  createUser,
  createAnnouncement,
  createLevel,
  deleteUser,
  deleteAnnouncement,
  deleteLevel,
  generateReport,
  getAdminLevels,
  getAnnouncements,
  getOverview,
  getPlayerProgress,
  getPlayers,
  getReports,
  getUsers,
  updateUser,
  updateAnnouncement,
  updateLevel,
} from './admin.controller';
import {
  adminUsersPaginationQuerySchema,
  adminPaginationQuerySchema,
  announcementIdParamsSchema,
  createAnnouncementSchema,
  createLevelSchema,
  createUserSchema,
  generateReportSchema,
  levelPaginationQuerySchema,
  levelIdParamsSchema,
  playerIdParamsSchema,
  playerProgressPaginationQuerySchema,
  reportPaginationQuerySchema,
  updateUserSchema,
  updateAnnouncementSchema,
  userIdParamsSchema,
  updateLevelSchema,
} from './admin.schema';

export const adminRouter = Router();

adminRouter.use(authenticate, authorize(Role.ADMIN));
adminRouter.get('/overview', getOverview);
adminRouter.get('/users', validate({ query: adminUsersPaginationQuerySchema }), getUsers);
adminRouter.post('/users', validate({ body: createUserSchema }), createUser);
adminRouter.patch('/users/:id', validate({ params: userIdParamsSchema, body: updateUserSchema }), updateUser);
adminRouter.delete('/users/:id', validate({ params: userIdParamsSchema }), deleteUser);
adminRouter.get('/players', validate({ query: adminPaginationQuerySchema }), getPlayers);
adminRouter.get(
  '/players/:id/progress',
  validate({ params: playerIdParamsSchema, query: playerProgressPaginationQuerySchema }),
  getPlayerProgress,
);
adminRouter.get('/levels', validate({ query: levelPaginationQuerySchema }), getAdminLevels);
adminRouter.post('/levels', validate({ body: createLevelSchema }), createLevel);
adminRouter.put('/levels/:id', validate({ params: levelIdParamsSchema, body: updateLevelSchema }), updateLevel);
adminRouter.delete('/levels/:id', validate({ params: levelIdParamsSchema }), deleteLevel);
adminRouter.get('/announcements', validate({ query: adminPaginationQuerySchema }), getAnnouncements);
adminRouter.post('/announcements', validate({ body: createAnnouncementSchema }), createAnnouncement);
adminRouter.patch(
  '/announcements/:id',
  validate({ params: announcementIdParamsSchema, body: updateAnnouncementSchema }),
  updateAnnouncement,
);
adminRouter.delete(
  '/announcements/:id',
  validate({ params: announcementIdParamsSchema }),
  deleteAnnouncement,
);
adminRouter.get('/reports', validate({ query: reportPaginationQuerySchema }), getReports);
adminRouter.post('/reports/generate', validate({ body: generateReportSchema }), generateReport);
