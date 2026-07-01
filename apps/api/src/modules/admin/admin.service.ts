import type { Prisma } from '@prisma/client';
import { CompletionStatus } from '@shared/types/progress';
import { Role } from '@shared/types/user';
import type {
  AdminReportType,
  Difficulty,
  IAdminAnnouncement,
  IAdminLevelListItem,
  IAdminPlayerListItem,
  IAdminPlayerProgressResponse,
  IAdminReport,
  IAdminUserListItem,
  PuzzleType,
} from '@shared/types';
import { prisma } from '@/config/database';
import { hashValue } from '@/lib/hash';
import { createPaginatedResult, normalizePagination } from '@/lib/pagination';
import { AppError } from '@/middleware/errorHandler';
import { levelsService } from '@/modules/levels/levels.service';

type PrismaRole = NonNullable<Prisma.UserCreateInput['role']>;
type ReportType = NonNullable<Prisma.AdminReportCreateInput['reportType']>;
type PrismaDifficulty = NonNullable<Prisma.LevelCreateInput['difficulty']>;
type PaginationQuery = { page?: number; pageSize?: number };
type SearchablePaginationQuery = PaginationQuery & { search?: string };
type LevelQuery = SearchablePaginationQuery & { difficulty?: Difficulty };
type ReportQuery = SearchablePaginationQuery & { reportType?: AdminReportType };
type UserQuery = SearchablePaginationQuery & { role?: Role };

const formatUserRole = (role: PrismaRole) => role as Role;

const formatLevel = (level: {
  id: string;
  name: string;
  description: string;
  difficulty: PrismaDifficulty;
  order: number;
  createdAt: Date;
}) => ({
  id: level.id,
  name: level.name,
  description: level.description,
  difficulty: level.difficulty as Difficulty,
  order: level.order,
  createdAt: level.createdAt.toISOString(),
});

const formatAdminAnnouncement = (announcement: {
  id: string;
  adminId: string;
  title: string;
  message: string;
  dateCreated: Date;
  admin: {
    id: string;
    username: string;
    email: string;
  };
}): IAdminAnnouncement => ({
  id: announcement.id,
  adminId: announcement.adminId,
  title: announcement.title,
  message: announcement.message,
  dateCreated: announcement.dateCreated.toISOString(),
  admin: announcement.admin,
});

const formatAdminReport = (report: {
  id: string;
  adminId: string;
  reportType: ReportType;
  description: string;
  generatedAt: Date;
  admin: {
    id: string;
    username: string;
    email: string;
  };
}): IAdminReport => ({
  id: report.id,
  adminId: report.adminId,
  reportType: report.reportType as AdminReportType,
  description: report.description,
  generatedAt: report.generatedAt.toISOString(),
  admin: report.admin,
});

export const adminService = {
  async getOverview() {
    const [
      userCount,
      studentCount,
      teacherCount,
      adminCount,
      levelCount,
      classroomCount,
      assignmentCount,
      announcementCount,
      reportCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.STUDENT as PrismaRole } }),
      prisma.user.count({ where: { role: Role.TEACHER as PrismaRole } }),
      prisma.user.count({ where: { role: Role.ADMIN as PrismaRole } }),
      prisma.level.count(),
      prisma.classroom.count({ where: { deletedAt: null } }),
      prisma.classroomAssignment.count({ where: { deletedAt: null } }),
      prisma.announcement.count(),
      prisma.adminReport.count(),
    ]);

    return {
      userCount,
      studentCount,
      teacherCount,
      adminCount,
      levelCount,
      classroomCount,
      assignmentCount,
      announcementCount,
      reportCount,
    };
  },

  async getUsers(query?: UserQuery) {
    const pagination = normalizePagination(query, { defaultPageSize: 12 });
    const search = query?.search?.trim();
    const where: Prisma.UserWhereInput = {
      ...(query?.role ? { role: query.role as PrismaRole } : {}),
      ...(search
        ? {
            OR: [
              { username: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
    };

    const [totalItems, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              progressEntries: true,
              achievements: true,
              teacherAssignments: true,
              customRoomVersions: true,
              announcements: true,
              adminReports: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
    ]);

    const userIds = users.map((user) => user.id);

    const [activeEnrollments, activeTaughtClassrooms, totalAdminUsers] = userIds.length
      ? await Promise.all([
          prisma.classroomEnrollment.findMany({
            where: {
              studentId: { in: userIds },
              deletedAt: null,
            },
            select: { studentId: true },
          }),
          prisma.classroom.findMany({
            where: {
              teacherId: { in: userIds },
              deletedAt: null,
            },
            select: { teacherId: true },
          }),
          prisma.user.count({
            where: { role: Role.ADMIN as PrismaRole },
          }),
        ])
      : [[], [], 0];

    const enrolledClassroomCountByUser = new Map<string, number>();
    activeEnrollments.forEach((entry) => {
      enrolledClassroomCountByUser.set(
        entry.studentId,
        (enrolledClassroomCountByUser.get(entry.studentId) ?? 0) + 1,
      );
    });

    const taughtClassroomCountByUser = new Map<string, number>();
    activeTaughtClassrooms.forEach((entry) => {
      taughtClassroomCountByUser.set(
        entry.teacherId,
        (taughtClassroomCountByUser.get(entry.teacherId) ?? 0) + 1,
      );
    });

    const items: IAdminUserListItem[] = users.map((user) => {
      const canDelete =
        user.role === (Role.STUDENT as PrismaRole)
          ? true
          : user.role === (Role.TEACHER as PrismaRole)
            ? (taughtClassroomCountByUser.get(user.id) ?? 0) === 0 &&
              user._count.teacherAssignments === 0 &&
              user._count.customRoomVersions === 0
            : totalAdminUsers > 1 && user._count.announcements === 0 && user._count.adminReports === 0;

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: formatUserRole(user.role),
        createdAt: user.createdAt.toISOString(),
        studentProgressCount: user._count.progressEntries,
        achievementCount: user._count.achievements,
        enrolledClassroomCount: enrolledClassroomCountByUser.get(user.id) ?? 0,
        taughtClassroomCount: taughtClassroomCountByUser.get(user.id) ?? 0,
        assignmentCount: user._count.teacherAssignments,
        customRoomCount: user._count.customRoomVersions,
        announcementCount: user._count.announcements,
        reportCount: user._count.adminReports,
        canDelete,
      };
    });

    return createPaginatedResult(items, totalItems, pagination.page, pagination.pageSize);
  },

  async createUser(payload: {
    username: string;
    email: string;
    password: string;
    role: Role;
  }) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: payload.email }, { username: payload.username }],
      },
      select: { id: true },
    });

    if (existingUser) {
      throw new AppError('CONFLICT', 'A user with that email or username already exists.', 409);
    }

    const passwordHash = await hashValue(payload.password);
    const user = await prisma.user.create({
      data: {
        username: payload.username,
        email: payload.email,
        passwordHash,
        role: payload.role as PrismaRole,
        settings: {
          create: {},
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: formatUserRole(user.role),
      createdAt: user.createdAt.toISOString(),
      studentProgressCount: 0,
      achievementCount: 0,
      enrolledClassroomCount: 0,
      taughtClassroomCount: 0,
      assignmentCount: 0,
      customRoomCount: 0,
      announcementCount: 0,
      reportCount: 0,
      canDelete: true,
    } satisfies IAdminUserListItem;
  },

  async updateUser(
    id: string,
    payload: { username: string; email: string; password?: string; role: Role },
  ) {
    const existing = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    if (!existing) {
      throw new AppError('NOT_FOUND', 'User not found.', 404);
    }

    if (payload.email !== existing.email || payload.username !== existing.username) {
      const conflictingUser = await prisma.user.findFirst({
        where: {
          id: { not: id },
          OR: [{ email: payload.email }, { username: payload.username }],
        },
        select: { id: true },
      });

      if (conflictingUser) {
        throw new AppError('CONFLICT', 'A user with that email or username already exists.', 409);
      }
    }

    const passwordHash = payload.password ? await hashValue(payload.password) : undefined;
    const user = await prisma.user.update({
      where: { id },
      data: {
        username: payload.username,
        email: payload.email,
        role: payload.role as PrismaRole,
        ...(passwordHash ? { passwordHash } : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: formatUserRole(user.role),
      createdAt: user.createdAt.toISOString(),
    };
  },

  async deleteUser(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        role: true,
        _count: {
          select: {
            progressEntries: true,
            achievements: true,
            taughtClassrooms: true,
            teacherAssignments: true,
            customRoomVersions: true,
            announcements: true,
            adminReports: true,
            adminLogs: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found.', 404);
    }

    if (user.role === (Role.TEACHER as PrismaRole)) {
      if (
        user._count.taughtClassrooms > 0 ||
        user._count.teacherAssignments > 0 ||
        user._count.customRoomVersions > 0
      ) {
        throw new AppError(
          'CONFLICT',
          'This teacher still owns classrooms or authored content and cannot be deleted yet.',
          409,
        );
      }
    }

    if (user.role === (Role.ADMIN as PrismaRole)) {
      const totalAdmins = await prisma.user.count({
        where: { role: Role.ADMIN as PrismaRole },
      });

      if (totalAdmins <= 1) {
        throw new AppError('CONFLICT', 'The last admin account cannot be deleted.', 409);
      }

      if (user._count.announcements > 0 || user._count.adminReports > 0 || user._count.adminLogs > 0) {
        throw new AppError(
          'CONFLICT',
          'This admin already has system records and cannot be deleted yet.',
          409,
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      if (user.role === (Role.STUDENT as PrismaRole)) {
        await tx.studentAssignmentProgress.deleteMany({
          where: { studentId: id },
        });
        await tx.classroomEnrollment.deleteMany({
          where: { studentId: id },
        });
        await tx.playerProgress.deleteMany({
          where: { userId: id },
        });
        await tx.achievement.deleteMany({
          where: { userId: id },
        });
      }

      await tx.playerSettings.deleteMany({
        where: { userId: id },
      });

      await tx.user.delete({
        where: { id },
      });
    });

    return {
      deleted: true,
      id: user.id,
      username: user.username,
    };
  },

  async getPlayers(query?: SearchablePaginationQuery) {
    const pagination = normalizePagination(query, { defaultPageSize: 12 });
    const search = query?.search?.trim();
    const where: Prisma.UserWhereInput = {
      role: Role.STUDENT as PrismaRole,
      ...(search
        ? {
            OR: [
              { username: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
    };

    const [totalItems, players] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              progressEntries: true,
              achievements: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
    ]);

    const playerIds = players.map((player) => player.id);

    const [completedRows, activeEnrollments, activityRows] = playerIds.length
      ? await Promise.all([
          prisma.playerProgress.findMany({
            where: {
              userId: { in: playerIds },
              status: CompletionStatus.COMPLETED,
            },
            select: { userId: true },
          }),
          prisma.classroomEnrollment.findMany({
            where: {
              studentId: { in: playerIds },
              deletedAt: null,
            },
            select: { studentId: true },
          }),
          prisma.playerProgress.findMany({
            where: { userId: { in: playerIds } },
            orderBy: { lastUpdated: 'desc' },
            select: {
              userId: true,
              lastUpdated: true,
            },
          }),
        ])
      : [[], [], []];

    const completedCountByUser = new Map<string, number>();
    completedRows.forEach((row) => {
      completedCountByUser.set(row.userId, (completedCountByUser.get(row.userId) ?? 0) + 1);
    });

    const classroomCountByUser = new Map<string, number>();
    activeEnrollments.forEach((enrollment) => {
      classroomCountByUser.set(
        enrollment.studentId,
        (classroomCountByUser.get(enrollment.studentId) ?? 0) + 1,
      );
    });

    const lastActiveAtByUser = new Map<string, string>();
    activityRows.forEach((row) => {
      if (!lastActiveAtByUser.has(row.userId)) {
        lastActiveAtByUser.set(row.userId, row.lastUpdated.toISOString());
      }
    });

    const items: IAdminPlayerListItem[] = players.map((player) => ({
      id: player.id,
      username: player.username,
      email: player.email,
      role: formatUserRole(player.role),
      createdAt: player.createdAt.toISOString(),
      progressCount: player._count.progressEntries,
      completedProgressCount: completedCountByUser.get(player.id) ?? 0,
      achievementCount: player._count.achievements,
      classroomCount: classroomCountByUser.get(player.id) ?? 0,
      lastActiveAt: lastActiveAtByUser.get(player.id) ?? null,
    }));

    return createPaginatedResult(items, totalItems, pagination.page, pagination.pageSize);
  },

  async getPlayerProgress(userId: string, query?: PaginationQuery): Promise<IAdminPlayerProgressResponse> {
    const pagination = normalizePagination(query, { defaultPageSize: 10 });
    const player = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            progressEntries: true,
            achievements: true,
          },
        },
      },
    });

    if (!player || player.role !== (Role.STUDENT as PrismaRole)) {
      throw new AppError('NOT_FOUND', 'Student not found.', 404);
    }

    const [
      totalItems,
      progressEntries,
      aggregate,
      completedProgressCount,
      activeEnrollmentCount,
      achievements,
      latestProgressEntry,
    ] = await Promise.all([
      prisma.playerProgress.count({ where: { userId } }),
      prisma.playerProgress.findMany({
        where: { userId },
        include: {
          level: true,
          puzzle: true,
        },
        orderBy: { lastUpdated: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.playerProgress.aggregate({
        where: { userId },
        _sum: {
          attempts: true,
          timeSpent: true,
        },
      }),
      prisma.playerProgress.count({
        where: {
          userId,
          status: CompletionStatus.COMPLETED,
        },
      }),
      prisma.classroomEnrollment.count({
        where: {
          studentId: userId,
          deletedAt: null,
        },
      }),
      prisma.achievement.findMany({
        where: { userId },
        orderBy: { dateUnlocked: 'desc' },
      }),
      prisma.playerProgress.findFirst({
        where: { userId },
        orderBy: { lastUpdated: 'desc' },
        select: { lastUpdated: true },
      }),
    ]);

    return {
      player: {
        id: player.id,
        username: player.username,
        email: player.email,
        role: formatUserRole(player.role),
        createdAt: player.createdAt.toISOString(),
        progressCount: player._count.progressEntries,
        completedProgressCount,
        achievementCount: player._count.achievements,
        classroomCount: activeEnrollmentCount,
        lastActiveAt: latestProgressEntry?.lastUpdated.toISOString() ?? null,
        totalAttempts: aggregate._sum.attempts ?? 0,
        totalTimeSpent: aggregate._sum.timeSpent ?? 0,
      },
      progress: createPaginatedResult(
        progressEntries.map((entry) => ({
          id: entry.id,
          userId: entry.userId,
          levelId: entry.levelId,
          puzzleId: entry.puzzleId,
          status: entry.status as CompletionStatus,
          attempts: entry.attempts,
          timeSpent: entry.timeSpent,
          lastUpdated: entry.lastUpdated.toISOString(),
          level: formatLevel(entry.level),
          puzzle: {
            id: entry.puzzle.id,
            levelId: entry.puzzle.levelId,
            description: entry.puzzle.description,
            expectedOutput: entry.puzzle.expectedOutput,
            hint: entry.puzzle.hint,
            type: entry.puzzle.type as PuzzleType,
            order: entry.puzzle.order,
          },
        })),
        totalItems,
        pagination.page,
        pagination.pageSize,
      ),
      achievements: achievements.map((achievement) => ({
        id: achievement.id,
        userId: achievement.userId,
        name: achievement.name,
        description: achievement.description,
        dateUnlocked: achievement.dateUnlocked.toISOString(),
      })),
    };
  },

  async getLevels(query?: LevelQuery) {
    const pagination = normalizePagination(query, { defaultPageSize: 10 });
    const search = query?.search?.trim();
    const where: Prisma.LevelWhereInput = {
      ...(query?.difficulty ? { difficulty: query.difficulty as PrismaDifficulty } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
    };
    const [totalItems, levels] = await Promise.all([
      prisma.level.count({ where }),
      prisma.level.findMany({
        where,
        orderBy: { order: 'asc' },
        skip: pagination.skip,
        take: pagination.take,
        select: {
          id: true,
          name: true,
          description: true,
          difficulty: true,
          order: true,
          createdAt: true,
          _count: {
            select: {
              puzzles: true,
              progress: true,
            },
          },
        },
      }),
    ]);

    const items: IAdminLevelListItem[] = levels.map((level) => ({
      ...formatLevel(level),
      puzzleCount: level._count.puzzles,
      playerProgressCount: level._count.progress,
    }));

    return createPaginatedResult(items, totalItems, pagination.page, pagination.pageSize);
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

  async getAnnouncements(query?: SearchablePaginationQuery) {
    const pagination = normalizePagination(query, { defaultPageSize: 8 });
    const search = query?.search?.trim();
    const where: Prisma.AnnouncementWhereInput = search
      ? {
          OR: [
            { title: { contains: search } },
            { message: { contains: search } },
          ],
        }
      : {};
    const [totalItems, announcements] = await Promise.all([
      prisma.announcement.count({ where }),
      prisma.announcement.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: { dateCreated: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
    ]);

    return createPaginatedResult(
      announcements.map(formatAdminAnnouncement),
      totalItems,
      pagination.page,
      pagination.pageSize,
    );
  },

  async createAnnouncement(adminId: string, payload: { title: string; message: string }) {
    const announcement = await prisma.announcement.create({
      data: {
        adminId,
        title: payload.title,
        message: payload.message,
      },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return formatAdminAnnouncement(announcement);
  },

  async updateAnnouncement(id: string, payload: { title: string; message: string }) {
    const existing = await prisma.announcement.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new AppError('NOT_FOUND', 'Announcement not found.', 404);
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        title: payload.title,
        message: payload.message,
      },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return formatAdminAnnouncement(announcement);
  },

  async deleteAnnouncement(id: string) {
    const existing = await prisma.announcement.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
      },
    });

    if (!existing) {
      throw new AppError('NOT_FOUND', 'Announcement not found.', 404);
    }

    await prisma.announcement.delete({
      where: { id },
    });

    return {
      deleted: true,
      id: existing.id,
      title: existing.title,
    };
  },

  async getReports(query?: ReportQuery) {
    const pagination = normalizePagination(query, { defaultPageSize: 8 });
    const search = query?.search?.trim();
    const where: Prisma.AdminReportWhereInput = {
      ...(query?.reportType ? { reportType: query.reportType as ReportType } : {}),
      ...(search
        ? {
            description: { contains: search },
          }
        : {}),
    };

    const [totalItems, reports] = await Promise.all([
      prisma.adminReport.count({ where }),
      prisma.adminReport.findMany({
        where,
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
        skip: pagination.skip,
        take: pagination.take,
      }),
    ]);

    return createPaginatedResult(
      reports.map(formatAdminReport),
      totalItems,
      pagination.page,
      pagination.pageSize,
    );
  },

  async generateReport(adminId: string, payload: { reportType: ReportType; description: string }) {
    const report = await prisma.adminReport.create({
      data: {
        adminId,
        reportType: payload.reportType as ReportType,
        description: payload.description,
      },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return formatAdminReport(report);
  },
};
