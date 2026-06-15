import { Cat, CodeBlock, Grid } from '@/components/game';
import { Button } from '@/components/ui';
import { useGame } from '@/hooks/useGame';

export const Gameplay = () => {
  const {
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
  } = useGame();

  const commandCount = program.length;
  const visitedCount = Math.max(0, visited.length - 1);
  const statusLabelMap = {
    ready: 'Awaiting run',
    running: 'Executing route',
    success: 'Door reached',
    error: 'Route failed',
    idle: 'No puzzle selected',
  } as const;

  if (!puzzle) {
    return (
      <div className="glass-panel p-6">
        <p className="text-sm text-slate-700">Select a puzzle first from the levels page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="mission-brief">
        <div className="mission-brief__copy">
          <p className="mission-brief__eyebrow">Puzzle Run</p>
          <h1 className="mission-brief__title">{puzzle.title}</h1>
          <p className="mission-brief__objective">{puzzle.objective}</p>
        </div>
        <div className="mission-brief__stats">
          <div className="mission-stat">
            <span className="mission-stat__label">Lesson</span>
            <span className="mission-stat__value">{puzzle.lesson}</span>
          </div>
          <div className="mission-stat">
            <span className="mission-stat__label">Queued Moves</span>
            <span className="mission-stat__value">{commandCount}</span>
          </div>
          <div className="mission-stat">
            <span className="mission-stat__label">Tiles Crossed</span>
            <span className="mission-stat__value">{visitedCount}</span>
          </div>
          <div className="mission-stat">
            <span className="mission-stat__label">Run State</span>
            <span className="mission-stat__value">{statusLabelMap[status]}</span>
          </div>
        </div>
      </section>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <section className="space-y-5">
          <Grid puzzle={puzzle} catPosition={catPosition} visited={visited} status={status} />
          <div className="arcade-panel p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-700">Command Palette</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-[var(--color-ink)]">Build the cat&apos;s route</h2>
              </div>
              <p className="max-w-md text-sm text-slate-600">
                Tap commands in order. Movement blocks teach sequencing. Conditional blocks teach decision-making.
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {puzzle.availableBlocks.map((block) => (
                <button
                  key={block.key}
                  type="button"
                  onClick={() => addBlock(block)}
                  className="palette-block"
                >
                  <span className="palette-block__kind">{block.kind === 'MOVE' ? 'MOVE' : 'IF'}</span>
                  <span className="palette-block__label">{block.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
        <aside className="space-y-5">
          <div className="arcade-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <Cat position={catPosition} status={statusLabelMap[status]} />
              <span className={`status-pill status-pill--${status}`}>{statusLabelMap[status]}</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="hud-tile">
                <span className="hud-tile__label">Program Size</span>
                <span className="hud-tile__value">{commandCount}</span>
              </div>
              <div className="hud-tile">
                <span className="hud-tile__label">Visited</span>
                <span className="hud-tile__value">{visitedCount}</span>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {program.length ? (
                program.map((block, index) => (
                  <CodeBlock key={block.id} block={block} index={index} onRemove={removeBlock} />
                ))
              ) : (
                <div className="empty-queue">
                  <p className="empty-queue__title">No commands queued</p>
                  <p className="empty-queue__body">Pick blocks from the palette to script a route toward the door.</p>
                </div>
              )}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Button className="arcade-button arcade-button--run" onClick={runProgram}>
                Run Route
              </Button>
              <Button variant="ghost" className="arcade-button arcade-button--soft" onClick={resetPuzzle}>
                Reset Board
              </Button>
              <Button variant="ghost" className="arcade-button arcade-button--soft" onClick={clearProgram}>
                Clear Queue
              </Button>
            </div>
          </div>
          <div className="arcade-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-700">Run Feed</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-[var(--color-ink)]">Execution log</h2>
              </div>
              <span className="game-chip">{Math.max(0, log.length - 1)} events</span>
            </div>
            <div className="mt-4 space-y-2">
              {log.map((entry, index) => (
                <div key={`${entry}-${index}`} className="log-entry">
                  <span className="log-entry__index">{index}</span>
                  <span>{entry}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
