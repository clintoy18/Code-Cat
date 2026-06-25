import { useEffect } from 'react';
import { Button } from '@/components/ui';
import {
  curriculumWorlds,
  playableWorlds,
} from '@/features/game/data/curriculumRoadmap';
import type { IPuzzleDefinition } from '@/features/game/engine';
import { useGame } from '@/hooks/useGame';
import { useNavigate } from 'react-router-dom';
import { AssignedClassroomGameplays } from './AssignedClassroomGameplays';

const scaffoldedWorlds = curriculumWorlds.filter(
  (world) => world.status === 'scaffolded',
);

export const LevelSelect = () => {
  const navigate = useNavigate();
  const {
    officialPuzzles,
    loadPuzzle,
    unlockedPuzzleIds,
    completedPuzzleIds,
    startOfficialSession,
  } = useGame();

  useEffect(() => {
    startOfficialSession();
  }, [startOfficialSession]);

  const completedCount = completedPuzzleIds.length;
  const nextPuzzle =
    officialPuzzles.find(
      (puzzle) =>
        unlockedPuzzleIds.includes(puzzle.id) &&
        !completedPuzzleIds.includes(puzzle.id),
    ) ?? officialPuzzles[0] ?? null;
  const puzzleIndexById = new Map(
    officialPuzzles.map((puzzle, index) => [puzzle.id, index + 1]),
  );

  const openPuzzle = (puzzleId: string, assignmentId?: string) => {
    if (assignmentId) {
      navigate(`/gameplay/${puzzleId}?assignmentId=${assignmentId}`);
      return;
    }

    loadPuzzle(puzzleId);
    navigate(`/gameplay/${puzzleId}`);
  };

  const renderLevelCard = (puzzle: IPuzzleDefinition) => {
    const isUnlocked = unlockedPuzzleIds.includes(puzzle.id);
    const isCompleted = completedPuzzleIds.includes(puzzle.id);
    const isNext = puzzle.id === nextPuzzle?.id && !isCompleted;

    return (
      <article
        key={puzzle.id}
        className={`level-card ${isUnlocked ? 'level-card--unlocked' : 'level-card--locked'} ${isCompleted ? 'level-card--completed' : ''} ${isNext ? 'level-card--next' : ''}`}
      >
        <div className="level-card__header">
          <div>
            <p className="level-card__eyebrow">
              Level {puzzleIndexById.get(puzzle.id) ?? '?'}
            </p>
            <h3 className="level-card__title">{puzzle.title}</h3>
          </div>
          <span
            className={`level-badge ${isCompleted ? 'level-badge--completed' : isUnlocked ? 'level-badge--open' : 'level-badge--locked'}`}
          >
            {isCompleted ? 'Cleared' : isUnlocked ? 'Unlocked' : 'Locked'}
          </span>
        </div>

        <div className="level-card__meta">
          <span>{puzzle.lesson}</span>
          <span>{puzzle.difficulty}</span>
          <span>Par {puzzle.parMoves}</span>
        </div>

        <p className="level-card__objective">{puzzle.objective}</p>

        <div className="level-card__footer">
          <div className="level-card__track">
            <span
              className={`level-dot ${isCompleted ? 'level-dot--completed' : isUnlocked ? 'level-dot--open' : 'level-dot--locked'}`}
            />
            <span>
              {isNext
                ? 'Recommended next room'
                : isCompleted
                  ? 'Completed and replayable'
                  : isUnlocked
                    ? 'Ready to play'
                    : 'Unlock the previous room first'}
            </span>
          </div>
          <Button
            className={
              isCompleted ? 'pixel-button pixel-button--ghost' : 'pixel-button'
            }
            variant={isCompleted ? 'ghost' : 'primary'}
            disabled={!isUnlocked}
            onClick={(event) => {
              event.stopPropagation();
              openPuzzle(puzzle.id);
            }}
          >
            {isCompleted
              ? 'Replay Level'
              : isUnlocked
                ? 'Play Level'
                : 'Locked'}
          </Button>
        </div>
      </article>
    );
  };

  return (
    <div className="pixel-page space-y-6">
      <section className="mission-brief">
        <div className="mission-brief__copy">
          <p className="mission-brief__eyebrow">Level Map</p>
          <h1 className="mission-brief__title">
            Pick the next room and keep climbing.
          </h1>
          <p className="mission-brief__objective">
            Start the highlighted room, or replay any cleared level to tighten
            your route, helper use, state checks, and par-budget finishes.
          </p>
        </div>
        <div className="mission-brief__stats">
          <div className="mission-stat">
            <span className="mission-stat__label">Levels Cleared</span>
            <span className="mission-stat__value">
              {completedCount}/{officialPuzzles.length}
            </span>
          </div>
          <div className="mission-stat">
            <span className="mission-stat__label">Unlocked</span>
            <span className="mission-stat__value">
              {unlockedPuzzleIds.length}
            </span>
          </div>
          <div className="mission-stat">
            <span className="mission-stat__label">Worlds Live</span>
            <span className="mission-stat__value">{playableWorlds.length}</span>
          </div>
          <div className="mission-stat">
            <span className="mission-stat__label">Next Room</span>
            <span className="mission-stat__value">
              {nextPuzzle ? puzzleIndexById.get(nextPuzzle.id) : '-'}
            </span>
          </div>
        </div>
      </section>

      {nextPuzzle ? (
        <section className="level-continue">
          <div className="level-continue__copy">
            <p className="pixel-kicker">Continue</p>
            <h2 className="pixel-panel__title">Recommended next room</h2>
            <p className="level-continue__body">
              Jump straight into the next required level, then return here to
              revisit any cleared rooms.
            </p>
          </div>
          <div className="level-continue__card">
            {renderLevelCard(nextPuzzle)}
          </div>
        </section>
      ) : null}

      <AssignedClassroomGameplays />

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="pixel-kicker">Playable Worlds</p>
            <h2 className="pixel-panel__title">Current progression</h2>
          </div>
          <span className="game-chip">
            {completedCount}/
            {playableWorlds.reduce(
              (count, world) => count + world.puzzles.length,
              0,
            )}{' '}
            cleared
          </span>
        </div>

        {playableWorlds.map((world) => {
          const worldPuzzles = world.puzzles
            .map((worldPuzzle) =>
              officialPuzzles.find((puzzle) => puzzle.id === worldPuzzle.id),
            )
            .filter((puzzle): puzzle is IPuzzleDefinition => Boolean(puzzle));

          return (
            <section key={world.id} className="level-world">
              <div className="level-world__header">
                <div>
                  <p className="level-world__eyebrow">
                    World {world.order} / {world.shortLabel}
                  </p>
                  <h3 className="level-world__title">{world.title}</h3>
                  <p className="level-world__description">{world.description}</p>
                </div>
                <div className="level-world__summary">
                  <span className="game-chip">{world.focus.join(' / ')}</span>
                  <span className="game-chip">
                    {worldPuzzles.length} levels
                  </span>
                </div>
              </div>

              <section className="level-map">
                {worldPuzzles.map((puzzle) => renderLevelCard(puzzle))}
              </section>
            </section>
          );
        })}
      </section>

      {scaffoldedWorlds.length ? (
        <section className="level-comingSoon">
          <div className="level-comingSoon__header">
            <div>
              <p className="pixel-kicker">Coming Soon</p>
              <h2 className="pixel-panel__title">Future worlds</h2>
            </div>
            <span className="game-chip">
              {scaffoldedWorlds.length} scaffolded
            </span>
          </div>
          <div className="level-comingSoon__grid">
            {scaffoldedWorlds.map((world) => (
              <article key={world.id} className="world-card">
                <div className="world-card__header">
                  <div>
                    <p className="world-card__eyebrow">World {world.order}</p>
                    <h3 className="world-card__title">{world.title}</h3>
                  </div>
                  <span className="world-card__status">Coming Soon</span>
                </div>
                <p className="world-card__description">{world.description}</p>
                <div className="world-card__chips">
                  {world.focus.map((topic) => (
                    <span key={topic}>{topic}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};
