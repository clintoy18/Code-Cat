import { prisma } from '@/config/database';

export const achievementsService = {
  async getMyAchievements(userId: string) {
    return prisma.achievement.findMany({
      where: { userId },
      orderBy: { dateUnlocked: 'desc' },
    });
  },
};
