export type GameStatus = 'idle' | 'ready' | 'running' | 'success' | 'error';
export type MoveDirection = 'UP' | 'RIGHT' | 'DOWN' | 'LEFT';
export type BlockKind = 'MOVE' | 'CONDITIONAL' | 'REPEAT' | 'WHILE';
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
export type ProgramRequirement = 'MULTI_LINE_LOOP_BODY' | 'WHILE_LOOP' | 'NESTED_LOOP';
export type GameCondition =
  | 'PATH_UP_CLEAR'
  | 'PATH_RIGHT_CLEAR'
  | 'PATH_DOWN_CLEAR'
  | 'PATH_LEFT_CLEAR'
  | 'DOOR_UP'
  | 'DOOR_RIGHT'
  | 'DOOR_DOWN'
  | 'DOOR_LEFT';

export interface IPosition {
  row: number;
  col: number;
}

interface IBlockBase {
  key: string;
  label: string;
  kind: BlockKind;
}

export interface IMoveBlockTemplate extends IBlockBase {
  kind: 'MOVE';
  move: MoveDirection;
}

export interface IConditionalBlockTemplate extends IBlockBase {
  kind: 'CONDITIONAL';
  condition: GameCondition;
  action: MoveDirection;
}

export interface IRepeatBlockTemplate extends IBlockBase {
  kind: 'REPEAT';
  repeatCount: number;
  loopBody: IBlockTemplate[];
}

export interface IWhileBlockTemplate extends IBlockBase {
  kind: 'WHILE';
  condition: GameCondition;
  loopBody: IBlockTemplate[];
}

export type IBlockTemplate =
  | IMoveBlockTemplate
  | IConditionalBlockTemplate
  | IRepeatBlockTemplate
  | IWhileBlockTemplate;

export type IProgramBlock = IBlockTemplate & { id: string };

export interface IPuzzleDefinition {
  id: string;
  title: string;
  lesson: LessonTopic;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  parMoves: number;
  objective: string;
  rows: number;
  cols: number;
  start: IPosition;
  door: IPosition;
  walls: IPosition[];
  availableBlocks: IBlockTemplate[];
  requiredConcepts?: ProgramRequirement[];
}

export interface IGameEngineSnapshot {
  puzzle: IPuzzleDefinition | null;
  program: IProgramBlock[];
  catPosition: IPosition | null;
  visited: IPosition[];
  status: GameStatus;
  log: string[];
  stepIndex: number;
  didReachDoor: boolean;
}

interface IBlockExecutionResult {
  success: boolean;
  position: IPosition;
  didReachDoor: boolean;
}

interface IExecutionState {
  log: string[];
  visited: IPosition[];
  stepsExecuted: number;
}

type EngineListener = (snapshot: IGameEngineSnapshot) => void;

const MAX_EXECUTION_STEPS = 128;
const MAX_WHILE_ITERATIONS = 32;

const directionVectors: Record<MoveDirection, IPosition> = {
  UP: { row: -1, col: 0 },
  RIGHT: { row: 0, col: 1 },
  DOWN: { row: 1, col: 0 },
  LEFT: { row: 0, col: -1 },
};

const conditionDirectionMap: Record<GameCondition, MoveDirection> = {
  PATH_UP_CLEAR: 'UP',
  PATH_RIGHT_CLEAR: 'RIGHT',
  PATH_DOWN_CLEAR: 'DOWN',
  PATH_LEFT_CLEAR: 'LEFT',
  DOOR_UP: 'UP',
  DOOR_RIGHT: 'RIGHT',
  DOOR_DOWN: 'DOWN',
  DOOR_LEFT: 'LEFT',
};

const conditionTokenMap: Record<GameCondition, string> = {
  PATH_UP_CLEAR: 'pathUpClear',
  PATH_RIGHT_CLEAR: 'pathRightClear',
  PATH_DOWN_CLEAR: 'pathDownClear',
  PATH_LEFT_CLEAR: 'pathLeftClear',
  DOOR_UP: 'doorUp',
  DOOR_RIGHT: 'doorRight',
  DOOR_DOWN: 'doorDown',
  DOOR_LEFT: 'doorLeft',
};

const requirementCopyMap: Record<ProgramRequirement, string> = {
  MULTI_LINE_LOOP_BODY: 'a loop body with two or more commands',
  WHILE_LOOP: 'at least one while loop',
  NESTED_LOOP: 'a loop nested inside another loop',
};

const clonePosition = (position: IPosition): IPosition => ({
  row: position.row,
  col: position.col,
});

export const cloneBlockTemplate = (block: IBlockTemplate): IBlockTemplate => {
  if (block.kind === 'REPEAT') {
    return {
      ...block,
      loopBody: block.loopBody.map((entry) => cloneBlockTemplate(entry)),
    };
  }

  if (block.kind === 'WHILE') {
    return {
      ...block,
      loopBody: block.loopBody.map((entry) => cloneBlockTemplate(entry)),
    };
  }

  return { ...block };
};

const positionsMatch = (first: IPosition, second: IPosition) =>
  first.row === second.row && first.col === second.col;

export const isRepeatBlock = (block: IBlockTemplate | IProgramBlock): block is IRepeatBlockTemplate => block.kind === 'REPEAT';
export const isWhileBlock = (block: IBlockTemplate | IProgramBlock): block is IWhileBlockTemplate => block.kind === 'WHILE';
export const isLoopBlock = (block: IBlockTemplate | IProgramBlock): block is IRepeatBlockTemplate | IWhileBlockTemplate =>
  block.kind === 'REPEAT' || block.kind === 'WHILE';
export const isActionBlock = (
  block: IBlockTemplate | IProgramBlock,
): block is IMoveBlockTemplate | IConditionalBlockTemplate => block.kind === 'MOVE' || block.kind === 'CONDITIONAL';

export const formatConditionToken = (condition: GameCondition) => conditionTokenMap[condition];

export const parseConditionToken = (value: string) => {
  const normalizedValue = value.trim().replace(/\s+/g, '');

  return (
    (Object.entries(conditionTokenMap).find(([, token]) => token.toLowerCase() === normalizedValue.toLowerCase())?.[0] as
      | GameCondition
      | undefined) ?? null
  );
};

export const createRepeatBlockTemplate = (repeatCount: number, loopBody: IBlockTemplate[] = []): IRepeatBlockTemplate => ({
  key: `repeat-${repeatCount}`,
  label: `repeat(${repeatCount})`,
  kind: 'REPEAT',
  repeatCount,
  loopBody,
});

export const createWhileBlockTemplate = (condition: GameCondition, loopBody: IBlockTemplate[] = []): IWhileBlockTemplate => ({
  key: `while-${formatConditionToken(condition)}`,
  label: `while (${formatConditionToken(condition)})`,
  kind: 'WHILE',
  condition,
  loopBody,
});

export const analyzeProgramRequirements = (blocks: Array<IBlockTemplate | IProgramBlock>) =>
  blocks.reduce(
    (state, block) => {
      if (block.kind === 'WHILE') {
        state.hasWhileLoop = true;
      }

      if (isLoopBlock(block)) {
        if (block.loopBody.length > 1) {
          state.hasMultiLineLoopBody = true;
        }

        if (block.loopBody.some((entry) => isLoopBlock(entry))) {
          state.hasNestedLoop = true;
        }

        const childState = analyzeProgramRequirements(block.loopBody);
        state.hasWhileLoop = state.hasWhileLoop || childState.hasWhileLoop;
        state.hasMultiLineLoopBody = state.hasMultiLineLoopBody || childState.hasMultiLineLoopBody;
        state.hasNestedLoop = state.hasNestedLoop || childState.hasNestedLoop;
      }

      return state;
    },
    {
      hasWhileLoop: false,
      hasMultiLineLoopBody: false,
      hasNestedLoop: false,
    },
  );

export const getMissingProgramRequirements = (
  blocks: Array<IBlockTemplate | IProgramBlock>,
  requirements: ProgramRequirement[] = [],
) => {
  const analysis = analyzeProgramRequirements(blocks);

  return requirements.filter((requirement) => {
    if (requirement === 'MULTI_LINE_LOOP_BODY') {
      return !analysis.hasMultiLineLoopBody;
    }

    if (requirement === 'WHILE_LOOP') {
      return !analysis.hasWhileLoop;
    }

    return !analysis.hasNestedLoop;
  });
};

const withChildLabel = (prefix: string, child: IBlockTemplate) => `${prefix} -> ${child.label}`;

export class GameEngine {
  private listeners = new Set<EngineListener>();

  private blockSequence = 0;

  private snapshot: IGameEngineSnapshot = {
    puzzle: null,
    program: [],
    catPosition: null,
    visited: [],
    status: 'idle',
    log: ['Select a puzzle to begin.'],
    stepIndex: 0,
    didReachDoor: false,
  };

  getSnapshot() {
    return this.snapshot;
  }

  subscribe(listener: EngineListener) {
    this.listeners.add(listener);
    listener(this.snapshot);

    return () => {
      this.listeners.delete(listener);
    };
  }

  loadPuzzle(puzzle: IPuzzleDefinition) {
    this.snapshot = {
      puzzle,
      program: [],
      catPosition: clonePosition(puzzle.start),
      visited: [clonePosition(puzzle.start)],
      status: 'ready',
      log: [`Puzzle loaded: ${puzzle.title}. Reach the door.`],
      stepIndex: 0,
      didReachDoor: false,
    };
    this.emit();
  }

  appendBlock(template: IBlockTemplate) {
    if (!this.snapshot.puzzle) {
      return;
    }

    this.snapshot = {
      ...this.snapshot,
      program: [
        ...this.snapshot.program,
        {
          ...cloneBlockTemplate(template),
          id: `block-${this.blockSequence++}`,
        },
      ],
      status: 'ready',
    };
    this.emit();
  }

  replaceProgram(templates: IBlockTemplate[]) {
    if (!this.snapshot.puzzle) {
      return;
    }

    this.snapshot = {
      ...this.snapshot,
      program: templates.map((template) => ({
        ...cloneBlockTemplate(template),
        id: `block-${this.blockSequence++}`,
      })),
      status: 'ready',
    };
    this.emit();
  }

  removeBlock(blockId: string) {
    this.snapshot = {
      ...this.snapshot,
      program: this.snapshot.program.filter((block) => block.id !== blockId),
      status: this.snapshot.puzzle ? 'ready' : 'idle',
    };
    this.emit();
  }

  clearProgram() {
    this.snapshot = {
      ...this.snapshot,
      program: [],
      status: this.snapshot.puzzle ? 'ready' : 'idle',
      log: this.snapshot.puzzle ? ['Program cleared. Build a new solution.'] : ['Select a puzzle to begin.'],
      catPosition: this.snapshot.puzzle ? clonePosition(this.snapshot.puzzle.start) : null,
      visited: this.snapshot.puzzle ? [clonePosition(this.snapshot.puzzle.start)] : [],
      stepIndex: 0,
      didReachDoor: false,
    };
    this.emit();
  }

  resetPuzzle() {
    if (!this.snapshot.puzzle) {
      return;
    }

    this.snapshot = {
      ...this.snapshot,
      catPosition: clonePosition(this.snapshot.puzzle.start),
      visited: [clonePosition(this.snapshot.puzzle.start)],
      status: 'ready',
      log: [`Reset ${this.snapshot.puzzle.title}. Ready to run again.`],
      stepIndex: 0,
      didReachDoor: false,
    };
    this.emit();
  }

  run() {
    if (!this.snapshot.puzzle) {
      return this.snapshot;
    }

    if (!this.snapshot.program.length) {
      this.snapshot = {
        ...this.snapshot,
        status: 'error',
        log: ['Add at least one block before running the puzzle.'],
      };
      this.emit();
      return this.snapshot;
    }

    const missingRequirements = getMissingProgramRequirements(
      this.snapshot.program,
      this.snapshot.puzzle.requiredConcepts ?? [],
    );

    if (missingRequirements.length) {
      this.snapshot = {
        ...this.snapshot,
        status: 'error',
        log: [
          `This room expects ${missingRequirements.map((requirement) => requirementCopyMap[requirement]).join(', ')}.`,
          'Revise the route so it uses the lesson mechanic before running again.',
        ],
      };
      this.emit();
      return this.snapshot;
    }

    const puzzle = this.snapshot.puzzle;
    const executionState: IExecutionState = {
      visited: [clonePosition(puzzle.start)],
      log: [`Running ${puzzle.title}...`],
      stepsExecuted: 0,
    };
    let catPosition = clonePosition(puzzle.start);
    let status: GameStatus = 'running';
    let didReachDoor = false;

    for (const block of this.snapshot.program) {
      if (status !== 'running') {
        break;
      }

      const execution = this.executeBlock(puzzle, catPosition, block, block.label, executionState);
      catPosition = execution.position;

      if (!execution.success) {
        status = 'error';
        break;
      }

      if (execution.didReachDoor) {
        status = 'success';
        didReachDoor = true;
        break;
      }
    }

    if (!didReachDoor && status === 'running') {
      status = 'error';
      executionState.log.push('Program ended before the cat reached the door.');
    }

    this.snapshot = {
      puzzle,
      program: this.snapshot.program,
      catPosition,
      visited: executionState.visited,
      status,
      log: executionState.log,
      stepIndex: executionState.stepsExecuted,
      didReachDoor,
    };
    this.emit();

    return this.snapshot;
  }

  private executeBlock(
    puzzle: IPuzzleDefinition,
    catPosition: IPosition,
    block: IBlockTemplate | IProgramBlock,
    label: string,
    executionState: IExecutionState,
  ): IBlockExecutionResult {
    const guardResult = this.bumpExecutionCount(label, executionState, catPosition);

    if (!guardResult.success) {
      return guardResult;
    }

    if (block.kind === 'MOVE' || block.kind === 'CONDITIONAL') {
      return this.executeActionBlock(puzzle, catPosition, block, label, executionState);
    }

    if (!block.loopBody.length) {
      executionState.log.push(`${label}: loop body is empty.`);
      return {
        success: false,
        position: catPosition,
        didReachDoor: false,
      };
    }

    if (block.kind === 'REPEAT') {
      if (!Number.isInteger(block.repeatCount) || block.repeatCount < 2) {
        executionState.log.push(`${label}: repeat count must be at least 2.`);
        return {
          success: false,
          position: catPosition,
          didReachDoor: false,
        };
      }

      executionState.log.push(`${label}: repeating ${block.repeatCount} times.`);

      let nextPosition = catPosition;

      for (let iteration = 0; iteration < block.repeatCount; iteration += 1) {
        for (const child of block.loopBody) {
          const execution = this.executeBlock(
            puzzle,
            nextPosition,
            child,
            withChildLabel(`${label} [${iteration + 1}/${block.repeatCount}]`, child),
            executionState,
          );

          nextPosition = execution.position;

          if (!execution.success || execution.didReachDoor) {
            return execution;
          }
        }
      }

      return {
        success: true,
        position: nextPosition,
        didReachDoor: positionsMatch(nextPosition, puzzle.door),
      };
    }

    executionState.log.push(`${label}: looping while ${formatConditionToken(block.condition)}.`);

    let nextPosition = catPosition;

    for (let iteration = 0; iteration < MAX_WHILE_ITERATIONS; iteration += 1) {
      if (!this.evaluateCondition(puzzle, nextPosition, block.condition)) {
        if (iteration === 0) {
          executionState.log.push(`${label}: condition was false, loop skipped.`);
        } else {
          executionState.log.push(`${label}: condition turned false after ${iteration} iterations.`);
        }

        return {
          success: true,
          position: nextPosition,
          didReachDoor: positionsMatch(nextPosition, puzzle.door),
        };
      }

      const iterationStart = clonePosition(nextPosition);

      for (const child of block.loopBody) {
        const execution = this.executeBlock(
          puzzle,
          nextPosition,
          child,
          withChildLabel(`${label} [${iteration + 1}]`, child),
          executionState,
        );

        nextPosition = execution.position;

        if (!execution.success || execution.didReachDoor) {
          return execution;
        }
      }

      if (positionsMatch(iterationStart, nextPosition) && this.evaluateCondition(puzzle, nextPosition, block.condition)) {
        executionState.log.push(`${label}: loop made no progress while the condition remained true.`);
        return {
          success: false,
          position: nextPosition,
          didReachDoor: false,
        };
      }
    }

    executionState.log.push(`${label}: exceeded the safe loop limit of ${MAX_WHILE_ITERATIONS} iterations.`);
    return {
      success: false,
      position: nextPosition,
      didReachDoor: false,
    };
  }

  private executeActionBlock(
    puzzle: IPuzzleDefinition,
    catPosition: IPosition,
    block: IMoveBlockTemplate | IConditionalBlockTemplate,
    label: string,
    executionState: IExecutionState,
  ): IBlockExecutionResult {
    if (block.kind === 'MOVE') {
      const moveResult = this.tryMove(puzzle, catPosition, block.move);

      if (!moveResult.success) {
        executionState.log.push(`${label}: ${moveResult.message}`);
        return {
          success: false,
          position: catPosition,
          didReachDoor: false,
        };
      }

      executionState.visited.push(clonePosition(moveResult.position));
      executionState.log.push(`${label}: cat moved ${block.move.toLowerCase()}.`);

      if (positionsMatch(moveResult.position, puzzle.door)) {
        executionState.log.push('Success: the cat reached the door.');
      }

      return {
        success: true,
        position: moveResult.position,
        didReachDoor: positionsMatch(moveResult.position, puzzle.door),
      };
    }

    const passed = this.evaluateCondition(puzzle, catPosition, block.condition);

    if (!passed) {
      executionState.log.push(`${label}: condition was false, action skipped.`);
      return {
        success: true,
        position: catPosition,
        didReachDoor: positionsMatch(catPosition, puzzle.door),
      };
    }

    const moveResult = this.tryMove(puzzle, catPosition, block.action);

    if (!moveResult.success) {
      executionState.log.push(`${label}: ${moveResult.message}`);
      return {
        success: false,
        position: catPosition,
        didReachDoor: false,
      };
    }

    executionState.visited.push(clonePosition(moveResult.position));
    executionState.log.push(`${label}: condition passed, action executed.`);

    if (positionsMatch(moveResult.position, puzzle.door)) {
      executionState.log.push('Success: the cat reached the door.');
    }

    return {
      success: true,
      position: moveResult.position,
      didReachDoor: positionsMatch(moveResult.position, puzzle.door),
    };
  }

  private bumpExecutionCount(label: string, executionState: IExecutionState, catPosition: IPosition): IBlockExecutionResult {
    executionState.stepsExecuted += 1;

    if (executionState.stepsExecuted <= MAX_EXECUTION_STEPS) {
      return {
        success: true,
        position: catPosition,
        didReachDoor: false,
      };
    }

    executionState.log.push(`${label}: execution exceeded the safe step limit of ${MAX_EXECUTION_STEPS}.`);

    return {
      success: false,
      position: catPosition,
      didReachDoor: false,
    };
  }

  private evaluateCondition(puzzle: IPuzzleDefinition, catPosition: IPosition, condition: GameCondition) {
    const direction = conditionDirectionMap[condition];
    const nextPosition = this.getNextPosition(catPosition, direction);

    if (condition.startsWith('PATH_')) {
      return this.isInsideGrid(puzzle, nextPosition) && !this.isWall(puzzle, nextPosition);
    }

    return positionsMatch(nextPosition, puzzle.door);
  }

  private tryMove(puzzle: IPuzzleDefinition, catPosition: IPosition, direction: MoveDirection) {
    const nextPosition = this.getNextPosition(catPosition, direction);

    if (!this.isInsideGrid(puzzle, nextPosition)) {
      return {
        success: false as const,
        message: `move${direction[0]}${direction.slice(1).toLowerCase()}() would leave the grid.`,
      };
    }

    if (this.isWall(puzzle, nextPosition)) {
      return {
        success: false as const,
        message: `move${direction[0]}${direction.slice(1).toLowerCase()}() hit a wall.`,
      };
    }

    return {
      success: true as const,
      position: nextPosition,
    };
  }

  private getNextPosition(position: IPosition, direction: MoveDirection) {
    const vector = directionVectors[direction];

    return {
      row: position.row + vector.row,
      col: position.col + vector.col,
    };
  }

  private isInsideGrid(puzzle: IPuzzleDefinition, position: IPosition) {
    return position.row >= 0 && position.row < puzzle.rows && position.col >= 0 && position.col < puzzle.cols;
  }

  private isWall(puzzle: IPuzzleDefinition, position: IPosition) {
    return puzzle.walls.some((wall) => positionsMatch(wall, position));
  }

  private emit() {
    this.listeners.forEach((listener) => listener(this.snapshot));
  }
}
