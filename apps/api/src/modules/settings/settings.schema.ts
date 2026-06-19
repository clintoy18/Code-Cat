import { Difficulty } from '@shared/types/level';
import { z } from 'zod';

export const updateSettingsSchema = z.object({
  volumeLevel: z.number().int().min(0).max(100).optional(),
  difficultyPreference: z.nativeEnum(Difficulty).optional(),
  themePreference: z.enum(['LIGHT', 'DARK', 'SYSTEM']).optional(),
  controlMode: z.enum(['DRAG_DROP', 'KEYBOARD']).optional(),
});
