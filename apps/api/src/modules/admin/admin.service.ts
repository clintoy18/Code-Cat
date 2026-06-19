import type { Prisma } from '@prisma/client';
import { Role } from '@shared/types/user';
import { prisma } from '@/config/database';
import { levelsService } from '@/modules/levels/levels.service';

type PrismaRole = NonNullable<Prisma.UserCreateInput['role']>;
type ReportType = NonNullable<Prisma.AdminReportCreateInput['reportType']>;

export const adminService = {
  async getPlayers() {
    return prisma.user.findMany({
      where: { role: Role.STUDENT as PrismaRole },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getPlayerProgress(userId: string) {
    return prisma.playerProgress.findMany({
      where: { userId },
      include: {
        level: true,
        puzzle: true,
      },
      orderBy: { lastUpdated: 'desc' },
    });
  },

  async createLevel(payload: Parameters<typeof levelsService.createLevel>[0]) {
    return levelsService.createLevel(payload);
  },

  async updateLevel(id: string, payload: Parameters<typeof levelsService.updateLevel>[1]) {
    return levelsService.updateLevel(id, payload);
  },

  async deleteLevel(id: string) {
    return levelsService.deleteLevel(id);
  },

  async createAnnouncement(adminId: string, payload: { title: string; message: string }) {
    return prisma.announcement.create({
      data: {
        adminId,
        title: payload.title,
        message: payload.message,
      },
    });
  },

  async getReports() {
    return prisma.adminReport.findMany({
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { generatedAt: 'desc' },
    });
  },

  async generateReport(adminId: string, payload: { reportType: ReportType; description: string }) {
    return prisma.adminReport.create({
      data: {
        adminId,
        reportType: payload.reportType as ReportType,
        description: payload.description,
      },
    });
  },
};
