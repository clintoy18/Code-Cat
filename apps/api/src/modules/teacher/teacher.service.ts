import { Role } from '@prisma/client';
import { prisma } from '@/config/database';
import { AppError } from '@/middleware/errorHandler';

export const teacherService = {
  async getStudents() {
    return prisma.user.findMany({
      where: { role: Role.STUDENT },
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
        role: Role.STUDENT,
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
