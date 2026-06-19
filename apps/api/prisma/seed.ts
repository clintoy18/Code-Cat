import bcrypt from 'bcryptjs';
import type { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { Difficulty } from '@shared/types/level';
import { PuzzleType } from '@shared/types/puzzle';
import { Role } from '@shared/types/user';

const prisma = new PrismaClient();

type PrismaRole = NonNullable<Prisma.UserCreateInput['role']>;
type PrismaDifficulty = NonNullable<Prisma.LevelCreateInput['difficulty']>;
type PrismaPuzzleType = NonNullable<Prisma.PuzzleCreateWithoutLevelInput['type']>;

const seed = async () => {
  const adminPasswordHash = await bcrypt.hash('admin12345', 12);
  const teacherPasswordHash = await bcrypt.hash('teacher12345', 12);
  const studentPasswordHash = await bcrypt.hash('student12345', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@codecat.dev' },
    update: {},
    create: {
      username: 'codecat-admin',
      email: 'admin@codecat.dev',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN as PrismaRole,
      settings: {
        create: {},
      },
    },
  });

  await prisma.user.upsert({
    where: { email: 'teacher@codecat.dev' },
    update: {},
    create: {
      username: 'codecat-teacher',
      email: 'teacher@codecat.dev',
      passwordHash: teacherPasswordHash,
      role: Role.TEACHER as PrismaRole,
      settings: {
        create: {},
      },
    },
  });

  await prisma.user.upsert({
    where: { email: 'student@codecat.dev' },
    update: {},
    create: {
      username: 'codecat-student',
      email: 'student@codecat.dev',
      passwordHash: studentPasswordHash,
      role: Role.STUDENT as PrismaRole,
      settings: {
        create: {},
      },
    },
  });

  await prisma.level.upsert({
    where: { order: 1 },
    update: {},
    create: {
      name: 'Cat Steps',
      description: 'Learn sequencing by arranging steps for the cat.',
      difficulty: Difficulty.EASY as PrismaDifficulty,
      order: 1,
      puzzles: {
        create: [
          {
            description: 'Move the cat to the fish bowl in three steps.',
            expectedOutput: 'CAT_REACHES_FISH',
            hint: 'Start with forward movement.',
            type: PuzzleType.SEQUENCING as PrismaPuzzleType,
            order: 1,
          },
          {
            description: 'Collect two stars before the finish tile.',
            expectedOutput: 'CAT_COLLECTS_STARS',
            hint: 'Think in order from left to right.',
            type: PuzzleType.SEQUENCING as PrismaPuzzleType,
            order: 2,
          },
        ],
      },
    },
  });

  await prisma.adminLog.create({
    data: {
      adminId: admin.id,
      action: 'SEED_DATABASE',
      details: 'Initial admin, teacher, student, and starter level created.',
    },
  });
};

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
