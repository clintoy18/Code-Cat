import { useEffect, useRef, useState, type DragEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Cat, Grid } from '@/components/game';
import { Button } from '@/components/ui';
import { gameAudio } from '@/features/game/audio/gameAudio';
import {
  cloneBlockTemplate,
  createRepeatBlockTemplate,
  createWhileBlockTemplate,
  formatConditionToken,
  isBodyBlock,
  isFunctionDefinitionBlock,
  parseProgramCode,
  serializeProgramToCode,
  type GameCondition,
  type IBlockTemplate,
  type IGameEngineSnapshot,
  type IPosition,
  type IPuzzleDefinition,
  type IProgramBlock,
} from '@/features/game/engine';
import { useGame } from '@/hooks/useGame';
import { useSettingsStore } from '@/store/settingsStore';

const MOVE_INTERVAL_MS = 420;
const RESULT_DELAY_MS = 180;

type TBlockPath = number[];
type TRenderableBlock = IBlockTemplate | IProgramBlock;
type TResultPopup = {
  tone: 'success' | 'error';
  title: string;
  body: string;
};
type TPaletteDragPayload =
  | {
      kind: 'ACTION';
      key: string;
    }
  | {
      kind: 'REPEAT';
    }
  | {
      kind: 'WHILE';
    }
  | {
      kind: 'FUNCTION_DEF';
      key: string;
    }
  | {
      kind: 'FUNCTION_CALL';
      key: string;
    };

const PALETTE_DRAG_DATA_KEY = 'application/x-codecat-palette-block';

const clonePosition = (position: IPosition | null) =>
  position
    ? {
        row: position.row,
        col: position.col,
      }
    : null;

const getPuzzleByOffset = (
  puzzles: IPuzzleDefinition[],
  activePuzzleId: string | null,
  offset: number,
) => {
  const currentIndex = puzzles.findIndex(
    (entry) => entry.id === activePuzzleId,
  );

  if (currentIndex < 0) {
    return null;
  }

  return puzzles[currentIndex + offset] ?? null;
};

const stripProgramIds = (blocks: IProgramBlock[]) =>
  blocks.map((block) => cloneBlockTemplate(block));

const getBlockBody = (block: TRenderableBlock) => {
  if (!isBodyBlock(block)) {
    return null;
  }

  return isFunctionDefinitionBlock(block) ? block.functionBody : block.loopBody;
};

const getBodyAtPath = (blocks: TRenderableBlock[], path: TBlockPath) => {
  let currentBody: TRenderableBlock[] = blocks;

  for (const index of path) {
    const nextBlock = currentBody[index];
    const nextBody = nextBlock ? getBlockBody(nextBlock) : null;

    if (!nextBlock || !nextBody) {
      return null;
    }

    currentBody = nextBody;
  }

  return currentBody;
};

const getBlockAtPath = (blocks: TRenderableBlock[], path: TBlockPath) => {
  if (!path.length) {
    return null;
  }

  const parentBody = getBodyAtPath(blocks, path.slice(0, -1));

  if (!parentBody) {
    return null;
  }

  return parentBody[path[path.length - 1]] ?? null;
};

const countProgramBlocks = (blocks: TRenderableBlock[]): number =>
  blocks.reduce(
    (total, block) => total + 1 + countProgramBlocks(getBlockBody(block) ?? []),
    0,
  );

const formatBlockPath = (path: TBlockPath) =>
  path.length ? path.map((segment) => segment + 1).join('.') : 'root';

const isSamePath = (left: TBlockPath, right: TBlockPath) =>
  left.length === right.length &&
  left.every((segment, index) => segment === right[index]);

const hasPathPrefix = (path: TBlockPath, prefix: TBlockPath) =>
  prefix.length <= path.length &&
  prefix.every((segment, index) => segment === path[index]);

const getBlockHeader = (block: TRenderableBlock) => {
  if (block.kind === 'REPEAT') {
    return `repeat(${block.repeatCount}) {`;
  }

  if (block.kind === 'WHILE') {
    return `while (${formatConditionToken(block.condition)}) {`;
  }

  if (block.kind === 'FUNCTION_DEF') {
    return `function ${block.functionName}() {`;
  }

  return block.label;
};

export const Gameplay = () => {
  const navigate = useNavigate();
  const { puzzleId: routePuzzleId } = useParams<{ puzzleId: string }>();
  const {
    puzzles,
    activePuzzleId,
    completedPuzzleIds,
    unlockedPuzzleIds,
    puzzle,
    program,
    catPosition,
    visited,
    status,
    log,
    replaceProgram,
    clearProgram,
    runProgram,
    resetPuzzle,
    loadPuzzle,
  } = useGame();
  const volume = useSettingsStore((state) => state.volume);
  const [animatedCatPosition, setAnimatedCatPosition] =
    useState<IPosition | null>(clonePosition(catPosition));
  const [animatedVisited, setAnimatedVisited] = useState<IPosition[]>(visited);
  const [isPlaybackRunning, setIsPlaybackRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editorMode, setEditorMode] = useState<'blocks' | 'code'>('blocks');
  const [codeDraft, setCodeDraft] = useState('');
  const [codeErrors, setCodeErrors] = useState<string[]>([]);
  const [insertPath, setInsertPath] = useState<TBlockPath>([]);
  const [recentlyAddedPath, setRecentlyAddedPath] = useState<TBlockPath | null>(
    null,
  );
  const [draggedPaletteItem, setDraggedPaletteItem] =
    useState<TPaletteDragPayload | null>(null);
  const [isRouteDropTargetActive, setIsRouteDropTargetActive] = useState(false);
  const [loopRepeatCount, setLoopRepeatCount] = useState(2);
  const [whileCondition, setWhileCondition] = useState<GameCondition | null>(
    null,
  );
  const [resultPopup, setResultPopup] = useState<TResultPopup | null>(null);
  const playbackTimeoutsRef = useRef<number[]>([]);
  const gameplayShellRef = useRef<HTMLDivElement | null>(null);
  const terminalBodyRef = useRef<HTMLDivElement | null>(null);
  const routeDropDepthRef = useRef(0);
  const previousDisplayStatusRef = useRef(status);
  const routePuzzle = routePuzzleId
    ? (puzzles.find((entry) => entry.id === routePuzzleId) ?? null)
    : null;

  const currentPuzzleIndex = puzzles.findIndex(
    (entry) => entry.id === activePuzzleId,
  );
  const currentLevelNumber =
    currentPuzzleIndex >= 0 ? currentPuzzleIndex + 1 : 1;
  const nextPuzzle = getPuzzleByOffset(puzzles, activePuzzleId, 1);
  const clearedCount = completedPuzzleIds.length;
  const commandCount = countProgramBlocks(program);
  const visitedCount = Math.max(0, animatedVisited.length - 1);
  const nextPuzzleUnlocked = nextPuzzle
    ? unlockedPuzzleIds.includes(nextPuzzle.id)
    : false;
  const actionBlocks =
    puzzle?.availableBlocks.filter(
      (block) => block.kind === 'MOVE' || block.kind === 'CONDITIONAL',
    ) ?? [];
  const helperDefinitionBlocks =
    puzzle?.availableBlocks.filter(isFunctionDefinitionBlock) ?? [];
  const helperCallBlocks =
    puzzle?.availableBlocks.filter(
      (block): block is Extract<IBlockTemplate, { kind: 'FUNCTION_CALL' }> =>
        block.kind === 'FUNCTION_CALL',
    ) ?? [];
  const repeatEnabled =
    puzzle?.availableBlocks.some((block) => block.kind === 'REPEAT') ?? false;
  const whileEnabled =
    puzzle?.availableBlocks.some((block) => block.kind === 'WHILE') ?? false;
  const structureBlocksEnabled =
    repeatEnabled || whileEnabled || helperDefinitionBlocks.length > 0;
  const whileConditions = Array.from(
    new Set(
      actionBlocks
        .filter(
          (block): block is Extract<IBlockTemplate, { kind: 'CONDITIONAL' }> =>
            block.kind === 'CONDITIONAL',
        )
        .map((block) => block.condition),
    ),
  );
  const selectedBodyBlock = insertPath.length
    ? getBlockAtPath(program, insertPath)
    : null;
  const recentlyAddedBlock = recentlyAddedPath
    ? getBlockAtPath(program, recentlyAddedPath)
    : null;
  const repeatPaletteLabel = repeatEnabled
    ? `repeat(${loopRepeatCount}) { ... }`
    : 'repeat(...) locked';
  const whilePaletteLabel =
    whileEnabled && whileCondition
      ? `while (${formatConditionToken(whileCondition)}) { ... }`
      : 'while(...) locked';
  const codeModePlaceholder = helperDefinitionBlocks.length
    ? `function ${helperDefinitionBlocks[0].functionName}() {\n  moveUp()\n  moveRight()\n}\n\n${helperDefinitionBlocks[0].functionName}()`
    : `repeat(2) {\n  moveUp()\n  moveRight()\n}\nwhile (pathUpClear) {\n  moveUp()\n}`;
  const statusLabelMap = {
    ready: 'Awaiting run',
    running: 'Executing route',
    success: 'Door reached',
    error: 'Route failed',
    idle: 'No puzzle selected',
  } as const;
  const displayStatus = isPlaybackRunning ? 'running' : status;

  const clearPlaybackTimers = () => {
    playbackTimeoutsRef.current.forEach((timeoutId) =>
      window.clearTimeout(timeoutId),
    );
    playbackTimeoutsRef.current = [];
  };

  useEffect(
    () => () => {
      clearPlaybackTimers();
    },
    [],
  );

  useEffect(() => {
    if (!routePuzzleId || !puzzles.length) {
      return;
    }

    if (!routePuzzle) {
      navigate('/levels', { replace: true });
      return;
    }

    if (!unlockedPuzzleIds.includes(routePuzzle.id)) {
      const fallbackPuzzleId =
        puzzles.find(
          (entry) =>
            unlockedPuzzleIds.includes(entry.id) &&
            !completedPuzzleIds.includes(entry.id),
        )?.id ??
        puzzles.find((entry) => unlockedPuzzleIds.includes(entry.id))?.id ??
        null;

      navigate(fallbackPuzzleId ? `/gameplay/${fallbackPuzzleId}` : '/levels', {
        replace: true,
      });
      return;
    }

    if (activePuzzleId !== routePuzzle.id) {
      loadPuzzle(routePuzzle.id);
    }
  }, [
    activePuzzleId,
    completedPuzzleIds,
    loadPuzzle,
    navigate,
    puzzles,
    routePuzzle,
    routePuzzleId,
    unlockedPuzzleIds,
  ]);

  useEffect(() => {
    if (!isPlaybackRunning) {
      setAnimatedCatPosition(clonePosition(catPosition));
      setAnimatedVisited(visited);
    }
  }, [catPosition, visited, isPlaybackRunning, puzzle?.id]);

  useEffect(() => {
    setCodeDraft(serializeProgramToCode(program));
  }, [program, puzzle?.id]);

  useEffect(() => {
    setEditorMode('blocks');
    setCodeErrors([]);
    setLoopRepeatCount(2);
    setInsertPath([]);
    setRecentlyAddedPath(null);
    setDraggedPaletteItem(null);
    setIsRouteDropTargetActive(false);
    routeDropDepthRef.current = 0;
  }, [puzzle?.id]);

  useEffect(() => {
    if (!whileConditions.length) {
      setWhileCondition(null);
      return;
    }

    if (!whileCondition || !whileConditions.includes(whileCondition)) {
      setWhileCondition(whileConditions[0]);
    }
  }, [whileCondition, whileConditions]);

  useEffect(() => {
    if (insertPath.length && !getBodyAtPath(program, insertPath)) {
      setInsertPath([]);
    }
  }, [insertPath, program]);

  useEffect(() => {
    if (!recentlyAddedPath) {
      return;
    }

    const terminalBody = terminalBodyRef.current;

    if (!terminalBody) {
      return;
    }

    const target = terminalBody.querySelector<HTMLElement>(
      `[data-block-path="${formatBlockPath(recentlyAddedPath)}"]`,
    );

    if (!target) {
      return;
    }

    target.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [program, recentlyAddedPath]);

  useEffect(() => {
    if (puzzle?.id) {
      setResultPopup(null);
    }
  }, [puzzle?.id]);

  useEffect(() => {
    const previousStatus = previousDisplayStatusRef.current;

    if (previousStatus !== displayStatus && !isPlaybackRunning) {
      if (displayStatus === 'success') {
        setResultPopup({
          tone: 'success',
          title: 'Room Cleared',
          body: nextPuzzle
            ? `The cat reached the door. Next up: ${nextPuzzle.title}.`
            : 'The cat reached the door. All current playable rooms are complete.',
        });
      }

      if (displayStatus === 'error') {
        setResultPopup({
          tone: 'error',
          title: 'Route Failed',
          body:
            log[log.length - 1] &&
            log[log.length - 1] !==
              'Program ended before the cat reached the door.'
              ? log[log.length - 1]
              : 'The route did not solve the room. Adjust the program and try again.',
        });
      }
    }

    previousDisplayStatusRef.current = displayStatus;
  }, [displayStatus, isPlaybackRunning, log, nextPuzzle]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === gameplayShellRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const playRun = (snapshot: IGameEngineSnapshot) => {
    clearPlaybackTimers();
    gameAudio.prime();

    if (!snapshot.program.length || snapshot.visited.length <= 1) {
      setAnimatedCatPosition(clonePosition(snapshot.catPosition));
      setAnimatedVisited(snapshot.visited);

      if (snapshot.status === 'success') {
        gameAudio.playSuccess(volume);
      } else if (snapshot.status === 'error') {
        gameAudio.playError(volume);
      }

      setIsPlaybackRunning(false);
      return;
    }

    setIsPlaybackRunning(true);
    setAnimatedCatPosition(clonePosition(snapshot.visited[0]));
    setAnimatedVisited([snapshot.visited[0]]);

    snapshot.visited.slice(1).forEach((position, index) => {
      const timeoutId = window.setTimeout(
        () => {
          setAnimatedCatPosition(clonePosition(position));
          setAnimatedVisited(snapshot.visited.slice(0, index + 2));
          gameAudio.playStep(volume);
        },
        MOVE_INTERVAL_MS * (index + 1),
      );

      playbackTimeoutsRef.current.push(timeoutId);
    });

    const resultTimeoutId = window.setTimeout(
      () => {
        setAnimatedCatPosition(clonePosition(snapshot.catPosition));
        setAnimatedVisited(snapshot.visited);
        setIsPlaybackRunning(false);

        if (snapshot.status === 'success') {
          gameAudio.playSuccess(volume);
        } else if (snapshot.status === 'error') {
          gameAudio.playError(volume);
        }
      },
      MOVE_INTERVAL_MS * Math.max(1, snapshot.visited.length - 1) +
        RESULT_DELAY_MS,
    );

    playbackTimeoutsRef.current.push(resultTimeoutId);
  };

  const handleApplyCode = () => {
    if (!puzzle) {
      return false;
    }

    const parseResult = parseProgramCode(codeDraft, puzzle);

    if (!parseResult.success) {
      setCodeErrors(parseResult.errors);
      return false;
    }

    replaceProgram(parseResult.blocks);
    setInsertPath([]);
    setCodeErrors([]);
    return true;
  };

  const handleRunProgram = () => {
    if (editorMode === 'code' && !handleApplyCode()) {
      return;
    }

    const snapshot = runProgram();
    playRun(snapshot);
  };

  const handleToggleFullscreen = async () => {
    if (!gameplayShellRef.current) {
      return;
    }

    if (document.fullscreenElement === gameplayShellRef.current) {
      await document.exitFullscreen();
      return;
    }

    await gameplayShellRef.current.requestFullscreen();
  };

  const handleClearProgram = () => {
    clearProgram();
    setCodeDraft('');
    setCodeErrors([]);
    setInsertPath([]);
    setRecentlyAddedPath(null);
    setDraggedPaletteItem(null);
    setIsRouteDropTargetActive(false);
    routeDropDepthRef.current = 0;
    setResultPopup(null);
  };

  const handleSwitchEditorMode = (nextMode: 'blocks' | 'code') => {
    setEditorMode(nextMode);
    setCodeErrors([]);

    if (nextMode === 'code') {
      setCodeDraft(serializeProgramToCode(program));
    }
  };

  const loadAndPlayPuzzle = (nextTargetPuzzle: IPuzzleDefinition) => {
    loadPuzzle(nextTargetPuzzle.id);
    navigate(`/gameplay/${nextTargetPuzzle.id}`);
  };

  const addBlockToInsertTarget = (
    buildBlock: () => IBlockTemplate,
    options?: { selectInsertedBody?: boolean },
  ) => {
    const nextProgram = stripProgramIds(program);
    const targetBody = getBodyAtPath(nextProgram, insertPath);

    if (!targetBody) {
      setInsertPath([]);
      return false;
    }

    const nextIndex = targetBody.length;
    const nextPath = [...insertPath, nextIndex];

    targetBody.push(buildBlock());
    replaceProgram(nextProgram);
    setRecentlyAddedPath(nextPath);

    if (options?.selectInsertedBody) {
      setInsertPath(nextPath);
    }

    return true;
  };

  const handleAddActionBlock = (block: IBlockTemplate) => {
    addBlockToInsertTarget(() => cloneBlockTemplate(block));
  };

  const handleAddRepeatBlock = () => {
    addBlockToInsertTarget(
      () => createRepeatBlockTemplate(loopRepeatCount, []),
      { selectInsertedBody: true },
    );
  };

  const handleAddWhileBlock = () => {
    if (!whileCondition) {
      return;
    }

    addBlockToInsertTarget(() => createWhileBlockTemplate(whileCondition, []), {
      selectInsertedBody: true,
    });
  };

  const handleAddFunctionDefinitionBlock = (
    block: Extract<IBlockTemplate, { kind: 'FUNCTION_DEF' }>,
  ) => {
    addBlockToInsertTarget(() => cloneBlockTemplate(block), {
      selectInsertedBody: true,
    });
  };

  const handleAddFunctionCallBlock = (
    block: Extract<IBlockTemplate, { kind: 'FUNCTION_CALL' }>,
  ) => {
    addBlockToInsertTarget(() => cloneBlockTemplate(block));
  };

  const resolvePalettePayload = (payload: TPaletteDragPayload) => {
    if (payload.kind === 'ACTION') {
      return actionBlocks.find((block) => block.key === payload.key) ?? null;
    }

    if (payload.kind === 'REPEAT') {
      return repeatEnabled
        ? createRepeatBlockTemplate(loopRepeatCount, [])
        : null;
    }

    if (payload.kind === 'WHILE') {
      return whileEnabled && whileCondition
        ? createWhileBlockTemplate(whileCondition, [])
        : null;
    }

    return null;
  };

  const applyPalettePayload = (payload: TPaletteDragPayload) => {
    if (payload.kind === 'ACTION') {
      const actionBlock = actionBlocks.find(
        (block) => block.key === payload.key,
      );

      if (!actionBlock) {
        return false;
      }

      return addBlockToInsertTarget(() => cloneBlockTemplate(actionBlock));
    }

    if (payload.kind === 'FUNCTION_DEF') {
      const helperDefinitionBlock = helperDefinitionBlocks.find(
        (block) => block.key === payload.key,
      );

      if (!helperDefinitionBlock) {
        return false;
      }

      return addBlockToInsertTarget(
        () => cloneBlockTemplate(helperDefinitionBlock),
        { selectInsertedBody: true },
      );
    }

    if (payload.kind === 'FUNCTION_CALL') {
      const helperCallBlock = helperCallBlocks.find(
        (block) => block.key === payload.key,
      );

      if (!helperCallBlock) {
        return false;
      }

      return addBlockToInsertTarget(() => cloneBlockTemplate(helperCallBlock));
    }

    const resolvedBlock = resolvePalettePayload(payload);

    if (!resolvedBlock) {
      return false;
    }

    return addBlockToInsertTarget(() => resolvedBlock, {
      selectInsertedBody:
        resolvedBlock.kind === 'REPEAT' || resolvedBlock.kind === 'WHILE',
    });
  };

  const readPalettePayload = (
    event: Pick<DragEvent<HTMLElement>, 'dataTransfer'>,
  ) => {
    const payloadJson = event.dataTransfer.getData(PALETTE_DRAG_DATA_KEY);

    if (!payloadJson) {
      return draggedPaletteItem;
    }

    try {
      return JSON.parse(payloadJson) as TPaletteDragPayload;
    } catch {
      return draggedPaletteItem;
    }
  };

  const handlePaletteDragStart =
    (payload: TPaletteDragPayload) => (event: DragEvent<HTMLButtonElement>) => {
      setDraggedPaletteItem(payload);
      setIsRouteDropTargetActive(true);
      routeDropDepthRef.current = 0;
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData(
        PALETTE_DRAG_DATA_KEY,
        JSON.stringify(payload),
      );
      event.dataTransfer.setData('text/plain', payload.kind);
    };

  const handlePaletteDragEnd = () => {
    setDraggedPaletteItem(null);
    setIsRouteDropTargetActive(false);
    routeDropDepthRef.current = 0;
  };

  const handleRouteDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (!readPalettePayload(event) || isPlaybackRunning) {
      return;
    }

    routeDropDepthRef.current += 1;
    setIsRouteDropTargetActive(true);
  };

  const handleRouteDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!readPalettePayload(event) || isPlaybackRunning) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsRouteDropTargetActive(true);
  };

  const handleRouteDragLeave = () => {
    routeDropDepthRef.current = Math.max(0, routeDropDepthRef.current - 1);

    if (routeDropDepthRef.current === 0) {
      setIsRouteDropTargetActive(false);
    }
  };

  const handleRouteDrop = (event: DragEvent<HTMLDivElement>) => {
    const payload = readPalettePayload(event);

    routeDropDepthRef.current = 0;
    setIsRouteDropTargetActive(false);
    setDraggedPaletteItem(null);

    if (!payload || isPlaybackRunning) {
      return;
    }

    event.preventDefault();
    applyPalettePayload(payload);
  };

  const handleRemoveProgramBlock = (path: TBlockPath) => {
    const nextProgram = stripProgramIds(program);

    if (path.length === 1) {
      nextProgram.splice(path[0], 1);
    } else {
      const parentBody = getBodyAtPath(nextProgram, path.slice(0, -1));

      if (!parentBody) {
        return;
      }

      parentBody.splice(path[path.length - 1], 1);
    }

    replaceProgram(nextProgram);

    if (hasPathPrefix(insertPath, path)) {
      setInsertPath([]);
    }

    if (recentlyAddedPath && hasPathPrefix(recentlyAddedPath, path)) {
      setRecentlyAddedPath(null);
    }
  };

  const renderProgramBlocks = (
    blocks: TRenderableBlock[],
    parentPath: TBlockPath = [],
    depth = 0,
  ): JSX.Element[] =>
    blocks.flatMap((block, index) => {
      const blockPath = [...parentPath, index];
      const isSelectedTarget = isSamePath(insertPath, blockPath);
      const isRecentlyAdded = recentlyAddedPath
        ? isSamePath(recentlyAddedPath, blockPath)
        : false;
      const headerLine = (
        <div
          key={`${formatBlockPath(blockPath)}-header`}
          data-block-path={formatBlockPath(blockPath)}
          className={`gameplay-focus__terminalLine ${isSelectedTarget || isRecentlyAdded ? 'gameplay-focus__terminalLine--active' : ''} ${isRecentlyAdded ? 'gameplay-focus__terminalLine--new' : ''}`}
          style={{ marginLeft: `${depth * 18}px` }}
        >
          <span className="gameplay-focus__terminalLineNo">
            {formatBlockPath(blockPath)}
          </span>
          <code className="gameplay-focus__terminalCode">
            {getBlockHeader(block)}
          </code>
          <div className="gameplay-focus__terminalActions">
            {isBodyBlock(block) && !isPlaybackRunning ? (
              <button
                type="button"
                className={`gameplay-focus__terminalTarget ${isSelectedTarget ? 'gameplay-focus__terminalTarget--active' : ''}`}
                onClick={() => setInsertPath(blockPath)}
              >
                add inside
              </button>
            ) : null}
            {isPlaybackRunning ? null : (
              <button
                type="button"
                className="gameplay-focus__terminalRemove"
                onClick={() => handleRemoveProgramBlock(blockPath)}
              >
                remove
              </button>
            )}
          </div>
        </div>
      );

      const childBody = getBlockBody(block);

      if (!childBody) {
        return [headerLine];
      }

      const childLines = childBody.length
        ? renderProgramBlocks(childBody, blockPath, depth + 1)
        : [
            <div
              key={`${formatBlockPath(blockPath)}-empty`}
              className="gameplay-focus__terminalBranchEmpty"
              style={{ marginLeft: `${(depth + 1) * 18}px` }}
            >
              {isFunctionDefinitionBlock(block)
                ? 'Helper body is empty. Add commands inside this helper.'
                : 'Loop body is empty. Add commands inside this block.'}
            </div>,
          ];

      const closingLine = (
        <div
          key={`${formatBlockPath(blockPath)}-close`}
          className="gameplay-focus__terminalLine gameplay-focus__terminalLine--ghost"
          style={{ marginLeft: `${depth * 18}px` }}
        >
          <span className="gameplay-focus__terminalLineNo">
            {formatBlockPath(blockPath)}
          </span>
          <code className="gameplay-focus__terminalCode">{'}'}</code>
          <span />
        </div>
      );

      return [headerLine, ...childLines, closingLine];
    });

  if (!puzzle || (routePuzzleId && puzzle.id !== routePuzzleId)) {
    const isRouteSyncPending = Boolean(
      routePuzzleId && routePuzzle && puzzle?.id !== routePuzzleId,
    );

    return (
      <div className="glass-panel m-6 p-6">
        <p className="text-sm text-slate-700">
          {isRouteSyncPending
            ? 'Loading the selected level...'
            : 'Select a puzzle first from the levels page.'}
        </p>
        {isRouteSyncPending ? null : (
          <Button className="mt-4" onClick={() => navigate('/levels')}>
            Open Level Map
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={gameplayShellRef}
      className={`pixel-page gameplay-focus ${isFullscreen ? 'gameplay-focus--fullscreen' : ''}`}
    >
      <header className="gameplay-focus__header">
        <div className="gameplay-focus__titleBlock">
          <p className="gameplay-focus__eyebrow">Live Puzzle</p>
          <h1 className="gameplay-focus__title">
            Level {currentLevelNumber}: {puzzle.title}
          </h1>
          <p className="gameplay-focus__subtitle">{puzzle.objective}</p>
        </div>
        <div className="gameplay-focus__headerStats">
          <span className="game-chip">Lesson: {puzzle.lesson}</span>
          <span className="game-chip">Par: {puzzle.parMoves}</span>
          <span className="game-chip">Difficulty: {puzzle.difficulty}</span>
          <span
            className={`game-chip ${displayStatus === 'success' ? 'game-chip--success' : ''}`}
          >
            {statusLabelMap[displayStatus]}
          </span>
        </div>
        <div className="gameplay-focus__headerActions">
          <Button
            variant="ghost"
            className="pixel-button pixel-button--ghost"
            onClick={() => navigate('/levels')}
          >
            Level Map
          </Button>
          <Button
            variant="secondary"
            className="pixel-button pixel-button--secondary"
            onClick={handleToggleFullscreen}
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </Button>
        </div>
      </header>

      <div className="gameplay-focus__body">
        <section className="gameplay-focus__boardPane">
          <div className="gameplay-focus__workspace">
            <div className="gameplay-focus__boardShell">
              <Grid
                puzzle={puzzle}
                catPosition={animatedCatPosition}
                visited={animatedVisited}
                status={displayStatus}
              />
              {resultPopup ? (
                <div
                  className="gameplay-result-popup"
                  role="alertdialog"
                  aria-live="assertive"
                  aria-label={resultPopup.title}
                >
                  <div
                    className={`gameplay-result-popup__card gameplay-result-popup__card--${resultPopup.tone}`}
                  >
                    <div className="gameplay-result-popup__copy">
                      <p className="gameplay-result-popup__eyebrow">
                        {resultPopup.tone === 'success'
                          ? 'Success'
                          : 'Try Again'}
                      </p>
                      <h2 className="gameplay-result-popup__title">
                        {resultPopup.title}
                      </h2>
                      <p className="gameplay-result-popup__body">
                        {resultPopup.body}
                      </p>
                    </div>
                    <div className="gameplay-result-popup__actions">
                      {resultPopup.tone === 'success' &&
                      nextPuzzle &&
                      nextPuzzleUnlocked ? (
                        <Button
                          className="pixel-button"
                          onClick={() => loadAndPlayPuzzle(nextPuzzle)}
                        >
                          Play Next
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        className="pixel-button pixel-button--ghost arcade-button arcade-button--soft"
                        onClick={() => {
                          resetPuzzle();
                          setResultPopup(null);
                        }}
                      >
                        Reset
                      </Button>
                      <Button
                        variant="ghost"
                        className="pixel-button pixel-button--ghost arcade-button arcade-button--soft"
                        onClick={() => setResultPopup(null)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <section className="arcade-panel p-5 gameplay-focus__terminalPanel">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-700">
                    Code Terminal
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-bold text-[var(--color-ink)]">
                    Build the route
                  </h2>
                </div>
                <span className="game-chip">{commandCount} blocks</span>
              </div>

              <div className="gameplay-focus__terminalMode mt-4">
                <button
                  type="button"
                  className={`terminal-mode__toggle ${editorMode === 'blocks' ? 'terminal-mode__toggle--active' : ''}`}
                  onClick={() => handleSwitchEditorMode('blocks')}
                >
                  Click Mode
                </button>
                <button
                  type="button"
                  className={`terminal-mode__toggle ${editorMode === 'code' ? 'terminal-mode__toggle--active' : ''}`}
                  onClick={() => handleSwitchEditorMode('code')}
                >
                  Code Mode
                </button>
              </div>

              <div className="gameplay-focus__terminalEditor mt-4">
                <div className="gameplay-focus__terminalHeader">
                  <span>
                    {editorMode === 'blocks' ? 'route.cat' : 'route.cat.ts'}
                  </span>
                  <span>
                    {commandCount ? `${commandCount} blocks` : 'empty'}
                  </span>
                </div>

                {editorMode === 'blocks' ? (
                  <div
                    className={`gameplay-focus__terminalStack ${isRouteDropTargetActive ? 'gameplay-focus__terminalStack--dropTarget' : ''}`}
                    onDragEnter={handleRouteDragEnter}
                    onDragOver={handleRouteDragOver}
                    onDragLeave={handleRouteDragLeave}
                    onDrop={handleRouteDrop}
                  >
                    <div className="gameplay-focus__terminalFunctions">
                      {actionBlocks.map((block) => (
                        <button
                          key={block.key}
                          type="button"
                          draggable={!isPlaybackRunning}
                          disabled={isPlaybackRunning}
                          onDragStart={handlePaletteDragStart({
                            kind: 'ACTION',
                            key: block.key,
                          })}
                          onDragEnd={handlePaletteDragEnd}
                          onClick={() => handleAddActionBlock(block)}
                          className={`palette-block ${isPlaybackRunning ? 'palette-block--disabled' : ''} ${draggedPaletteItem?.kind === 'ACTION' && draggedPaletteItem.key === block.key ? 'palette-block--dragging' : ''}`}
                        >
                          <span className="palette-block__kind">
                            {block.kind === 'MOVE' ? 'MOVE' : 'IF'}
                          </span>
                          <span className="palette-block__label">
                            {block.label}
                          </span>
                        </button>
                      ))}
                      {helperCallBlocks.map((block) => (
                        <button
                          key={block.key}
                          type="button"
                          draggable={!isPlaybackRunning}
                          disabled={isPlaybackRunning}
                          onDragStart={handlePaletteDragStart({
                            kind: 'FUNCTION_CALL',
                            key: block.key,
                          })}
                          onDragEnd={handlePaletteDragEnd}
                          onClick={() => handleAddFunctionCallBlock(block)}
                          className={`palette-block ${isPlaybackRunning ? 'palette-block--disabled' : ''} ${draggedPaletteItem?.kind === 'FUNCTION_CALL' && draggedPaletteItem.key === block.key ? 'palette-block--dragging' : ''}`}
                        >
                          <span className="palette-block__kind">CALL</span>
                          <span className="palette-block__label">
                            {block.label}
                          </span>
                        </button>
                      ))}
                      {helperDefinitionBlocks.map((block) => (
                        <button
                          key={block.key}
                          type="button"
                          draggable={!isPlaybackRunning}
                          disabled={isPlaybackRunning}
                          onDragStart={handlePaletteDragStart({
                            kind: 'FUNCTION_DEF',
                            key: block.key,
                          })}
                          onDragEnd={handlePaletteDragEnd}
                          onClick={() =>
                            handleAddFunctionDefinitionBlock(block)
                          }
                          className={`palette-block ${isPlaybackRunning ? 'palette-block--disabled' : ''} ${draggedPaletteItem?.kind === 'FUNCTION_DEF' && draggedPaletteItem.key === block.key ? 'palette-block--dragging' : ''}`}
                        >
                          <span className="palette-block__kind">DEF</span>
                          <span className="palette-block__label">{`function ${block.functionName}() { ... }`}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        draggable={!isPlaybackRunning && repeatEnabled}
                        disabled={isPlaybackRunning || !repeatEnabled}
                        onDragStart={handlePaletteDragStart({ kind: 'REPEAT' })}
                        onDragEnd={handlePaletteDragEnd}
                        onClick={handleAddRepeatBlock}
                        className={`palette-block ${isPlaybackRunning || !repeatEnabled ? 'palette-block--disabled' : ''} ${draggedPaletteItem?.kind === 'REPEAT' ? 'palette-block--dragging' : ''}`}
                      >
                        <span className="palette-block__kind">LOOP</span>
                        <span className="palette-block__label">
                          {repeatPaletteLabel}
                        </span>
                      </button>
                      <button
                        type="button"
                        draggable={
                          !isPlaybackRunning && whileEnabled && !!whileCondition
                        }
                        disabled={
                          isPlaybackRunning || !whileEnabled || !whileCondition
                        }
                        onDragStart={handlePaletteDragStart({ kind: 'WHILE' })}
                        onDragEnd={handlePaletteDragEnd}
                        onClick={handleAddWhileBlock}
                        className={`palette-block ${isPlaybackRunning || !whileEnabled || !whileCondition ? 'palette-block--disabled' : ''} ${draggedPaletteItem?.kind === 'WHILE' ? 'palette-block--dragging' : ''}`}
                      >
                        <span className="palette-block__kind">WHILE</span>
                        <span className="palette-block__label">
                          {whilePaletteLabel}
                        </span>
                      </button>
                    </div>

                    {(!repeatEnabled ||
                      !whileEnabled ||
                      helperDefinitionBlocks.length > 0) &&
                    structureBlocksEnabled ? (
                      <p className="gameplay-focus__loopAvailability">
                        {helperDefinitionBlocks.length &&
                        !repeatEnabled &&
                        !whileEnabled
                          ? 'This room focuses on helper functions. Add a helper definition, click add inside, then call it from the main route.'
                          : repeatEnabled && !whileEnabled
                            ? 'This room teaches repeat loops only. While loops unlock in later loop lessons.'
                            : !repeatEnabled && whileEnabled
                              ? 'This room teaches while loops only. Repeat loops are not part of this puzzle.'
                              : helperDefinitionBlocks.length
                                ? 'Helper functions can be mixed with loops here. Select a loop or helper line to keep building inside it.'
                                : 'This room does not support loop blocks yet. Open a World 3 puzzle to use repeat and while loops.'}
                      </p>
                    ) : null}

                    {structureBlocksEnabled ? (
                      <div className="gameplay-focus__loopBuilder">
                        <div className="gameplay-focus__loopHeader">
                          <div>
                            <p className="pixel-kicker">
                              {helperDefinitionBlocks.length
                                ? 'Structure Tools'
                                : 'Loop Tools'}
                            </p>
                            <p className="gameplay-focus__loopCopy">
                              {helperDefinitionBlocks.length
                                ? 'Build helper bodies and loop bodies directly in the program tree. Select any helper or loop line to insert nested steps inside it.'
                                : 'Build loop bodies directly in the program tree. Select any loop line to insert nested steps inside it.'}
                            </p>
                          </div>
                          <span className="game-chip">
                            {helperDefinitionBlocks.length
                              ? 'World 4 live'
                              : 'World 3 live'}
                          </span>
                        </div>

                        <div className="gameplay-focus__loopTargetRow">
                          <span className="game-chip">
                            Insert into{' '}
                            {insertPath.length
                              ? `${formatBlockPath(insertPath)} body`
                              : 'route.cat'}
                          </span>
                          {insertPath.length ? (
                            <button
                              type="button"
                              className="gameplay-focus__terminalTarget"
                              onClick={() => setInsertPath([])}
                              disabled={isPlaybackRunning}
                            >
                              back to root
                            </button>
                          ) : null}
                        </div>

                        {repeatEnabled ? (
                          <div className="gameplay-focus__loopSection">
                            <div className="gameplay-focus__loopCounts">
                              {[2, 3, 4, 5].map((count) => (
                                <button
                                  key={count}
                                  type="button"
                                  className={`loop-count ${loopRepeatCount === count ? 'loop-count--active' : ''}`}
                                  onClick={() => setLoopRepeatCount(count)}
                                  disabled={isPlaybackRunning}
                                >
                                  x{count}
                                </button>
                              ))}
                            </div>
                            <div className="gameplay-focus__loopFooter">
                              <code>{`repeat(${loopRepeatCount}) { ... }`}</code>
                              <Button
                                variant="ghost"
                                className="pixel-button pixel-button--ghost arcade-button arcade-button--soft"
                                onClick={handleAddRepeatBlock}
                                disabled={isPlaybackRunning}
                              >
                                Add Repeat
                              </Button>
                            </div>
                          </div>
                        ) : null}

                        {whileEnabled ? (
                          <div className="gameplay-focus__loopSection">
                            <div className="gameplay-focus__loopActions">
                              {whileConditions.map((condition) => (
                                <button
                                  key={condition}
                                  type="button"
                                  className={`loop-action ${whileCondition === condition ? 'loop-action--active' : ''}`}
                                  onClick={() => setWhileCondition(condition)}
                                  disabled={isPlaybackRunning}
                                >
                                  {formatConditionToken(condition)}
                                </button>
                              ))}
                            </div>
                            <div className="gameplay-focus__loopFooter">
                              <code>
                                {whileCondition
                                  ? `while (${formatConditionToken(whileCondition)}) { ... }`
                                  : 'No loop condition available.'}
                              </code>
                              <Button
                                variant="ghost"
                                className="pixel-button pixel-button--ghost arcade-button arcade-button--soft"
                                onClick={handleAddWhileBlock}
                                disabled={isPlaybackRunning || !whileCondition}
                              >
                                Add While
                              </Button>
                            </div>
                          </div>
                        ) : null}

                        <div className="gameplay-focus__loopHint">
                          {selectedBodyBlock && isBodyBlock(selectedBodyBlock)
                            ? `Selected body: ${getBlockHeader(selectedBodyBlock)}`
                            : 'Selected body: route.cat'}
                        </div>
                      </div>
                    ) : null}

                    <div className="gameplay-focus__terminalPreview">
                      <span className="gameplay-focus__terminalPreviewLabel">
                        Latest added
                      </span>
                      <code className="gameplay-focus__terminalPreviewCode">
                        {recentlyAddedBlock
                          ? getBlockHeader(recentlyAddedBlock)
                          : 'Click a block to build the route.'}
                      </code>
                      <p className="gameplay-focus__terminalPreviewHint">
                        Drag blocks into this route panel, or click to add them
                        instantly.
                      </p>
                    </div>

                    <div
                      ref={terminalBodyRef}
                      className="gameplay-focus__terminalBody"
                    >
                      {program.length ? (
                        renderProgramBlocks(program)
                      ) : (
                        <div className="gameplay-focus__terminalEmpty">
                          <p className="gameplay-focus__terminalEmptyTitle">
                            No commands in route
                          </p>
                          <p className="gameplay-focus__terminalEmptyBody">
                            Add movement, condition checks, helper functions,
                            and loop blocks to guide the cat to the exit.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="gameplay-focus__codeMode">
                    <textarea
                      value={codeDraft}
                      disabled={isPlaybackRunning}
                      onChange={(event) => setCodeDraft(event.target.value)}
                      className="gameplay-focus__codeInput"
                      spellCheck={false}
                      placeholder={codeModePlaceholder}
                    />
                    <div className="gameplay-focus__codeHelp">
                      <p>
                        Use braces for multi-line loop or helper bodies. When
                        available, helper definitions use
                        <code>{'function name() { ... }'}</code> and can be
                        called like any other command.
                      </p>
                      <Button
                        variant="ghost"
                        className="pixel-button pixel-button--ghost arcade-button arcade-button--soft"
                        onClick={handleApplyCode}
                        disabled={isPlaybackRunning}
                      >
                        Apply Code
                      </Button>
                    </div>
                    {codeErrors.length ? (
                      <div className="gameplay-focus__codeErrors" role="alert">
                        {codeErrors.map((error) => (
                          <p key={error}>{error}</p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="gameplay-focus__actionRow mt-4">
                <Button
                  className="pixel-button arcade-button arcade-button--run"
                  onClick={handleRunProgram}
                  disabled={isPlaybackRunning}
                >
                  Run
                </Button>
                <Button
                  variant="ghost"
                  className="pixel-button pixel-button--ghost arcade-button arcade-button--soft"
                  onClick={resetPuzzle}
                  disabled={isPlaybackRunning}
                >
                  Reset
                </Button>
                <Button
                  variant="ghost"
                  className="pixel-button pixel-button--ghost arcade-button arcade-button--soft"
                  onClick={handleClearProgram}
                  disabled={isPlaybackRunning}
                >
                  Clear
                </Button>
              </div>
            </section>
          </div>
        </section>

        <aside className="gameplay-focus__sidebar">
          <div className="gameplay-focus__sidebarScroll">
            {displayStatus === 'success' ? (
              <section className="success-banner">
                <div>
                  <p className="success-banner__eyebrow">Room Cleared</p>
                  <h2 className="success-banner__title">
                    The cat reached the door.
                  </h2>
                  <p className="success-banner__body">
                    {nextPuzzle
                      ? `Next up: ${nextPuzzle.title}.`
                      : 'All starter rooms are complete. Replay any level or return to the level map.'}
                  </p>
                </div>
                <div className="success-banner__actions">
                  {nextPuzzle && nextPuzzleUnlocked ? (
                    <Button
                      className="pixel-button"
                      onClick={() => loadAndPlayPuzzle(nextPuzzle)}
                    >
                      Play Next
                    </Button>
                  ) : null}
                </div>
              </section>
            ) : null}

            <section className="arcade-panel p-5">
              <div className="gameplay-focus__statusHeader">
                <Cat
                  position={animatedCatPosition}
                  status={statusLabelMap[displayStatus]}
                />
                <span className={`status-pill status-pill--${displayStatus}`}>
                  {statusLabelMap[displayStatus]}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="hud-tile">
                  <span className="hud-tile__label">Queue</span>
                  <span className="hud-tile__value">{commandCount}</span>
                </div>
                <div className="hud-tile">
                  <span className="hud-tile__label">Tiles</span>
                  <span className="hud-tile__value">{visitedCount}</span>
                </div>
                <div className="hud-tile">
                  <span className="hud-tile__label">Difficulty</span>
                  <span className="hud-tile__value">{puzzle.difficulty}</span>
                </div>
                <div className="hud-tile">
                  <span className="hud-tile__label">Progress</span>
                  <span className="hud-tile__value">
                    {clearedCount}/{puzzles.length}
                  </span>
                </div>
              </div>
            </section>

            <section className="arcade-panel p-5 gameplay-focus__logPanel">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-700">
                    Run Feed
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-bold text-[var(--color-ink)]">
                    Execution Log
                  </h2>
                </div>
                <span className="game-chip">
                  {Math.max(0, log.length - 1)} events
                </span>
              </div>
              <div className="gameplay-focus__logList mt-4 space-y-2">
                {log.map((entry, index) => (
                  <div key={`${entry}-${index}`} className="log-entry">
                    <span className="log-entry__index">{index}</span>
                    <span>{entry}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
};
