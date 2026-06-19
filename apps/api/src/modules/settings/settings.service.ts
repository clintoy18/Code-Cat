import type { Prisma } from '@prisma/client';
import type { Difficulty } from '@shared/types/level';
import { prisma } from '@/config/database';

type ThemePreference = 'LIGHT' | 'DARK' | 'SYSTEM';
type ControlMode = 'DRAG_DROP' | 'KEYBOARD';

interface IUpdateSettingsInput {
  volumeLevel?: number;
  difficultyPreference?: Difficulty;
  themePreference?: ThemePreference;
  controlMode?: ControlMode;
}

type PrismaDifficulty = NonNullable<Prisma.PlayerSettingsCreateInput['difficultyPreference']>;
type PrismaThemePreference = NonNullable<Prisma.PlayerSettingsCreateInput['themePreference']>;
type PrismaControlMode = NonNullable<Prisma.PlayerSettingsCreateInput['controlMode']>;

export const settingsService = {
  async getMySettings(userId: string) {
    return prisma.playerSettings.findUnique({
      where: { userId },
    });
  },

  async updateMySettings(userId: string, payload: IUpdateSettingsInput) {
    const prismaPayload = {
      ...payload,
      difficultyPreference: payload.difficultyPreference as PrismaDifficulty | undefined,
      themePreference: payload.themePreference as PrismaThemePreference | undefined,
      controlMode: payload.controlMode as PrismaControlMode | undefined,
    };

    return prisma.playerSettings.upsert({
      where: { userId },
      update: prismaPayload,
      create: {
        userId,
        ...prismaPayload,
      },
    });
  },
};
