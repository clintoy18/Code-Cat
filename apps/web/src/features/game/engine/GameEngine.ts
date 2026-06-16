export type GameStatus = 'idle' | 'ready' | 'running' | 'success' | 'error';
export type MoveDirection = 'UP' | 'RIGHT' | 'DOWN' | 'LEFT';
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

export interface IBlockTemplate {
  key: string;
  label: string;
  kind: 'MOVE' | 'CONDITIONAL';
  move?: MoveDirection;
  condition?: GameCondition;
  action?: MoveDirection;
}

export interface IProgramBlock extends IBlockTemplate {
  id: string;
}

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

type EngineListener = (snapshot: IGameEngineSnapshot) => void;

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

const clonePosition = (position: IPosition): IPosition => ({
  row: position.row,
  col: position.col,
});

const positionsMatch = (first: IPosition, second: IPosition) =>
  first.row === second.row && first.col === second.col;

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
          ...template,
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
        ...template,
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

    const puzzle = this.snapshot.puzzle;
    let catPosition = clonePosition(puzzle.start);
    const visited = [clonePosition(puzzle.start)];
    const log: string[] = [`Running ${puzzle.title}...`];
    let status: GameStatus = 'running';
    let didReachDoor = false;
    let stepIndex = 0;

    for (const block of this.snapshot.program) {
      if (status === 'error' || status === 'success') {
        break;
      }

      stepIndex += 1;

      if (block.kind === 'MOVE' && block.move) {
        const moveResult = this.tryMove(puzzle, catPosition, block.move);

        if (!moveResult.success) {
          status = 'error';
          log.push(`${block.label}: ${moveResult.message}`);
          break;
        }

        catPosition = moveResult.position;
        visited.push(clonePosition(catPosition));
        log.push(`${block.label}: cat moved ${block.move.toLowerCase()}.`);
      }

      if (block.kind === 'CONDITIONAL' && block.condition && block.action) {
        const passed = this.evaluateCondition(puzzle, catPosition, block.condition);

        if (!passed) {
          log.push(`${block.label}: condition was false, action skipped.`);
          continue;
        }

        const moveResult = this.tryMove(puzzle, catPosition, block.action);

        if (!moveResult.success) {
          status = 'error';
          log.push(`${block.label}: ${moveResult.message}`);
          break;
        }

        catPosition = moveResult.position;
        visited.push(clonePosition(catPosition));
        log.push(`${block.label}: condition passed, action executed.`);
      }

      if (positionsMatch(catPosition, puzzle.door)) {
        status = 'success';
        didReachDoor = true;
        log.push('Success: the cat reached the door.');
      }
    }

    if (!didReachDoor && status !== 'error') {
      status = 'error';
      log.push('Program ended before the cat reached the door.');
    }

    this.snapshot = {
      puzzle,
      program: this.snapshot.program,
      catPosition,
      visited,
      status,
      log,
      stepIndex,
      didReachDoor,
    };
    this.emit();

    return this.snapshot;
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
