import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cat, CodeBlock, Grid } from '@/components/game';
import { Button } from '@/components/ui';
import { gameAudio } from '@/features/game/audio/gameAudio';
import type { IGameEngineSnapshot, IPosition, IPuzzleDefinition } from '@/features/game/engine';
import { useGame } from '@/hooks/useGame';
import { useSettingsStore } from '@/store/settingsStore';

const MOVE_INTERVAL_MS = 420;
const RESULT_DELAY_MS = 180;

const clonePosition = (position: IPosition | null) =>
  position
    ? {
        row: position.row,
        col: position.col,
      }
    : null;

const getPuzzleByOffset = (puzzles: IPuzzleDefinition[], activePuzzleId: string | null, offset: number) => {
  const currentIndex = puzzles.findIndex((entry) => entry.id === activePuzzleId);

  if (currentIndex < 0) {
    return null;
  }

  return puzzles[currentIndex + offset] ?? null;
};

export const Gameplay = () => {
  const navigate = useNavigate();
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
    addBlock,
    removeBlock,
    clearProgram,
    runProgram,
    resetPuzzle,
    loadPuzzle,
  } = useGame();
  const volume = useSettingsStore((state) => state.volume);
  const [animatedCatPosition, setAnimatedCatPosition] = useState<IPosition | null>(clonePosition(catPosition));
  const [animatedVisited, setAnimatedVisited] = useState<IPosition[]>(visited);
  const [isPlaybackRunning, setIsPlaybackRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playbackTimeoutsRef = useRef<number[]>([]);
  const gameplayShellRef = useRef<HTMLDivElement | null>(null);

  const currentPuzzleIndex = puzzles.findIndex((entry) => entry.id === activePuzzleId);
  const currentLevelNumber = currentPuzzleIndex >= 0 ? currentPuzzleIndex + 1 : 1;
  const nextPuzzle = getPuzzleByOffset(puzzles, activePuzzleId, 1);
  const clearedCount = completedPuzzleIds.length;
  const commandCount = program.length;
  const visitedCount = Math.max(0, animatedVisited.length - 1);
  const nextPuzzleUnlocked = nextPuzzle ? unlockedPuzzleIds.includes(nextPuzzle.id) : false;
  const statusLabelMap = {
    ready: 'Awaiting run',
    running: 'Executing route',
    success: 'Door reached',
    error: 'Route failed',
    idle: 'No puzzle selected',
  } as const;
  const displayStatus = isPlaybackRunning ? 'running' : status;

  const clearPlaybackTimers = () => {
    playbackTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    playbackTimeoutsRef.current = [];
  };

  useEffect(
    () => () => {
      clearPlaybackTimers();
    },
    [],
  );

  useEffect(() => {
    if (!isPlaybackRunning) {
      setAnimatedCatPosition(clonePosition(catPosition));
      setAnimatedVisited(visited);
    }
  }, [catPosition, visited, isPlaybackRunning, puzzle?.id]);

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
      const timeoutId = window.setTimeout(() => {
        setAnimatedCatPosition(clonePosition(position));
        setAnimatedVisited(snapshot.visited.slice(0, index + 2));
        gameAudio.playStep(volume);
      }, MOVE_INTERVAL_MS * (index + 1));

      playbackTimeoutsRef.current.push(timeoutId);
    });

    const resultTimeoutId = window.setTimeout(() => {
      setAnimatedCatPosition(clonePosition(snapshot.catPosition));
      setAnimatedVisited(snapshot.visited);
      setIsPlaybackRunning(false);

      if (snapshot.status === 'success') {
        gameAudio.playSuccess(volume);
      } else if (snapshot.status === 'error') {
        gameAudio.playError(volume);
      }
    }, MOVE_INTERVAL_MS * Math.max(1, snapshot.visited.length - 1) + RESULT_DELAY_MS);

    playbackTimeoutsRef.current.push(resultTimeoutId);
  };

  const handleRunProgram = () => {
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

  const loadAndPlayPuzzle = (nextTargetPuzzle: IPuzzleDefinition) => {
    loadPuzzle(nextTargetPuzzle.id);
    navigate('/gameplay');
  };

  if (!puzzle) {
    return (
      <div className="glass-panel m-6 p-6">
        <p className="text-sm text-slate-700">Select a puzzle first from the levels page.</p>
        <Button className="mt-4" onClick={() => navigate('/levels')}>
          Open Level Map
        </Button>
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
          <span className={`game-chip ${displayStatus === 'success' ? 'game-chip--success' : ''}`}>
            {statusLabelMap[displayStatus]}
          </span>
        </div>
        <div className="gameplay-focus__headerActions">
          <Button variant="ghost" className="pixel-button pixel-button--ghost" onClick={() => navigate('/levels')}>
            Level Map
          </Button>
          <Button variant="secondary" className="pixel-button pixel-button--secondary" onClick={handleToggleFullscreen}>
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </Button>
        </div>
      </header>

      <div className="gameplay-focus__body">
        <section className="gameplay-focus__boardPane">
          <div className="gameplay-focus__boardShell">
            <Grid puzzle={puzzle} catPosition={animatedCatPosition} visited={animatedVisited} status={displayStatus} />
          </div>
          <div className="gameplay-focus__levelRail">
            {puzzles.map((entry, index) => {
              const isUnlocked = unlockedPuzzleIds.includes(entry.id);
              const isCompleted = completedPuzzleIds.includes(entry.id);
              const isCurrent = entry.id === puzzle.id;

              return (
                <button
                  key={entry.id}
                  type="button"
                  disabled={!isUnlocked || isPlaybackRunning}
                  onClick={() => loadAndPlayPuzzle(entry)}
                  className={`level-rail__node ${isCurrent ? 'level-rail__node--current' : ''} ${isCompleted ? 'level-rail__node--completed' : ''} ${!isUnlocked ? 'level-rail__node--locked' : ''}`}
                >
                  <span className="level-rail__count">{index + 1}</span>
                  <span className="level-rail__name">{entry.title}</span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="gameplay-focus__sidebar">
          <div className="gameplay-focus__sidebarScroll">
            {displayStatus === 'success' ? (
              <section className="success-banner">
                <div>
                  <p className="success-banner__eyebrow">Room Cleared</p>
                  <h2 className="success-banner__title">The cat reached the door.</h2>
                  <p className="success-banner__body">
                    {nextPuzzle
                      ? `Next up: ${nextPuzzle.title}.`
                      : 'All starter rooms are complete. Replay any level or return to the level map.'}
                  </p>
                </div>
                <div className="success-banner__actions">
                  {nextPuzzle && nextPuzzleUnlocked ? (
                    <Button className="pixel-button" onClick={() => loadAndPlayPuzzle(nextPuzzle)}>
                      Play Next
                    </Button>
                  ) : null}
                </div>
              </section>
            ) : null}

            <section className="arcade-panel p-5">
              <div className="flex items-start justify-between gap-4">
                <Cat position={animatedCatPosition} status={statusLabelMap[displayStatus]} />
                <span className={`status-pill status-pill--${displayStatus}`}>{statusLabelMap[displayStatus]}</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
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

            <section className="arcade-panel p-5">
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-700">Command Palette</p>
                <h2 className="font-display text-2xl font-bold text-[var(--color-ink)]">Build the route</h2>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {puzzle.availableBlocks.map((block) => (
                  <button
                    key={block.key}
                    type="button"
                    disabled={isPlaybackRunning}
                    onClick={() => addBlock(block)}
                    className={`palette-block ${isPlaybackRunning ? 'palette-block--disabled' : ''}`}
                  >
                    <span className="palette-block__kind">{block.kind === 'MOVE' ? 'MOVE' : 'IF'}</span>
                    <span className="palette-block__label">{block.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="arcade-panel p-5 gameplay-focus__queuePanel">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-700">Command Queue</p>
                  <h2 className="mt-2 font-display text-2xl font-bold text-[var(--color-ink)]">Program</h2>
                </div>
                <span className="game-chip">{commandCount} blocks</span>
              </div>
              <div className="gameplay-focus__queueList mt-4 space-y-3">
                {program.length ? (
                  program.map((block, index) => (
                    <CodeBlock
                      key={block.id}
                      block={block}
                      index={index}
                      onRemove={isPlaybackRunning ? undefined : removeBlock}
                    />
                  ))
                ) : (
                  <div className="empty-queue">
                    <p className="empty-queue__title">No commands queued</p>
                    <p className="empty-queue__body">Pick blocks from the palette to script a route toward the door.</p>
                  </div>
                )}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
                  onClick={clearProgram}
                  disabled={isPlaybackRunning}
                >
                  Clear
                </Button>
              </div>
            </section>

            <section className="arcade-panel p-5 gameplay-focus__logPanel">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-700">Run Feed</p>
                  <h2 className="mt-2 font-display text-2xl font-bold text-[var(--color-ink)]">Execution Log</h2>
                </div>
                <span className="game-chip">{Math.max(0, log.length - 1)} events</span>
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
