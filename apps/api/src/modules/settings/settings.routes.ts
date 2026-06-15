import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { validate } from '@/middleware/validate';
import { getMySettings, updateMySettings } from './settings.controller';
import { updateSettingsSchema } from './settings.schema';

export const settingsRouter = Router();

settingsRouter.use(authenticate);
settingsRouter.get('/me', getMySettings);
settingsRouter.put('/me', validate({ body: updateSettingsSchema }), updateMySettings);
