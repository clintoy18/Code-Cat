import { AssignmentTargetType, RoomLifecycleStatus } from '@shared/types/teacher';
import { z } from 'zod';
import { objectIdSchema } from '@/lib/objectId';

const lessonTopicSchema = z.enum([
  'Sequencing',
  'Debugging',
  'Efficiency',
  'Conditionals',
  'Boolean Logic',
  'Loops',
  'Functions',
  'Variables',
  'Strategy',
]);

const roomDifficultySchema = z.enum(['Easy', 'Medium', 'Hard']);
const programRequirementSchema = z.enum([
  'MULTI_LINE_LOOP_BODY',
  'WHILE_LOOP',
  'NESTED_LOOP',
  'FUNCTION_DEFINITION',
  'FUNCTION_CALL',
  'STATE_CONDITION',
]);

const roomPositionSchema = z.object({
  row: z.number().int().min(0),
  col: z.number().int().min(0),
});

const roomBlockSchema = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1),
    kind: z.enum(['MOVE', 'CONDITIONAL', 'REPEAT', 'WHILE', 'FUNCTION_DEF', 'FUNCTION_CALL']),
  })
  .passthrough();

const roomDefinitionSchema = z.object({
  rows: z.number().int().min(2).max(12),
  cols: z.number().int().min(2).max(12),
  start: roomPositionSchema,
  door: roomPositionSchema,
  key: roomPositionSchema.nullish(),
  doorRequiresKey: z.boolean().optional(),
  walls: z.array(roomPositionSchema).max(80),
  availableBlocks: z.array(roomBlockSchema).min(1).max(24),
  requiredConcepts: z.array(programRequirementSchema).optional(),
});

const roomManifestItemSchema = z.object({
  roomKey: z.string().min(1),
  title: z.string().min(1),
  objective: z.string().min(1),
  lesson: lessonTopicSchema,
  difficulty: roomDifficultySchema,
  parMoves: z.number().int().min(1).max(200),
  codeBudget: z.number().int().min(1).max(200),
  sourceType: z.enum(['OFFICIAL_PUZZLE', 'CUSTOM_ROOM']),
  worldId: z.string().min(1).optional(),
  officialPuzzleId: z.string().min(1).optional(),
  customRoomVersionId: objectIdSchema.optional(),
});

const paginationFieldSchema = z.coerce.number().int().min(1).optional();

export const teacherPaginationQuerySchema = z.object({
  page: paginationFieldSchema,
  pageSize: paginationFieldSchema,
  classroomId: objectIdSchema.optional(),
});

export const classroomDetailPaginationQuerySchema = z.object({
  enrollmentsPage: paginationFieldSchema,
  enrollmentsPageSize: paginationFieldSchema,
  assignmentsPage: paginationFieldSchema,
  assignmentsPageSize: paginationFieldSchema,
});

export const classroomDashboardPaginationQuerySchema = z.object({
  rosterPage: paginationFieldSchema,
  rosterPageSize: paginationFieldSchema,
});

export const teacherStudentParamsSchema = z.object({
  id: objectIdSchema,
});

export const classroomParamsSchema = z.object({
  id: objectIdSchema,
});

export const classroomEnrollmentParamsSchema = z.object({
  id: objectIdSchema,
  enrollmentId: objectIdSchema,
});

export const classroomAssignmentParamsSchema = z.object({
  id: objectIdSchema,
  assignmentId: objectIdSchema,
});

export const roomVersionParamsSchema = z.object({
  id: objectIdSchema,
});

export const createClassroomSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(600),
  isPrivate: z.boolean().default(true),
  requiresApproval: z.boolean().default(false),
  studentIds: z.array(objectIdSchema).max(200).optional(),
});

export const updateClassroomSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(600),
  isPrivate: z.boolean().default(true),
  requiresApproval: z.boolean().default(false),
});

export const enrollStudentsSchema = z.object({
  studentIds: z.array(objectIdSchema).min(1).max(200),
});

export const createTeacherRoomVersionSchema = z.object({
  baseVersionId: objectIdSchema.optional(),
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(600),
  lessonTag: lessonTopicSchema,
  objective: z.string().trim().min(10).max(300),
  difficulty: roomDifficultySchema,
  parMoves: z.number().int().min(1).max(200),
  codeBudget: z.number().int().min(1).max(200),
  lifecycleStatus: z.nativeEnum(RoomLifecycleStatus).default(RoomLifecycleStatus.DRAFT),
  definition: roomDefinitionSchema,
});

export const createClassroomAssignmentSchema = z.object({
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().max(400).nullish(),
  targetType: z.nativeEnum(AssignmentTargetType),
  startAt: z.string().datetime(),
  dueAt: z.string().datetime().nullish(),
  officialWorldId: z.string().trim().min(1).optional(),
  officialPuzzleId: z.string().trim().min(1).optional(),
  customRoomVersionId: objectIdSchema.optional(),
  roomManifest: z.array(roomManifestItemSchema).max(30).optional(),
});

export const updateClassroomAssignmentSchema = z.object({
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().max(400).nullish(),
  startAt: z.string().datetime(),
  dueAt: z.string().datetime().nullish(),
});

export const updateRoomLifecycleSchema = z.object({
  lifecycleStatus: z.nativeEnum(RoomLifecycleStatus),
});
