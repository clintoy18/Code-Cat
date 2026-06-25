import type { IUser } from './user';
import type { CompletionStatus } from './progress';

export enum RoomLifecycleStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum AssignmentTargetType {
  OFFICIAL_WORLD = 'OFFICIAL_WORLD',
  OFFICIAL_PUZZLE = 'OFFICIAL_PUZZLE',
  CUSTOM_ROOM = 'CUSTOM_ROOM',
}

export type TeacherRoomSource = 'OFFICIAL_PUZZLE' | 'CUSTOM_ROOM';

export type LessonTopic =
  | 'Sequencing'
  | 'Debugging'
  | 'Efficiency'
  | 'Conditionals'
  | 'Boolean Logic'
  | 'Loops'
  | 'Functions'
  | 'Variables'
  | 'Strategy';

export type RoomDifficulty = 'Easy' | 'Medium' | 'Hard';

export type MoveDirection = 'UP' | 'RIGHT' | 'DOWN' | 'LEFT';

export type GameCondition =
  | 'PATH_UP_CLEAR'
  | 'PATH_RIGHT_CLEAR'
  | 'PATH_DOWN_CLEAR'
  | 'PATH_LEFT_CLEAR'
  | 'HAS_KEY'
  | 'DOOR_UP'
  | 'DOOR_RIGHT'
  | 'DOOR_DOWN'
  | 'DOOR_LEFT';

export type ProgramRequirement =
  | 'MULTI_LINE_LOOP_BODY'
  | 'WHILE_LOOP'
  | 'NESTED_LOOP'
  | 'FUNCTION_DEFINITION'
  | 'FUNCTION_CALL'
  | 'STATE_CONDITION';

export interface IPosition {
  row: number;
  col: number;
}

interface ITeacherBlockBase {
  key: string;
  label: string;
}

export interface IMoveBlockTemplate extends ITeacherBlockBase {
  kind: 'MOVE';
  move: MoveDirection;
}

export interface IConditionalBlockTemplate extends ITeacherBlockBase {
  kind: 'CONDITIONAL';
  condition: GameCondition;
  action: MoveDirection;
}

export interface IRepeatBlockTemplate extends ITeacherBlockBase {
  kind: 'REPEAT';
  repeatCount: number;
  loopBody: ITeacherBlockTemplate[];
}

export interface IWhileBlockTemplate extends ITeacherBlockBase {
  kind: 'WHILE';
  condition: GameCondition;
  loopBody: ITeacherBlockTemplate[];
}

export interface IFunctionDefinitionBlockTemplate extends ITeacherBlockBase {
  kind: 'FUNCTION_DEF';
  functionName: string;
  functionBody: ITeacherBlockTemplate[];
}

export interface IFunctionCallBlockTemplate extends ITeacherBlockBase {
  kind: 'FUNCTION_CALL';
  functionName: string;
}

export type ITeacherBlockTemplate =
  | IMoveBlockTemplate
  | IConditionalBlockTemplate
  | IRepeatBlockTemplate
  | IWhileBlockTemplate
  | IFunctionDefinitionBlockTemplate
  | IFunctionCallBlockTemplate;

export interface ITeacherRoomDefinition {
  rows: number;
  cols: number;
  start: IPosition;
  door: IPosition;
  key?: IPosition | null;
  doorRequiresKey?: boolean;
  walls: IPosition[];
  availableBlocks: ITeacherBlockTemplate[];
  requiredConcepts?: ProgramRequirement[];
}

export interface IClassroom {
  id: string;
  teacherId: string;
  name: string;
  description: string;
  isPrivate: boolean;
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
  enrollmentCount?: number;
  assignmentCount?: number;
}

export interface IClassroomEnrollment {
  id: string;
  classroomId: string;
  student: IUser;
  createdAt: string;
}

export interface ITeacherRoomVersion {
  id: string;
  teacherId: string;
  versionGroupId: string;
  versionNumber: number;
  title: string;
  description: string;
  lessonTag: LessonTopic;
  objective: string;
  difficulty: RoomDifficulty;
  parMoves: number;
  codeBudget: number;
  lifecycleStatus: RoomLifecycleStatus;
  definition: ITeacherRoomDefinition;
  isLatest: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IRoomManifestItem {
  roomKey: string;
  title: string;
  objective: string;
  lesson: LessonTopic;
  difficulty: RoomDifficulty;
  parMoves: number;
  codeBudget: number;
  sourceType: TeacherRoomSource;
  worldId?: string;
  officialPuzzleId?: string;
  customRoomVersionId?: string;
}

export interface IClassroomAssignment {
  id: string;
  classroomId: string;
  teacherId: string;
  targetType: AssignmentTargetType;
  title: string;
  description: string | null;
  startAt: string;
  dueAt: string | null;
  officialWorldId: string | null;
  officialPuzzleId: string | null;
  customRoomVersionId: string | null;
  roomManifest: IRoomManifestItem[];
  createdAt: string;
  updatedAt: string;
}

export interface IStudentAssignmentRoomProgress {
  id: string;
  assignmentId: string;
  classroomId: string;
  studentId: string;
  roomKey: string;
  roomTitle: string;
  roomSource: TeacherRoomSource;
  status: CompletionStatus;
  attempts: number;
  failures: number;
  totalTimeSpent: number;
  latestMovesUsed: number | null;
  bestMovesUsed: number | null;
  latestBlocksUsed: number | null;
  bestBlocksUsed: number | null;
  latestScore: number | null;
  bestScore: number | null;
  latestLetterGrade: string | null;
  bestLetterGrade: string | null;
  lastPlayedAt: string | null;
  solvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
