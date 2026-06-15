import type { ControlMode, Difficulty, ThemePreference } from '@prisma/client';
import { prisma } from '@/config/database';

interface IUpdateSettingsInput {
  volumeLevel?: number;
  difficultyPreference?: Difficulty;
  themePreference?: ThemePreference;
  controlMode?: ControlMode;
}

export const settingsService = {
  async getMySettings(userId: string) {
    return prisma.playerSettings.findUnique({
      where: { userId },
    });
  },

  async updateMySettings(userId: string, payload: IUpdateSettingsInput) {
    return prisma.playerSettings.upsert({
      where: { userId },
      update: payload,
      create: {
        userId,
        ...payload,
      },
    });
  },
};
