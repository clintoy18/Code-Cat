import type { Prisma } from '@prisma/client';
import { Role } from '@shared/types/user';
import { prisma } from '@/config/database';
import { AppError } from '@/middleware/errorHandler';

type PrismaRole = NonNullable<Prisma.UserCreateInput['role']>;

export const teacherService = {
  async getStudents() {
    return prisma.user.findMany({
      where: { role: Role.STUDENT as PrismaRole },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        progressEntries: {
          select: {
            id: true,
            status: true,
            attempts: true,
            timeSpent: true,
            lastUpdated: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getStudentProgress(studentId: string) {
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        role: Role.STUDENT as PrismaRole,
      },
      select: {
        id: true,
      },
    });

    if (!student) {
      throw new AppError('NOT_FOUND', 'Student not found.', 404);
    }

    return prisma.playerProgress.findMany({
      where: { userId: studentId },
      include: {
        level: true,
        puzzle: true,
      },
      orderBy: { lastUpdated: 'desc' },
    });
  },
};
