import type { Prisma } from '@prisma/client';
import type { CompletionStatus } from '@shared/types/progress';
import { prisma } from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { calculateRoomScore, formatAssignment, formatAssignmentProgress, formatClassroom, formatRoomVersion } from '@/modules/teacher/teacher.utils';

type PrismaCompletionStatus = NonNullable<Prisma.PlayerProgressCreateInput['status']>;

export const progressService = {
  async saveProgress(
    userId: string,
    payload: {
      levelId: string;
      puzzleId: string;
      status: CompletionStatus;
      attempts: number;
      timeSpent: number;
    },
  ) {
    return prisma.playerProgress.upsert({
      where: {
        userId_levelId_puzzleId: {
          userId,
          levelId: payload.levelId,
          puzzleId: payload.puzzleId,
        },
      },
      update: {
        status: payload.status as PrismaCompletionStatus,
        attempts: payload.attempts,
        timeSpent: payload.timeSpent,
      },
      create: {
        userId,
        levelId: payload.levelId,
        puzzleId: payload.puzzleId,
        status: payload.status as PrismaCompletionStatus,
        attempts: payload.attempts,
        timeSpent: payload.timeSpent,
      },
    });
  },

  async saveAssignmentRoomProgress(
    userId: string,
    payload: {
      assignmentId: string;
      roomKey: string;
      status: CompletionStatus;
      movesUsed: number;
      blocksUsed: number;
      timeSpent: number;
    },
  ) {
    const assignment = await prisma.classroomAssignment.findFirst({
      where: {
        id: payload.assignmentId,
        classroom: {
          enrollments: {
            some: {
              studentId: userId,
            },
          },
        },
      },
      include: {
        classroom: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new AppError('NOT_FOUND', 'Assignment not found.', 404);
    }

    const manifestEntry = formatAssignment(assignment).roomManifest.find((entry) => entry.roomKey === payload.roomKey);

    if (!manifestEntry) {
      throw new AppError('BAD_REQUEST', 'Assigned room does not belong to this assignment.', 400);
    }

    const previous = await prisma.studentAssignmentProgress.findUnique({
      where: {
        assignmentId_studentId_roomKey: {
          assignmentId: assignment.id,
          studentId: userId,
          roomKey: payload.roomKey,
        },
      },
    });

    const didComplete = payload.status === 'COMPLETED';
    const scoreResult = calculateRoomScore({
      didComplete,
      movesUsed: payload.movesUsed,
      parMoves: manifestEntry.parMoves,
      blocksUsed: payload.blocksUsed,
      codeBudget: manifestEntry.codeBudget,
      failuresBeforeSuccess: previous?.failures ?? 0,
    });
    const nextAttempts = (previous?.attempts ?? 0) + 1;
    const nextFailures = (previous?.failures ?? 0) + (didComplete ? 0 : 1);
    const now = new Date();
    const nextStatus =
      didComplete || previous?.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS';
    const nextBestScore =
      didComplete
        ? Math.max(previous?.bestScore ?? 0, scoreResult.score)
        : previous?.bestScore ?? null;
    const nextBestMoves =
      didComplete
        ? Math.min(previous?.bestMovesUsed ?? payload.movesUsed, payload.movesUsed)
        : previous?.bestMovesUsed ?? null;
    const nextBestBlocks =
      didComplete
        ? Math.min(previous?.bestBlocksUsed ?? payload.blocksUsed, payload.blocksUsed)
        : previous?.bestBlocksUsed ?? null;

    const progress = previous
      ? await prisma.studentAssignmentProgress.update({
          where: {
            id: previous.id,
          },
          data: {
            status: nextStatus as PrismaCompletionStatus,
            attempts: nextAttempts,
            failures: nextFailures,
            totalTimeSpent: previous.totalTimeSpent + payload.timeSpent,
            latestMovesUsed: payload.movesUsed,
            bestMovesUsed: nextBestMoves,
            latestBlocksUsed: payload.blocksUsed,
            bestBlocksUsed: nextBestBlocks,
            latestScore: didComplete ? scoreResult.score : 0,
            bestScore: nextBestScore,
            latestLetterGrade: didComplete ? scoreResult.letterGrade : 'F',
            bestLetterGrade: nextBestScore === null ? null : scoreResult.score >= (previous.bestScore ?? 0)
              ? scoreResult.letterGrade
              : previous.bestLetterGrade,
            lastPlayedAt: now,
            solvedAt: didComplete ? previous.solvedAt ?? now : previous.solvedAt,
          },
        })
      : await prisma.studentAssignmentProgress.create({
          data: {
            assignmentId: assignment.id,
            classroomId: assignment.classroomId,
            studentId: userId,
            roomKey: manifestEntry.roomKey,
            roomTitle: manifestEntry.title,
            roomSource: manifestEntry.sourceType,
            status: nextStatus as PrismaCompletionStatus,
            attempts: nextAttempts,
            failures: nextFailures,
            totalTimeSpent: payload.timeSpent,
            latestMovesUsed: payload.movesUsed,
            bestMovesUsed: didComplete ? payload.movesUsed : null,
            latestBlocksUsed: payload.blocksUsed,
            bestBlocksUsed: didComplete ? payload.blocksUsed : null,
            latestScore: didComplete ? scoreResult.score : 0,
            bestScore: didComplete ? scoreResult.score : null,
            latestLetterGrade: didComplete ? scoreResult.letterGrade : 'F',
            bestLetterGrade: didComplete ? scoreResult.letterGrade : null,
            lastPlayedAt: now,
            solvedAt: didComplete ? now : null,
          },
        });

    return formatAssignmentProgress(progress);
  },

  async getMyProgress(userId: string) {
    return prisma.playerProgress.findMany({
      where: { userId },
      orderBy: { lastUpdated: 'desc' },
    });
  },

  async getMyAssignments(userId: string) {
    const enrollments = await prisma.classroomEnrollment.findMany({
      where: {
        studentId: userId,
      },
      include: {
        classroom: {
          select: {
            id: true,
            teacherId: true,
            name: true,
            description: true,
            isPrivate: true,
            requiresApproval: true,
            createdAt: true,
            updatedAt: true,
            assignments: {
              orderBy: {
                startAt: 'asc',
              },
              include: {
                progressEntries: {
                  where: {
                    studentId: userId,
                  },
                },
                customRoomVersion: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return enrollments.map((enrollment) => ({
      classroom: formatClassroom(enrollment.classroom),
      enrolledAt: enrollment.createdAt.toISOString(),
      assignments: enrollment.classroom.assignments.map((assignment) => ({
        assignment: formatAssignment(assignment),
        progress: assignment.progressEntries.map(formatAssignmentProgress),
        customRoom:
          assignment.customRoomVersion ? formatRoomVersion(assignment.customRoomVersion) : null,
      })),
    }));
  },

  async getMyAssignmentById(userId: string, assignmentId: string) {
    const assignment = await prisma.classroomAssignment.findFirst({
      where: {
        id: assignmentId,
        classroom: {
          enrollments: {
            some: {
              studentId: userId,
            },
          },
        },
      },
      include: {
        classroom: {
          select: {
            id: true,
            teacherId: true,
            name: true,
            description: true,
            isPrivate: true,
            requiresApproval: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        progressEntries: {
          where: {
            studentId: userId,
          },
        },
        customRoomVersion: true,
      },
    });

    if (!assignment) {
      throw new AppError('NOT_FOUND', 'Assignment not found.', 404);
    }

    return {
      classroom: formatClassroom(assignment.classroom),
      assignment: formatAssignment(assignment),
      progress: assignment.progressEntries.map(formatAssignmentProgress),
      customRoom: assignment.customRoomVersion ? formatRoomVersion(assignment.customRoomVersion) : null,
    };
  },

  async getMyLevelProgress(userId: string, levelId: string) {
    const entries = await prisma.playerProgress.findMany({
      where: { userId, levelId },
      orderBy: { lastUpdated: 'desc' },
    });

    if (!entries.length) {
      throw new AppError('NOT_FOUND', 'No progress found for this level.', 404);
    }

    return entries;
  },
};
