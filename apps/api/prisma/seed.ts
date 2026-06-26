import bcrypt from 'bcryptjs';
import type { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { Difficulty } from '@shared/types/level';
import { CompletionStatus } from '@shared/types/progress';
import { PuzzleType } from '@shared/types/puzzle';
import {
  AssignmentTargetType,
  RoomLifecycleStatus,
  type IRoomManifestItem,
  type ITeacherRoomDefinition,
  type ITeacherRoomVersion,
} from '@shared/types/teacher';
import { Role } from '@shared/types/user';
import {
  buildManifestFromCustomRoom,
  formatRoomVersion,
} from '../src/modules/teacher/teacher.utils';

const prisma = new PrismaClient();

type PrismaRole = NonNullable<Prisma.UserCreateInput['role']>;
type PrismaDifficulty = NonNullable<Prisma.LevelCreateInput['difficulty']>;
type PrismaPuzzleType = NonNullable<Prisma.PuzzleCreateWithoutLevelInput['type']>;
type PrismaRoomDifficulty = NonNullable<
  Prisma.TeacherRoomVersionCreateInput['difficulty']
>;
type PrismaLifecycleStatus = NonNullable<
  Prisma.TeacherRoomVersionCreateInput['lifecycleStatus']
>;
type PrismaAssignmentTargetType = NonNullable<
  Prisma.ClassroomAssignmentCreateInput['targetType']
>;
type SeedUser = {
  username: string;
  email: string;
  role: Role;
  password: string;
};

const DEMO_TEACHER_COUNT = 10;
const DEMO_STUDENT_COUNT = 10;
const DEMO_CLASSROOM_COUNT = 10;
const DEMO_LEVEL_COUNT = 3;
const PRIMARY_TEACHER_EMAIL = 'elena.cruz@codecat.dev';

const now = new Date();
const daysFromNow = (days: number) =>
  new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
const offsetSeed = (index: number) => (index % 4) - 2;

const moveUp = { key: 'move-up', label: 'moveUp()', kind: 'MOVE', move: 'UP' } as const;
const moveRight = {
  key: 'move-right',
  label: 'moveRight()',
  kind: 'MOVE',
  move: 'RIGHT',
} as const;
const moveDown = {
  key: 'move-down',
  label: 'moveDown()',
  kind: 'MOVE',
  move: 'DOWN',
} as const;
const moveLeft = {
  key: 'move-left',
  label: 'moveLeft()',
  kind: 'MOVE',
  move: 'LEFT',
} as const;

const loopRoomDefinition: ITeacherRoomDefinition = {
  rows: 5,
  cols: 5,
  start: { row: 4, col: 0 },
  door: { row: 0, col: 4 },
  walls: [],
  availableBlocks: [
    moveUp,
    moveRight,
    {
      key: 'repeat',
      label: 'repeat(2)',
      kind: 'REPEAT',
      repeatCount: 2,
      loopBody: [moveUp],
    },
  ],
  requiredConcepts: ['MULTI_LINE_LOOP_BODY'],
};

const functionRoomDefinition: ITeacherRoomDefinition = {
  rows: 6,
  cols: 6,
  start: { row: 5, col: 0 },
  door: { row: 1, col: 4 },
  walls: [
    { row: 5, col: 1 },
    { row: 3, col: 0 },
    { row: 4, col: 2 },
    { row: 2, col: 1 },
    { row: 3, col: 3 },
    { row: 1, col: 2 },
    { row: 2, col: 4 },
  ],
  availableBlocks: [
    moveUp,
    moveRight,
    {
      key: 'function-def-climbStep',
      label: 'function climbStep()',
      kind: 'FUNCTION_DEF',
      functionName: 'climbStep',
      functionBody: [moveUp, moveRight],
    },
    {
      key: 'function-call-climbStep',
      label: 'climbStep()',
      kind: 'FUNCTION_CALL',
      functionName: 'climbStep',
    },
  ],
  requiredConcepts: ['FUNCTION_DEFINITION', 'FUNCTION_CALL'],
};

const strategyRoomDefinition: ITeacherRoomDefinition = {
  rows: 6,
  cols: 7,
  start: { row: 5, col: 0 },
  door: { row: 0, col: 6 },
  key: { row: 2, col: 2 },
  doorRequiresKey: true,
  walls: [
    { row: 4, col: 1 },
    { row: 4, col: 2 },
    { row: 4, col: 3 },
    { row: 4, col: 4 },
    { row: 3, col: 1 },
    { row: 3, col: 5 },
    { row: 2, col: 5 },
    { row: 1, col: 1 },
  ],
  availableBlocks: [
    moveUp,
    moveRight,
    moveDown,
    moveLeft,
    {
      key: 'if-path-right',
      label: 'if (pathRightClear) moveRight()',
      kind: 'CONDITIONAL',
      condition: 'PATH_RIGHT_CLEAR',
      action: 'RIGHT',
    },
    {
      key: 'if-has-key-up',
      label: 'if (hasKey) moveUp()',
      kind: 'CONDITIONAL',
      condition: 'HAS_KEY',
      action: 'UP',
    },
  ],
  requiredConcepts: ['STATE_CONDITION'],
};

const officialWorldManifest = {
  foundations: [
    {
      roomKey: 'porch-parade',
      title: 'Porch Parade',
      objective:
        'Sequence four moveRight() calls to pad straight across the porch and into the door.',
      lesson: 'Sequencing',
      difficulty: 'Easy',
      parMoves: 4,
      codeBudget: 4,
      sourceType: 'OFFICIAL_PUZZLE',
      worldId: 'foundations',
      officialPuzzleId: 'porch-parade',
    },
    {
      roomKey: 'lantern-turn',
      title: 'Lantern Turn',
      objective:
        'Read the full route first, then guide the cat through one clean turn around the stacked lanterns.',
      lesson: 'Sequencing',
      difficulty: 'Easy',
      parMoves: 7,
      codeBudget: 7,
      sourceType: 'OFFICIAL_PUZZLE',
      worldId: 'foundations',
      officialPuzzleId: 'lantern-turn',
    },
    {
      roomKey: 'warehouse-sprint',
      title: 'Warehouse Sprint',
      objective:
        'Choose the clean outside lane and avoid wasting moves in the cluttered middle of the warehouse.',
      lesson: 'Sequencing',
      difficulty: 'Hard',
      parMoves: 9,
      codeBudget: 9,
      sourceType: 'OFFICIAL_PUZZLE',
      worldId: 'foundations',
      officialPuzzleId: 'warehouse-sprint',
    },
  ],
  loops: [
    {
      roomKey: 'terrace-repeat',
      title: 'Terrace Repeat',
      objective:
        'Build two multi-line repeat blocks so the cat climbs the terrace and then slides across the top lane.',
      lesson: 'Loops',
      difficulty: 'Easy',
      parMoves: 2,
      codeBudget: 2,
      sourceType: 'OFFICIAL_PUZZLE',
      worldId: 'loops',
      officialPuzzleId: 'terrace-repeat',
    },
    {
      roomKey: 'switchback-scan',
      title: 'Switchback Scan',
      objective:
        'Use a while loop with a multi-step body to keep advancing while the right lane stays open.',
      lesson: 'Loops',
      difficulty: 'Medium',
      parMoves: 1,
      codeBudget: 3,
      sourceType: 'OFFICIAL_PUZZLE',
      worldId: 'loops',
      officialPuzzleId: 'switchback-scan',
    },
    {
      roomKey: 'echo-ramp',
      title: 'Echo Ramp',
      objective:
        'Nest repeat blocks so one outer plan reuses the same climb-and-cross pattern twice to reach the exit.',
      lesson: 'Loops',
      difficulty: 'Hard',
      parMoves: 1,
      codeBudget: 4,
      sourceType: 'OFFICIAL_PUZZLE',
      worldId: 'loops',
      officialPuzzleId: 'echo-ramp',
    },
  ],
  functions: [
    {
      roomKey: 'helper-hall',
      title: 'Helper Hall',
      objective:
        'Define climbStep() once, then call it to climb the repeating staircase without rewriting the same route.',
      lesson: 'Functions',
      difficulty: 'Medium',
      parMoves: 7,
      codeBudget: 4,
      sourceType: 'OFFICIAL_PUZZLE',
      worldId: 'functions',
      officialPuzzleId: 'helper-hall',
    },
    {
      roomKey: 'reuse-ridge',
      title: 'Reuse Ridge',
      objective:
        'Build ridgeHop() and call it across each stair-step ridge before finishing the final sprint to the door.',
      lesson: 'Functions',
      difficulty: 'Hard',
      parMoves: 9,
      codeBudget: 5,
      sourceType: 'OFFICIAL_PUZZLE',
      worldId: 'functions',
      officialPuzzleId: 'reuse-ridge',
    },
  ],
  strategy: [
    {
      roomKey: 'perimeter-plan',
      title: 'Perimeter Plan',
      objective:
        'Compare the available routes and clear the room within the 11-move par budget.',
      lesson: 'Strategy',
      difficulty: 'Hard',
      parMoves: 11,
      codeBudget: 11,
      sourceType: 'OFFICIAL_PUZZLE',
      worldId: 'strategy',
      officialPuzzleId: 'perimeter-plan',
    },
    {
      roomKey: 'false-shortcut',
      title: 'False Shortcut',
      objective:
        'The nearest-looking opening wastes moves. Find the stronger route and stay within 10 moves.',
      lesson: 'Strategy',
      difficulty: 'Hard',
      parMoves: 10,
      codeBudget: 10,
      sourceType: 'OFFICIAL_PUZZLE',
      worldId: 'strategy',
      officialPuzzleId: 'false-shortcut',
    },
  ],
} satisfies Record<string, IRoomManifestItem[]>;

const teacherUsers: SeedUser[] = [
  {
    username: 'Elena Cruz',
    email: 'elena.cruz@codecat.dev',
    role: Role.TEACHER,
    password: 'teacher12345',
  },
  {
    username: 'Ada Lim',
    email: 'ada.lim@codecat.dev',
    role: Role.TEACHER,
    password: 'teacher12345',
  },
  {
    username: 'Grace Navarro',
    email: 'grace.navarro@codecat.dev',
    role: Role.TEACHER,
    password: 'teacher12345',
  },
  ...[
    ['Miguel Santos', 'miguel.santos@codecat.dev'],
    ['Patricia Reyes', 'patricia.reyes@codecat.dev'],
    ['Daniel Flores', 'daniel.flores@codecat.dev'],
    ['Sofia Mendoza', 'sofia.mendoza@codecat.dev'],
    ['Carlo Bautista', 'carlo.bautista@codecat.dev'],
    ['Nina Valdez', 'nina.valdez@codecat.dev'],
    ['Jasmine Ortega', 'jasmine.ortega@codecat.dev'],
  ].map(([username, email]) => ({
    role: Role.TEACHER,
    username,
    email,
    password: 'teacher12345',
  })),
];

const studentUsers: SeedUser[] = [
  ['Alyssa Ramos', 'alyssa.ramos@codecat.dev'],
  ['Ethan Garcia', 'ethan.garcia@codecat.dev'],
  ['Bianca Torres', 'bianca.torres@codecat.dev'],
  ['Joshua Rivera', 'joshua.rivera@codecat.dev'],
  ['Camille Dela Cruz', 'camille.delacruz@codecat.dev'],
  ['Noah Villanueva', 'noah.villanueva@codecat.dev'],
  ['Mae Santos', 'mae.santos@codecat.dev'],
  ['Lucas Fernandez', 'lucas.fernandez@codecat.dev'],
  ['Trisha Aquino', 'trisha.aquino@codecat.dev'],
  ['Nathan Morales', 'nathan.morales@codecat.dev'],
].map(([username, email]) => ({
  username,
  email,
  role: Role.STUDENT,
  password: 'student12345',
}));

const classroomBlueprints = [
  {
    teacherEmail: PRIMARY_TEACHER_EMAIL,
    name: 'Foundations Homeroom',
    description: 'A beginner classroom for movement sequencing, route reading, and first puzzle wins.',
    lessonFocus: 'foundations',
  },
  {
    teacherEmail: PRIMARY_TEACHER_EMAIL,
    name: 'Loops Section A',
    description: 'Students practice repeat loops and route planning before entering helper functions.',
    lessonFocus: 'loops',
  },
  {
    teacherEmail: PRIMARY_TEACHER_EMAIL,
    name: 'Functions Studio',
    description: 'Students learn how to define and reuse helpers to reduce repeated command paths.',
    lessonFocus: 'functions',
  },
  {
    teacherEmail: PRIMARY_TEACHER_EMAIL,
    name: 'Strategy Lab',
    description: 'Students optimize routes against move budgets and compare stronger versus weaker solutions.',
    lessonFocus: 'strategy',
  },
  {
    teacherEmail: PRIMARY_TEACHER_EMAIL,
    name: 'Debug and Retry Room',
    description: 'Students repeat official and custom rooms while focusing on cleaner retries and fewer failures.',
    lessonFocus: 'loops',
  },
  {
    teacherEmail: PRIMARY_TEACHER_EMAIL,
    name: 'Capstone Demo Section',
    description: 'Mixed official and teacher-built gameplay prepared specifically for the capstone demo.',
    lessonFocus: 'strategy',
  },
  {
    teacherEmail: PRIMARY_TEACHER_EMAIL,
    name: 'Sequencing Sprint',
    description: 'Short, focused sequencing drills with quick wins for new students.',
    lessonFocus: 'foundations',
  },
  {
    teacherEmail: PRIMARY_TEACHER_EMAIL,
    name: 'Loop Mastery Clinic',
    description: 'Students compress repeated paths and improve block efficiency through loop practice.',
    lessonFocus: 'loops',
  },
  {
    teacherEmail: PRIMARY_TEACHER_EMAIL,
    name: 'Function Builders',
    description: 'Helper definitions, helper calls, and cleaner reuse patterns in teacher-directed play.',
    lessonFocus: 'functions',
  },
  {
    teacherEmail: PRIMARY_TEACHER_EMAIL,
    name: 'Route Optimization Workshop',
    description: 'Budget-focused rooms that reward better route decisions and fewer wasted moves.',
    lessonFocus: 'strategy',
  },
] as const satisfies ReadonlyArray<{
  teacherEmail: string;
  name: string;
  description: string;
  lessonFocus: 'foundations' | 'loops' | 'functions' | 'strategy';
}>;

const primaryTeacherRoomBlueprints = [
  {
    title: 'Foundations Path Builder',
    description: 'A teacher-built room that reinforces ordered movement and first-win sequencing.',
    objective: 'Guide the cat through a clean route with no wasted turns.',
    lessonTag: 'Sequencing',
    difficulty: 'Easy',
    parMoves: 5,
    codeBudget: 5,
    definition: loopRoomDefinition,
  },
  {
    title: 'Loop Terrace',
    description: 'A repeat-loop room for practicing compact movement plans.',
    objective: 'Use a repeat body to finish the route with fewer flat commands.',
    lessonTag: 'Loops',
    difficulty: 'Easy',
    parMoves: 4,
    codeBudget: 4,
    definition: loopRoomDefinition,
  },
  {
    title: 'Function Ladder',
    description: 'A helper-based room focused on defining and calling one function cleanly.',
    objective: 'Define one helper once, then reuse it across the ladder pattern.',
    lessonTag: 'Functions',
    difficulty: 'Medium',
    parMoves: 7,
    codeBudget: 5,
    definition: functionRoomDefinition,
  },
  {
    title: 'Strategy Sprint',
    description: 'A room with key logic and higher planning pressure.',
    objective: 'Collect the key, then choose the cleaner route into the locked exit.',
    lessonTag: 'Strategy',
    difficulty: 'Hard',
    parMoves: 10,
    codeBudget: 10,
    definition: strategyRoomDefinition,
  },
  {
    title: 'Retry Clinic',
    description: 'A room designed for students to compare retries and clean up inefficient runs.',
    objective: 'Finish the route while reducing wasted steps after a failed attempt.',
    lessonTag: 'Efficiency',
    difficulty: 'Medium',
    parMoves: 6,
    codeBudget: 6,
    definition: functionRoomDefinition,
  },
  {
    title: 'Capstone Key Route',
    description: 'A showcase room for the demo where route planning and sequencing are both visible.',
    objective: 'Pick up the key, avoid the trap lane, and finish within budget.',
    lessonTag: 'Strategy',
    difficulty: 'Hard',
    parMoves: 9,
    codeBudget: 9,
    definition: strategyRoomDefinition,
  },
  {
    title: 'Sequencing Sprint Builder',
    description: 'A short room for showing how teachers can tailor first-step sequencing practice.',
    objective: 'Read the corridor first, then finish in one clean path.',
    lessonTag: 'Sequencing',
    difficulty: 'Easy',
    parMoves: 4,
    codeBudget: 4,
    definition: loopRoomDefinition,
  },
  {
    title: 'Loop Mastery Builder',
    description: 'A compact loop challenge that rewards strong repeat-body design.',
    objective: 'Compress the repeated section and preserve a low block count.',
    lessonTag: 'Loops',
    difficulty: 'Medium',
    parMoves: 5,
    codeBudget: 4,
    definition: loopRoomDefinition,
  },
  {
    title: 'Function Workshop Builder',
    description: 'A function room that emphasizes abstraction over raw repetition.',
    objective: 'Package the repeated route into a helper, then reuse it efficiently.',
    lessonTag: 'Functions',
    difficulty: 'Medium',
    parMoves: 8,
    codeBudget: 5,
    definition: functionRoomDefinition,
  },
  {
    title: 'Optimization Workshop Builder',
    description: 'A stronger route-planning room for end-of-demo teacher workflows.',
    objective: 'Choose the best route, stay near par, and finish with an efficient block plan.',
    lessonTag: 'Strategy',
    difficulty: 'Hard',
    parMoves: 11,
    codeBudget: 10,
    definition: strategyRoomDefinition,
  },
] as const;

const secondaryTeacherRoomBlueprints = [
  {
    title: 'Loop Terrace',
    description: 'A teacher-built loop room for demoing repeat bodies and simpler command budgets.',
    objective: 'Use the repeat body to climb and cross with fewer flat commands.',
    lessonTag: 'Loops',
    difficulty: 'Easy',
    parMoves: 4,
    codeBudget: 4,
    definition: loopRoomDefinition,
  },
  {
    title: 'Function Ladder',
    description: 'A teacher-built functions room focused on defining and calling one helper cleanly.',
    objective: 'Define one helper once, then reuse it across the ladder pattern.',
    lessonTag: 'Functions',
    difficulty: 'Medium',
    parMoves: 7,
    codeBudget: 5,
    definition: functionRoomDefinition,
  },
  {
    title: 'Strategy Sprint',
    description: 'A teacher-built strategy room with key logic and higher planning pressure.',
    objective: 'Collect the key, then choose the cleaner route into the locked exit.',
    lessonTag: 'Strategy',
    difficulty: 'Hard',
    parMoves: 10,
    codeBudget: 10,
    definition: strategyRoomDefinition,
  },
] as const;

const levelBlueprints = [
  {
    name: 'Foundations',
    description: 'Legacy sequencing levels for demo completeness.',
    difficulty: Difficulty.EASY,
    puzzles: [
      {
        description: 'Guide the cat in a straight line to the door.',
        expectedOutput: 'CAT_REACHES_DOOR',
        hint: 'Use four ordered moves.',
        type: PuzzleType.SEQUENCING,
      },
      {
        description: 'Navigate around one wall cluster.',
        expectedOutput: 'CAT_AVOIDS_WALLS',
        hint: 'Read the turn before you move.',
        type: PuzzleType.SEQUENCING,
      },
      {
        description: 'Use the cleaner route with fewer wasted steps.',
        expectedOutput: 'CAT_TAKES_CLEAN_ROUTE',
        hint: 'The shorter path is not always the nearest-looking lane.',
        type: PuzzleType.SEQUENCING,
      },
    ],
  },
  {
    name: 'Decisions',
    description: 'Legacy conditional levels for demo completeness.',
    difficulty: Difficulty.MEDIUM,
    puzzles: [
      {
        description: 'Check whether the path is clear before moving right.',
        expectedOutput: 'CAT_CHECKS_RIGHT_PATH',
        hint: 'Conditionals prevent collisions.',
        type: PuzzleType.CONDITIONAL,
      },
      {
        description: 'Use door detection to finish the route.',
        expectedOutput: 'CAT_FINDS_DOOR',
        hint: 'Move only when the door direction matches.',
        type: PuzzleType.CONDITIONAL,
      },
      {
        description: 'Use two conditional checks in sequence.',
        expectedOutput: 'CAT_COMBINES_CONDITIONS',
        hint: 'One condition can set up the next.',
        type: PuzzleType.CONDITIONAL,
      },
    ],
  },
  {
    name: 'Loops',
    description: 'Legacy loop levels for demo completeness.',
    difficulty: Difficulty.HARD,
    puzzles: [
      {
        description: 'Compress repeated climbs into one loop body.',
        expectedOutput: 'CAT_REPEATS_CLIMB',
        hint: 'Two identical segments belong inside one repeat.',
        type: PuzzleType.LOOP,
      },
      {
        description: 'Advance while the path stays open.',
        expectedOutput: 'CAT_RUNS_WHILE_LOOP',
        hint: 'The loop exits when the open path disappears.',
        type: PuzzleType.LOOP,
      },
      {
        description: 'Reuse the same pattern twice without rewriting every move.',
        expectedOutput: 'CAT_NESTS_LOOPS',
        hint: 'Think about outer and inner repetition.',
        type: PuzzleType.LOOP,
      },
    ],
  },
] as const;

const resetDemoCollections = async () => {
  await prisma.studentAssignmentProgress.deleteMany();
  await prisma.classroomAssignment.deleteMany();
  await prisma.teacherRoomVersion.deleteMany();
  await prisma.classroomEnrollment.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.playerProgress.deleteMany();
  await prisma.puzzle.deleteMany();
  await prisma.level.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.playerSettings.deleteMany();
  await prisma.adminLog.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.adminReport.deleteMany();
  await prisma.user.deleteMany();
};

const createUser = async (
  user: SeedUser,
  passwordHashes: Record<string, string>,
) =>
  prisma.user.create({
    data: {
      username: user.username,
      email: user.email,
      passwordHash: passwordHashes[user.password],
      role: user.role as PrismaRole,
      settings: {
        create: {
          volumeLevel: user.role === Role.STUDENT ? 70 : 55,
        },
      },
    },
  });

const createLevels = async () => {
  const createdLevels: Array<{
    id: string;
    puzzles: Array<{ id: string }>;
  }> = [];

  for (const [levelIndex, level] of levelBlueprints.entries()) {
    const createdLevel = await prisma.level.create({
      data: {
        name: level.name,
        description: level.description,
        difficulty: level.difficulty as PrismaDifficulty,
        order: levelIndex + 1,
        puzzles: {
          create: level.puzzles.map((puzzle, puzzleIndex) => ({
            description: puzzle.description,
            expectedOutput: puzzle.expectedOutput,
            hint: puzzle.hint,
            type: puzzle.type as PrismaPuzzleType,
            order: puzzleIndex + 1,
          })),
        },
      },
      include: {
        puzzles: {
          select: {
            id: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    createdLevels.push({
      id: createdLevel.id,
      puzzles: createdLevel.puzzles,
    });
  }

  return createdLevels;
};

const createRoomVersion = async (input: {
  teacherId: string;
  title: string;
  description: string;
  objective: string;
  lessonTag: ITeacherRoomVersion['lessonTag'];
  difficulty: ITeacherRoomVersion['difficulty'];
  parMoves: number;
  codeBudget: number;
  definition: ITeacherRoomDefinition;
}) =>
  prisma.teacherRoomVersion.create({
    data: {
      teacherId: input.teacherId,
      title: input.title,
      description: input.description,
      objective: input.objective,
      lessonTag: input.lessonTag,
      difficulty:
        ({
          Easy: Difficulty.EASY,
          Medium: Difficulty.MEDIUM,
          Hard: Difficulty.HARD,
        } as const)[input.difficulty] as PrismaRoomDifficulty,
      parMoves: input.parMoves,
      codeBudget: input.codeBudget,
      lifecycleStatus: RoomLifecycleStatus.PUBLISHED as PrismaLifecycleStatus,
      definition: input.definition as unknown as Prisma.InputJsonObject,
      isLatest: true,
      publishedAt: daysFromNow(-3),
    },
  });

const createOfficialAssignment = async (input: {
  classroomId: string;
  teacherId: string;
  title: string;
  description: string;
  worldId: keyof typeof officialWorldManifest;
  startAt: Date;
  dueAt: Date;
}) =>
  prisma.classroomAssignment.create({
    data: {
      classroomId: input.classroomId,
      teacherId: input.teacherId,
      targetType:
        AssignmentTargetType.OFFICIAL_WORLD as PrismaAssignmentTargetType,
      title: input.title,
      description: input.description,
      startAt: input.startAt,
      dueAt: input.dueAt,
      officialWorldId: input.worldId,
      roomManifest: officialWorldManifest[input.worldId] as unknown as Prisma.InputJsonValue,
    },
  });

const createCustomAssignment = async (input: {
  classroomId: string;
  teacherId: string;
  title: string;
  description: string;
  roomVersion: Prisma.TeacherRoomVersionGetPayload<Record<string, never>>;
  startAt: Date;
  dueAt: Date;
}) => {
  const manifest = buildManifestFromCustomRoom(
    formatRoomVersion(input.roomVersion),
  );

  return prisma.classroomAssignment.create({
    data: {
      classroomId: input.classroomId,
      teacherId: input.teacherId,
      targetType:
        AssignmentTargetType.CUSTOM_ROOM as PrismaAssignmentTargetType,
      title: input.title,
      description: input.description,
      startAt: input.startAt,
      dueAt: input.dueAt,
      customRoomVersionId: input.roomVersion.id,
      roomManifest: [manifest] as unknown as Prisma.InputJsonValue,
    },
  });
};

const seed = async () => {
  if (teacherUsers.length !== DEMO_TEACHER_COUNT) {
    throw new Error(
      `Expected ${DEMO_TEACHER_COUNT} teacher users, received ${teacherUsers.length}.`,
    );
  }

  if (studentUsers.length !== DEMO_STUDENT_COUNT) {
    throw new Error(
      `Expected ${DEMO_STUDENT_COUNT} student users, received ${studentUsers.length}.`,
    );
  }

  if (classroomBlueprints.length !== DEMO_CLASSROOM_COUNT) {
    throw new Error(
      `Expected ${DEMO_CLASSROOM_COUNT} classroom blueprints, received ${classroomBlueprints.length}.`,
    );
  }

  if (levelBlueprints.length !== DEMO_LEVEL_COUNT) {
    throw new Error(
      `Expected ${DEMO_LEVEL_COUNT} level blueprints, received ${levelBlueprints.length}.`,
    );
  }

  const passwordHashes = {
    admin12345: await bcrypt.hash('admin12345', 12),
    teacher12345: await bcrypt.hash('teacher12345', 12),
    student12345: await bcrypt.hash('student12345', 12),
  };

  await resetDemoCollections();

  const admin = await createUser(
    {
      username: 'codecat-admin',
      email: 'admin@codecat.dev',
      role: Role.ADMIN,
      password: 'admin12345',
    },
    passwordHashes,
  );

  const teachers = await Promise.all(
    teacherUsers.map((user) => createUser(user, passwordHashes)),
  );
  const students = await Promise.all(
    studentUsers.map((user) => createUser(user, passwordHashes)),
  );
  const levels = await createLevels();

  await prisma.announcement.create({
    data: {
      adminId: admin.id,
      title: 'Capstone demo ready',
      message:
        'Demo accounts, classrooms, assignments, and progress have been seeded for the presentation walkthrough.',
    },
  });

  await prisma.adminReport.create({
    data: {
      adminId: admin.id,
      reportType: 'CONTENT_USAGE',
      description:
        'Seeded demo report showing prepared classroom activity and assignment coverage.',
    },
  });

  const teacherByEmail = new Map(teachers.map((teacher) => [teacher.email, teacher]));

  const classrooms = [];
  for (const [index, blueprint] of classroomBlueprints.entries()) {
    const teacher = teacherByEmail.get(blueprint.teacherEmail);

    if (!teacher) {
      throw new Error(`Teacher not found for ${blueprint.teacherEmail}`);
    }

    const classroom = await prisma.classroom.create({
      data: {
        teacherId: teacher.id,
        name: blueprint.name,
        description: blueprint.description,
        isPrivate: true,
        requiresApproval: false,
      },
    });

    const startIndex = (index * 2) % students.length;
    const enrolledStudents = Array.from({ length: 6 }).map(
      (_, offset) => students[(startIndex + offset) % students.length],
    );

    await prisma.classroomEnrollment.createMany({
      data: enrolledStudents.map((student) => ({
        classroomId: classroom.id,
        studentId: student.id,
        createdAt: daysFromNow(-10 + offsetSeed(index)),
      })),
    });

    classrooms.push({
      ...classroom,
      teacher,
      lessonFocus: blueprint.lessonFocus,
      students: enrolledStudents,
    });
  }

  const createSeedRoomVersions = async (teacher: { id: string; email: string; username: string }) =>
    Promise.all(
      (teacher.email === PRIMARY_TEACHER_EMAIL
        ? primaryTeacherRoomBlueprints
        : secondaryTeacherRoomBlueprints
      ).map((roomBlueprint) =>
        createRoomVersion({
          teacherId: teacher.id,
          title: `${teacher.username} ${roomBlueprint.title}`,
          description: roomBlueprint.description,
          objective: roomBlueprint.objective,
          lessonTag: roomBlueprint.lessonTag,
          difficulty: roomBlueprint.difficulty,
          parMoves: roomBlueprint.parMoves,
          codeBudget: roomBlueprint.codeBudget,
          definition: roomBlueprint.definition,
        }),
      ),
    );

  const roomVersionsByTeacher = new Map<string, Prisma.TeacherRoomVersionGetPayload<Record<string, never>>[]>();
  for (const teacher of teachers) {
    const createdRooms = await createSeedRoomVersions(teacher);

    roomVersionsByTeacher.set(teacher.id, createdRooms);
  }

  const assignments: Prisma.ClassroomAssignmentGetPayload<Record<string, never>>[] = [];
  for (const [index, classroom] of classrooms.entries()) {
    const teacherRooms = roomVersionsByTeacher.get(classroom.teacher.id) ?? [];
    const customRoom =
      classroom.teacher.email === PRIMARY_TEACHER_EMAIL
        ? teacherRooms[index]
        : teacherRooms[
            classroom.lessonFocus === 'functions'
              ? 1
              : classroom.lessonFocus === 'strategy'
                ? 2
                : 0
          ];

    const officialAssignment = await createOfficialAssignment({
      classroomId: classroom.id,
      teacherId: classroom.teacher.id,
      title: `${classroom.name} Official Track`,
      description:
        'Built-in gameplay assigned to reinforce the active lesson focus of this classroom.',
      worldId:
        classroom.lessonFocus === 'functions'
          ? 'functions'
          : classroom.lessonFocus === 'strategy'
            ? 'strategy'
            : classroom.lessonFocus === 'loops'
              ? 'loops'
              : 'foundations',
      startAt: daysFromNow(-7 + index),
      dueAt: daysFromNow(5 + index),
    });
    assignments.push(officialAssignment);

    if (customRoom) {
      const customAssignment = await createCustomAssignment({
        classroomId: classroom.id,
        teacherId: classroom.teacher.id,
        title: `${classroom.name} Teacher Room`,
        description:
          'Custom teacher-built room that becomes automatically playable for enrolled students.',
        roomVersion: customRoom,
        startAt: daysFromNow(-2 + index),
        dueAt: daysFromNow(9 + index),
      });
      assignments.push(customAssignment);
    }
  }

  for (const [index, assignment] of assignments.entries()) {
    const classroom = classrooms.find((entry) => entry.id === assignment.classroomId);

    if (!classroom) {
      continue;
    }

    const manifest = assignment.roomManifest as unknown as IRoomManifestItem[];
    const activeStudents = classroom.students.slice(0, 3);

    for (const [studentIndex, student] of activeStudents.entries()) {
      for (const [roomIndex, room] of manifest.entries()) {
        const didComplete = studentIndex < 2;
        const attempts = didComplete ? 1 + roomIndex + studentIndex : 2 + roomIndex;
        const failures = didComplete ? studentIndex : attempts;
        const bestScore = didComplete
          ? Math.max(
              72,
              96 - studentIndex * 6 - roomIndex * 4 - (index % 3) * 3,
            )
          : null;
        const latestScore = didComplete ? bestScore : 0;
        const letterGrade =
          bestScore === null
            ? null
            : bestScore >= 90
              ? 'A'
              : bestScore >= 80
                ? 'B'
                : 'C';

        await prisma.studentAssignmentProgress.create({
          data: {
            assignmentId: assignment.id,
            classroomId: assignment.classroomId,
            studentId: student.id,
            roomKey: room.roomKey,
            roomTitle: room.title,
            roomSource: room.sourceType,
            status: (didComplete
              ? CompletionStatus.COMPLETED
              : CompletionStatus.IN_PROGRESS) as CompletionStatus,
            attempts,
            failures,
            totalTimeSpent: 180 + roomIndex * 45 + studentIndex * 25,
            latestMovesUsed: room.parMoves + studentIndex + roomIndex,
            bestMovesUsed: didComplete ? room.parMoves + studentIndex : null,
            latestBlocksUsed: room.codeBudget + studentIndex,
            bestBlocksUsed: didComplete ? room.codeBudget + studentIndex : null,
            latestScore,
            bestScore,
            latestLetterGrade: didComplete ? letterGrade : 'F',
            bestLetterGrade: letterGrade,
            lastPlayedAt: daysFromNow(-(index % 5)),
            solvedAt: didComplete ? daysFromNow(-(studentIndex + 1)) : null,
          },
        });
      }
    }
  }

  for (const [studentIndex, student] of students.slice(0, 8).entries()) {
    for (const [levelIndex, level] of levels.entries()) {
      for (const [puzzleIndex, puzzle] of level.puzzles.entries()) {
        if (levelIndex + puzzleIndex > studentIndex + 1) {
          continue;
        }

        await prisma.playerProgress.create({
          data: {
            userId: student.id,
            levelId: level.id,
            puzzleId: puzzle.id,
            status:
              levelIndex + puzzleIndex < studentIndex + 1
                ? CompletionStatus.COMPLETED
                : CompletionStatus.IN_PROGRESS,
            attempts: 1 + puzzleIndex,
            timeSpent: 60 + levelIndex * 30 + puzzleIndex * 20,
          },
        });
      }
    }
  }

  await Promise.all(
    students.slice(0, 6).flatMap((student, index) => [
      prisma.achievement.create({
        data: {
          userId: student.id,
          name: 'First Classroom Clear',
          description: 'Cleared the first teacher-assigned classroom gameplay.',
          dateUnlocked: daysFromNow(-(index + 1)),
        },
      }),
      prisma.achievement.create({
        data: {
          userId: student.id,
          name: 'Route Optimizer',
          description: 'Finished a room with a strong score and a cleaner route.',
          dateUnlocked: daysFromNow(-(index + 2)),
        },
      }),
    ]),
  );

  await prisma.adminLog.create({
    data: {
      adminId: admin.id,
      action: 'SEED_DATABASE',
      details:
        'Capstone demo dataset created with teachers, students, classrooms, custom room versions, assignments, and progress.',
    },
  });

  // eslint-disable-next-line no-console
  console.log('Code Cat demo data seeded.');
  // eslint-disable-next-line no-console
  console.table([
    { role: 'ADMIN', email: 'admin@codecat.dev', password: 'admin12345' },
    { role: 'TEACHER', email: 'elena.cruz@codecat.dev', password: 'teacher12345' },
    { role: 'TEACHER', email: 'ada.lim@codecat.dev', password: 'teacher12345' },
    { role: 'TEACHER', email: 'grace.navarro@codecat.dev', password: 'teacher12345' },
    { role: 'STUDENT', email: 'alyssa.ramos@codecat.dev', password: 'student12345' },
    { role: 'STUDENT', email: 'ethan.garcia@codecat.dev', password: 'student12345' },
    { role: 'STUDENT', email: 'bianca.torres@codecat.dev', password: 'student12345' },
  ]);
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
