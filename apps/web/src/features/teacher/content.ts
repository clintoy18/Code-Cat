import type {
  GameCondition,
  IBlockTemplate,
  IPuzzleDefinition,
  ProgramRequirement,
} from '@/features/game/engine';
import {
  createFunctionCallBlockTemplate,
  createFunctionDefinitionBlockTemplate,
  createRepeatBlockTemplate,
  createWhileBlockTemplate,
} from '@/features/game/engine';
import { curriculumWorlds } from '@/features/game/data/curriculumRoadmap';
import type {
  IRoomManifestItem,
  ITeacherBlockTemplate,
  ITeacherRoomVersion,
  LessonTopic,
} from '@shared/types/teacher';

export const blockPresetCatalog = [
  { id: 'move-up', label: 'moveUp()', category: 'Movement' },
  { id: 'move-right', label: 'moveRight()', category: 'Movement' },
  { id: 'move-down', label: 'moveDown()', category: 'Movement' },
  { id: 'move-left', label: 'moveLeft()', category: 'Movement' },
  { id: 'if-path-up', label: 'if (pathUpClear) moveUp()', category: 'Checks' },
  { id: 'if-path-right', label: 'if (pathRightClear) moveRight()', category: 'Checks' },
  { id: 'if-path-down', label: 'if (pathDownClear) moveDown()', category: 'Checks' },
  { id: 'if-path-left', label: 'if (pathLeftClear) moveLeft()', category: 'Checks' },
  { id: 'if-door-up', label: 'if (doorUp) moveUp()', category: 'Checks' },
  { id: 'if-door-right', label: 'if (doorRight) moveRight()', category: 'Checks' },
  { id: 'if-door-down', label: 'if (doorDown) moveDown()', category: 'Checks' },
  { id: 'if-door-left', label: 'if (doorLeft) moveLeft()', category: 'Checks' },
  { id: 'if-has-key-up', label: 'if (hasKey) moveUp()', category: 'State' },
  { id: 'if-has-key-right', label: 'if (hasKey) moveRight()', category: 'State' },
  { id: 'if-has-key-down', label: 'if (hasKey) moveDown()', category: 'State' },
  { id: 'if-has-key-left', label: 'if (hasKey) moveLeft()', category: 'State' },
  { id: 'repeat', label: 'repeat(...)', category: 'Loops' },
  { id: 'while', label: 'while(...)', category: 'Loops' },
  { id: 'helper', label: 'function helper() / helper()', category: 'Functions' },
] as const;

const moveTemplateMap = {
  'move-up': { key: 'move-up', label: 'moveUp()', kind: 'MOVE', move: 'UP' },
  'move-right': { key: 'move-right', label: 'moveRight()', kind: 'MOVE', move: 'RIGHT' },
  'move-down': { key: 'move-down', label: 'moveDown()', kind: 'MOVE', move: 'DOWN' },
  'move-left': { key: 'move-left', label: 'moveLeft()', kind: 'MOVE', move: 'LEFT' },
} as const satisfies Record<
  'move-up' | 'move-right' | 'move-down' | 'move-left',
  Extract<IBlockTemplate, { kind: 'MOVE' }>
>;

const conditionalTemplateMap = {
  'if-path-up': {
    key: 'if-path-up',
    label: 'if (pathUpClear) moveUp()',
    kind: 'CONDITIONAL',
    condition: 'PATH_UP_CLEAR',
    action: 'UP',
  },
  'if-path-right': {
    key: 'if-path-right',
    label: 'if (pathRightClear) moveRight()',
    kind: 'CONDITIONAL',
    condition: 'PATH_RIGHT_CLEAR',
    action: 'RIGHT',
  },
  'if-path-down': {
    key: 'if-path-down',
    label: 'if (pathDownClear) moveDown()',
    kind: 'CONDITIONAL',
    condition: 'PATH_DOWN_CLEAR',
    action: 'DOWN',
  },
  'if-path-left': {
    key: 'if-path-left',
    label: 'if (pathLeftClear) moveLeft()',
    kind: 'CONDITIONAL',
    condition: 'PATH_LEFT_CLEAR',
    action: 'LEFT',
  },
  'if-door-up': {
    key: 'if-door-up',
    label: 'if (doorUp) moveUp()',
    kind: 'CONDITIONAL',
    condition: 'DOOR_UP',
    action: 'UP',
  },
  'if-door-right': {
    key: 'if-door-right',
    label: 'if (doorRight) moveRight()',
    kind: 'CONDITIONAL',
    condition: 'DOOR_RIGHT',
    action: 'RIGHT',
  },
  'if-door-down': {
    key: 'if-door-down',
    label: 'if (doorDown) moveDown()',
    kind: 'CONDITIONAL',
    condition: 'DOOR_DOWN',
    action: 'DOWN',
  },
  'if-door-left': {
    key: 'if-door-left',
    label: 'if (doorLeft) moveLeft()',
    kind: 'CONDITIONAL',
    condition: 'DOOR_LEFT',
    action: 'LEFT',
  },
  'if-has-key-up': {
    key: 'if-has-key-up',
    label: 'if (hasKey) moveUp()',
    kind: 'CONDITIONAL',
    condition: 'HAS_KEY',
    action: 'UP',
  },
  'if-has-key-right': {
    key: 'if-has-key-right',
    label: 'if (hasKey) moveRight()',
    kind: 'CONDITIONAL',
    condition: 'HAS_KEY',
    action: 'RIGHT',
  },
  'if-has-key-down': {
    key: 'if-has-key-down',
    label: 'if (hasKey) moveDown()',
    kind: 'CONDITIONAL',
    condition: 'HAS_KEY',
    action: 'DOWN',
  },
  'if-has-key-left': {
    key: 'if-has-key-left',
    label: 'if (hasKey) moveLeft()',
    kind: 'CONDITIONAL',
    condition: 'HAS_KEY',
    action: 'LEFT',
  },
} as const;

export const buildTeacherBlocksFromPresetSelection = (input: {
  selectedPresetIds: string[];
  helperName: string;
  whileCondition: GameCondition;
  repeatCount: number;
}): IBlockTemplate[] => {
  const templates: IBlockTemplate[] = [];

  input.selectedPresetIds.forEach((presetId) => {
    if (presetId in moveTemplateMap) {
      templates.push(moveTemplateMap[presetId as keyof typeof moveTemplateMap]);
      return;
    }

    if (presetId in conditionalTemplateMap) {
      templates.push(
        conditionalTemplateMap[presetId as keyof typeof conditionalTemplateMap],
      );
      return;
    }

    if (presetId === 'repeat') {
      templates.push(createRepeatBlockTemplate(input.repeatCount));
      return;
    }

    if (presetId === 'while') {
      templates.push(createWhileBlockTemplate(input.whileCondition));
      return;
    }

    if (presetId === 'helper') {
      const helperName = input.helperName.trim() || 'helperStep';
      templates.push(createFunctionDefinitionBlockTemplate(helperName));
      templates.push(createFunctionCallBlockTemplate(helperName));
    }
  });

  return templates;
};

export const buildOfficialRoomManifestItem = (
  worldId: string,
  puzzle: IPuzzleDefinition,
): IRoomManifestItem => ({
  roomKey: puzzle.id,
  title: puzzle.title,
  objective: puzzle.objective,
  lesson: puzzle.lesson as LessonTopic,
  difficulty: puzzle.difficulty,
  parMoves: puzzle.parMoves,
  codeBudget: puzzle.parMoves,
  sourceType: 'OFFICIAL_PUZZLE',
  worldId,
  officialPuzzleId: puzzle.id,
});

export const buildOfficialAssignmentOptions = () =>
  curriculumWorlds.map((world) => ({
    worldId: world.id,
    worldTitle: world.title,
    puzzles: world.puzzles.map((puzzle) => buildOfficialRoomManifestItem(world.id, puzzle)),
  }));

const cloneTeacherBlockTemplate = (block: ITeacherBlockTemplate): IBlockTemplate => {
  if (block.kind === 'REPEAT') {
    return createRepeatBlockTemplate(
      block.repeatCount,
      block.loopBody.map(cloneTeacherBlockTemplate),
    );
  }

  if (block.kind === 'WHILE') {
    return createWhileBlockTemplate(
      block.condition as GameCondition,
      block.loopBody.map(cloneTeacherBlockTemplate),
    );
  }

  if (block.kind === 'FUNCTION_DEF') {
    return createFunctionDefinitionBlockTemplate(
      block.functionName,
      block.functionBody.map(cloneTeacherBlockTemplate),
    );
  }

  if (block.kind === 'FUNCTION_CALL') {
    return createFunctionCallBlockTemplate(block.functionName);
  }

  return {
    ...block,
  } as IBlockTemplate;
};

export const customRoomToPuzzleDefinition = (
  roomVersion: ITeacherRoomVersion,
): IPuzzleDefinition => ({
  id: roomVersion.id,
  title: roomVersion.title,
  lesson: roomVersion.lessonTag,
  difficulty: roomVersion.difficulty,
  parMoves: roomVersion.parMoves,
  objective: roomVersion.objective,
  rows: roomVersion.definition.rows,
  cols: roomVersion.definition.cols,
  start: roomVersion.definition.start,
  door: roomVersion.definition.door,
  key: roomVersion.definition.key ?? undefined,
  doorRequiresKey: roomVersion.definition.doorRequiresKey,
  walls: roomVersion.definition.walls,
  availableBlocks: roomVersion.definition.availableBlocks.map(cloneTeacherBlockTemplate),
  requiredConcepts: roomVersion.definition.requiredConcepts as ProgramRequirement[] | undefined,
});

export const resolveAssignmentManifestToPuzzles = (input: {
  manifest: IRoomManifestItem[];
  customRoom: ITeacherRoomVersion | null;
}) => {
  const officialPuzzlesById = new Map(
    curriculumWorlds.flatMap((world) =>
      world.puzzles.map((puzzle) => [puzzle.id, puzzle] as const),
    ),
  );

  return input.manifest
    .map((item) => {
      if (item.sourceType === 'CUSTOM_ROOM') {
        if (!input.customRoom || input.customRoom.id !== item.customRoomVersionId) {
          return null;
        }

        return customRoomToPuzzleDefinition(input.customRoom);
      }

      return officialPuzzlesById.get(item.officialPuzzleId ?? item.roomKey) ?? null;
    })
    .filter((puzzle): puzzle is IPuzzleDefinition => Boolean(puzzle));
};
