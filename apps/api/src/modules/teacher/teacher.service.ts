import type { Prisma } from '@prisma/client';
import { CompletionStatus } from '@shared/types/progress';
import { Role } from '@shared/types/user';
import {
  AssignmentTargetType,
  RoomLifecycleStatus,
  type IClassroomEnrollment,
  type ITeacherRoomDefinition,
  type ITeacherRoomVersion,
} from '@shared/types/teacher';
import { prisma } from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import {
  averageScores,
  buildManifestFromCustomRoom,
  formatAssignment,
  formatAssignmentProgress,
  formatClassroom,
  formatRoomVersion,
  toLetterGrade,
  toPrismaDifficulty,
  validateRoomDefinition,
} from './teacher.utils';

type PrismaRole = NonNullable<Prisma.UserCreateInput['role']>;
type PrismaDifficulty = NonNullable<Prisma.TeacherRoomVersionCreateInput['difficulty']>;
type PrismaLifecycleStatus = NonNullable<Prisma.TeacherRoomVersionCreateInput['lifecycleStatus']>;
type PrismaAssignmentTargetType = NonNullable<Prisma.ClassroomAssignmentCreateInput['targetType']>;

const studentSelection = {
  id: true,
  username: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

const formatStudent = (student: {
  id: string;
  username: string;
  email: string;
  role: PrismaRole;
  createdAt: Date;
}) => ({
  id: student.id,
  username: student.username,
  email: student.email,
  role: student.role as Role,
  createdAt: student.createdAt.toISOString(),
});

const formatEnrollment = (entry: {
  id: string;
  classroomId: string;
  createdAt: Date;
  student: {
    id: string;
    username: string;
    email: string;
    role: PrismaRole;
    createdAt: Date;
  };
}): IClassroomEnrollment => ({
  id: entry.id,
  classroomId: entry.classroomId,
  createdAt: entry.createdAt.toISOString(),
  student: formatStudent(entry.student),
});

const requireTeacherId = (teacherId: string | undefined) => {
  if (!teacherId) {
    throw new AppError('UNAUTHORIZED', 'Teacher access is required.', 401);
  }

  return teacherId;
};

const ensureStudentIdsBelongToStudents = async (studentIds: string[]) => {
  if (!studentIds.length) {
    return;
  }

  const students = await prisma.user.findMany({
    where: {
      id: { in: studentIds },
      role: Role.STUDENT as PrismaRole,
    },
    select: { id: true },
  });

  if (students.length !== new Set(studentIds).size) {
    throw new AppError('BAD_REQUEST', 'One or more selected students are invalid.', 400);
  }
};

const getTeacherClassroomOrThrow = async (teacherId: string, classroomId: string) => {
  const classroom = await prisma.classroom.findFirst({
    where: {
      id: classroomId,
      teacherId,
    },
    select: {
      id: true,
      teacherId: true,
      name: true,
      description: true,
      isPrivate: true,
      requiresApproval: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          enrollments: true,
          assignments: true,
        },
      },
    },
  });

  if (!classroom) {
    throw new AppError('NOT_FOUND', 'Classroom not found.', 404);
  }

  return classroom;
};

export const teacherService = {
  async getStudents() {
    const students = await prisma.user.findMany({
      where: { role: Role.STUDENT as PrismaRole },
      select: {
        ...studentSelection,
        _count: {
          select: {
            classroomEntries: true,
            assignmentProgress: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return students.map((student) => ({
      ...formatStudent(student),
      classroomCount: student._count.classroomEntries,
      assignmentRoomCount: student._count.assignmentProgress,
    }));
  },

  async getStudentProgress(studentId: string) {
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        role: Role.STUDENT as PrismaRole,
      },
      select: {
        ...studentSelection,
      },
    });

    if (!student) {
      throw new AppError('NOT_FOUND', 'Student not found.', 404);
    }

    const [legacyProgress, assignmentProgress] = await Promise.all([
      prisma.playerProgress.findMany({
        where: { userId: studentId },
        include: {
          level: true,
          puzzle: true,
        },
        orderBy: { lastUpdated: 'desc' },
      }),
      prisma.studentAssignmentProgress.findMany({
        where: { studentId },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return {
      student: formatStudent(student),
      legacyProgress,
      assignmentProgress: assignmentProgress.map((entry) => formatAssignmentProgress(entry)),
    };
  },

  async getOverview(teacherIdInput: string | undefined) {
    const teacherId = requireTeacherId(teacherIdInput);
    const now = new Date();
    const dueSoonDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [classrooms, rooms, assignments, enrollments] = await Promise.all([
      prisma.classroom.count({
        where: { teacherId },
      }),
      prisma.teacherRoomVersion.count({
        where: {
          teacherId,
          isLatest: true,
          lifecycleStatus: RoomLifecycleStatus.PUBLISHED as PrismaLifecycleStatus,
        },
      }),
      prisma.classroomAssignment.count({
        where: {
          teacherId,
        },
      }),
      prisma.classroomEnrollment.findMany({
        where: {
          classroom: {
            teacherId,
          },
        },
        select: {
          studentId: true,
        },
      }),
    ]);

    const dueSoonCount = await prisma.classroomAssignment.count({
      where: {
        teacherId,
        dueAt: {
          gte: now,
          lte: dueSoonDate,
        },
      },
    });

    return {
      classroomCount: classrooms,
      publishedRoomCount: rooms,
      assignmentCount: assignments,
      dueSoonCount,
      enrolledStudentCount: new Set(enrollments.map((entry) => entry.studentId)).size,
    };
  },

  async getClassrooms(teacherIdInput: string | undefined) {
    const teacherId = requireTeacherId(teacherIdInput);
    const classrooms = await prisma.classroom.findMany({
      where: { teacherId },
      select: {
        id: true,
        teacherId: true,
        name: true,
        description: true,
        isPrivate: true,
        requiresApproval: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            enrollments: true,
            assignments: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return classrooms.map(formatClassroom);
  },

  async createClassroom(
    teacherIdInput: string | undefined,
    payload: {
      name: string;
      description: string;
      isPrivate: boolean;
      requiresApproval: boolean;
      studentIds?: string[];
    },
  ) {
    const teacherId = requireTeacherId(teacherIdInput);
    const studentIds = Array.from(new Set(payload.studentIds ?? []));

    await ensureStudentIdsBelongToStudents(studentIds);

    const classroom = await prisma.classroom.create({
      data: {
        teacherId,
        name: payload.name,
        description: payload.description,
        isPrivate: payload.isPrivate,
        requiresApproval: payload.requiresApproval,
        enrollments: studentIds.length
          ? {
              create: studentIds.map((studentId) => ({
                studentId,
              })),
            }
          : undefined,
      },
      select: {
        id: true,
        teacherId: true,
        name: true,
        description: true,
        isPrivate: true,
        requiresApproval: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            enrollments: true,
            assignments: true,
          },
        },
      },
    });

    return formatClassroom(classroom);
  },

  async getClassroomById(teacherIdInput: string | undefined, classroomId: string) {
    const teacherId = requireTeacherId(teacherIdInput);
    const classroom = await prisma.classroom.findFirst({
      where: {
        id: classroomId,
        teacherId,
      },
      select: {
        id: true,
        teacherId: true,
        name: true,
        description: true,
        isPrivate: true,
        requiresApproval: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            enrollments: true,
            assignments: true,
          },
        },
        enrollments: {
          select: {
            id: true,
            classroomId: true,
            createdAt: true,
            student: {
              select: studentSelection,
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        assignments: {
          orderBy: {
            startAt: 'asc',
          },
        },
      },
    });

    if (!classroom) {
      throw new AppError('NOT_FOUND', 'Classroom not found.', 404);
    }

    return {
      classroom: formatClassroom(classroom),
      enrollments: classroom.enrollments.map(formatEnrollment),
      assignments: classroom.assignments.map((assignment) => formatAssignment(assignment)),
    };
  },

  async enrollStudents(
    teacherIdInput: string | undefined,
    classroomId: string,
    studentIdsInput: string[],
  ) {
    const teacherId = requireTeacherId(teacherIdInput);
    await getTeacherClassroomOrThrow(teacherId, classroomId);

    const studentIds = Array.from(new Set(studentIdsInput));
    await ensureStudentIdsBelongToStudents(studentIds);

    if (!studentIds.length) {
      return [];
    }

    await Promise.all(
      studentIds.map((studentId) =>
        prisma.classroomEnrollment.upsert({
          where: {
            classroomId_studentId: {
              classroomId,
              studentId,
            },
          },
          update: {},
          create: {
            classroomId,
            studentId,
          },
        }),
      ),
    );

    const enrollments = await prisma.classroomEnrollment.findMany({
      where: {
        classroomId,
        studentId: {
          in: studentIds,
        },
      },
      select: {
        id: true,
        classroomId: true,
        createdAt: true,
        student: {
          select: studentSelection,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return enrollments.map(formatEnrollment);
  },

  async getRoomVersions(teacherIdInput: string | undefined) {
    const teacherId = requireTeacherId(teacherIdInput);
    const roomVersions = await prisma.teacherRoomVersion.findMany({
      where: {
        teacherId,
        isLatest: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return roomVersions.map((roomVersion) => formatRoomVersion(roomVersion));
  },

  async createRoomVersion(
    teacherIdInput: string | undefined,
    payload: {
      baseVersionId?: string;
      title: string;
      description: string;
      lessonTag: ITeacherRoomVersion['lessonTag'];
      objective: string;
      difficulty: ITeacherRoomVersion['difficulty'];
      parMoves: number;
      codeBudget: number;
      lifecycleStatus: RoomLifecycleStatus;
      definition: ITeacherRoomDefinition;
    },
  ) {
    const teacherId = requireTeacherId(teacherIdInput);
    validateRoomDefinition(payload.definition);

    let versionGroupId: string | undefined;
    let versionNumber: number | undefined;

    if (payload.baseVersionId) {
      const baseVersion = await prisma.teacherRoomVersion.findFirst({
        where: {
          id: payload.baseVersionId,
          teacherId,
        },
        select: {
          versionGroupId: true,
          versionNumber: true,
        },
      });

      if (!baseVersion) {
        throw new AppError('NOT_FOUND', 'Base room version not found.', 404);
      }

      const latestInGroup = await prisma.teacherRoomVersion.findFirst({
        where: {
          teacherId,
          versionGroupId: baseVersion.versionGroupId,
        },
        orderBy: {
          versionNumber: 'desc',
        },
        select: {
          versionNumber: true,
        },
      });

      versionGroupId = baseVersion.versionGroupId;
      versionNumber = (latestInGroup?.versionNumber ?? baseVersion.versionNumber) + 1;

      await prisma.teacherRoomVersion.updateMany({
        where: {
          teacherId,
          versionGroupId,
          isLatest: true,
        },
        data: {
          isLatest: false,
        },
      });
    }

    const roomVersion = await prisma.teacherRoomVersion.create({
      data: {
        teacherId,
        versionGroupId,
        versionNumber,
        title: payload.title,
        description: payload.description,
        lessonTag: payload.lessonTag,
        objective: payload.objective,
        difficulty: toPrismaDifficulty(payload.difficulty) as PrismaDifficulty,
        parMoves: payload.parMoves,
        codeBudget: payload.codeBudget,
        lifecycleStatus: payload.lifecycleStatus as PrismaLifecycleStatus,
        definition: payload.definition as unknown as Prisma.InputJsonObject,
        isLatest: true,
        publishedAt: payload.lifecycleStatus === RoomLifecycleStatus.PUBLISHED ? new Date() : null,
      },
    });

    return formatRoomVersion(roomVersion);
  },

  async createClassroomAssignment(
    teacherIdInput: string | undefined,
    classroomId: string,
    payload: {
      title: string;
      description?: string | null;
      targetType: AssignmentTargetType;
      startAt: string;
      dueAt?: string | null;
      officialWorldId?: string;
      officialPuzzleId?: string;
      customRoomVersionId?: string;
      roomManifest?: Array<{
        roomKey: string;
        title: string;
        objective: string;
        lesson: string;
        difficulty: ITeacherRoomVersion['difficulty'];
        parMoves: number;
        codeBudget: number;
        sourceType: 'OFFICIAL_PUZZLE' | 'CUSTOM_ROOM';
        worldId?: string;
        officialPuzzleId?: string;
        customRoomVersionId?: string;
      }>;
    },
  ) {
    const teacherId = requireTeacherId(teacherIdInput);
    await getTeacherClassroomOrThrow(teacherId, classroomId);

    const startAt = new Date(payload.startAt);
    const dueAt = payload.dueAt ? new Date(payload.dueAt) : null;

    if (Number.isNaN(startAt.getTime()) || (dueAt && Number.isNaN(dueAt.getTime()))) {
      throw new AppError('BAD_REQUEST', 'Assignment dates are invalid.', 400);
    }

    if (dueAt && dueAt < startAt) {
      throw new AppError('BAD_REQUEST', 'Due date must be after the start date.', 400);
    }

    let roomManifest = payload.roomManifest ?? [];
    let customRoomVersionId: string | undefined;

    if (payload.targetType === AssignmentTargetType.CUSTOM_ROOM) {
      if (!payload.customRoomVersionId) {
        throw new AppError('BAD_REQUEST', 'A custom room version is required.', 400);
      }

      const roomVersion = await prisma.teacherRoomVersion.findFirst({
        where: {
          id: payload.customRoomVersionId,
          teacherId,
          lifecycleStatus: RoomLifecycleStatus.PUBLISHED as PrismaLifecycleStatus,
        },
      });

      if (!roomVersion) {
        throw new AppError('NOT_FOUND', 'Published custom room version not found.', 404);
      }

      const formattedRoomVersion = formatRoomVersion(roomVersion);
      roomManifest = [buildManifestFromCustomRoom(formattedRoomVersion)];
      customRoomVersionId = roomVersion.id;
    }

    if (payload.targetType === AssignmentTargetType.OFFICIAL_WORLD) {
      if (!payload.officialWorldId || !roomManifest.length) {
        throw new AppError('BAD_REQUEST', 'Official world assignments need a world id and room list.', 400);
      }
    }

    if (payload.targetType === AssignmentTargetType.OFFICIAL_PUZZLE) {
      if (!payload.officialPuzzleId || roomManifest.length !== 1) {
        throw new AppError('BAD_REQUEST', 'Official room assignments must contain exactly one room.', 400);
      }
    }

    const assignment = await prisma.classroomAssignment.create({
      data: {
        classroomId,
        teacherId,
        targetType: payload.targetType as PrismaAssignmentTargetType,
        title: payload.title,
        description: payload.description ?? null,
        startAt,
        dueAt,
        officialWorldId: payload.officialWorldId ?? null,
        officialPuzzleId: payload.officialPuzzleId ?? null,
        customRoomVersionId: customRoomVersionId ?? null,
        roomManifest,
      },
    });

    return formatAssignment(assignment);
  },

  async getClassroomDashboard(teacherIdInput: string | undefined, classroomId: string) {
    const teacherId = requireTeacherId(teacherIdInput);
    const classroom = await getTeacherClassroomOrThrow(teacherId, classroomId);

    const [enrollments, assignments, progressEntries] = await Promise.all([
      prisma.classroomEnrollment.findMany({
        where: { classroomId },
        select: {
          id: true,
          classroomId: true,
          createdAt: true,
          student: {
            select: studentSelection,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      prisma.classroomAssignment.findMany({
        where: { classroomId, teacherId },
        orderBy: {
          startAt: 'asc',
        },
      }),
      prisma.studentAssignmentProgress.findMany({
        where: { classroomId },
        orderBy: {
          updatedAt: 'desc',
        },
      }),
    ]);

    const totalAssignedRooms = assignments.reduce((total, assignment) => {
      const manifest = formatAssignment(assignment).roomManifest;
      return total + manifest.length;
    }, 0);

    const roster = enrollments.map((enrollment) => {
      const roomProgress = progressEntries
        .filter((entry) => entry.studentId === enrollment.student.id)
        .map(formatAssignmentProgress);
      const scoreValues = roomProgress
        .map((entry) => entry.bestScore)
        .filter((score): score is number => typeof score === 'number');
      const averageScore = averageScores(scoreValues);
      const lastPlayedAt = roomProgress.reduce<string | null>(
        (latest, entry) => {
          if (!entry.lastPlayedAt) {
            return latest;
          }

          if (!latest || entry.lastPlayedAt > latest) {
            return entry.lastPlayedAt;
          }

          return latest;
        },
        null,
      );

      return {
        student: formatStudent(enrollment.student),
        assignedRooms: totalAssignedRooms,
        solvedRooms: roomProgress.filter((entry) => entry.status === CompletionStatus.COMPLETED).length,
        totalAttempts: roomProgress.reduce((total, entry) => total + entry.attempts, 0),
        totalFailures: roomProgress.reduce((total, entry) => total + entry.failures, 0),
        averageScore,
        letterGrade: toLetterGrade(averageScore),
        lastPlayedAt,
        achievements: {
          roomsCleared: roomProgress.filter((entry) => entry.status === CompletionStatus.COMPLETED).length,
          highScores: roomProgress.filter((entry) => (entry.bestScore ?? 0) >= 90).length,
          comebackClears: roomProgress.filter((entry) => entry.failures > 0 && entry.status === CompletionStatus.COMPLETED)
            .length,
        },
        roomProgress,
      };
    });

    return {
      classroom: formatClassroom(classroom),
      enrollments: enrollments.map(formatEnrollment),
      assignments: assignments.map((assignment) => formatAssignment(assignment)),
      summary: {
        studentCount: enrollments.length,
        assignmentCount: assignments.length,
        roomCount: totalAssignedRooms,
      },
      roster,
    };
  },
};
