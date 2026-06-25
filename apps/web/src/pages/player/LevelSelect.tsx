import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui';
import {
  curriculumWorlds,
  playableWorlds,
} from '@/features/game/data/curriculumRoadmap';
import { useStudentAssignmentsQuery } from '@/features/teacher';
import type { IPuzzleDefinition } from '@/features/game/engine';
import { useGame } from '@/hooks/useGame';
import { useNavigate } from 'react-router-dom';

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
  const studentAssignmentsQuery = useStudentAssignmentsQuery();

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
  const assignmentGroups = useMemo(
    () => studentAssignmentsQuery.data ?? [],
    [studentAssignmentsQuery.data],
  );
  const assignmentCount = assignmentGroups.reduce(
    (total, group) => total + group.assignments.length,
    0,
  );
  const assignedRoomCount = assignmentGroups.reduce(
    (total, group) =>
      total +
      group.assignments.reduce(
        (assignmentTotal, entry) =>
          assignmentTotal + entry.assignment.roomManifest.length,
        0,
      ),
    0,
  );
  const assignmentProgressByKey = useMemo(
    () =>
      new Map(
        assignmentGroups.flatMap((group) =>
          group.assignments.flatMap((entry) =>
            entry.progress.map((progress) => [
              `${entry.assignment.id}:${progress.roomKey}`,
              progress,
            ]),
          ),
        ),
      ),
    [assignmentGroups],
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

      {assignmentGroups.length ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="pixel-kicker">Assigned Rooms</p>
              <h2 className="pixel-panel__title">Teacher classroom work</h2>
              <p className="level-world__description">
                These rooms come from classrooms you are enrolled in. Assigned
                rooms are tracked separately from your base-world progression.
              </p>
            </div>
            <span className="game-chip">
              {assignmentCount} assignments / {assignedRoomCount} rooms
            </span>
          </div>

          {assignmentGroups.map((group) => (
            <section key={group.classroom.id} className="level-world">
              <div className="level-world__header">
                <div>
                  <p className="level-world__eyebrow">Classroom</p>
                  <h3 className="level-world__title">{group.classroom.name}</h3>
                  <p className="level-world__description">
                    {group.classroom.description}
                  </p>
                </div>
                <div className="level-world__summary">
                  <span className="game-chip">
                    {group.assignments.length} assignments
                  </span>
                  <span className="game-chip">
                    Enrolled {new Date(group.enrolledAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {group.assignments.map((entry) => (
                  <article
                    key={entry.assignment.id}
                    className="glass-panel p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="pixel-kicker">Assignment</p>
                        <h4 className="pixel-panel__title">
                          {entry.assignment.title}
                        </h4>
                        <p className="pixel-panel__body">
                          {entry.assignment.description ??
                            'No assignment note.'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="game-chip">
                          Starts{' '}
                          {new Date(
                            entry.assignment.startAt,
                          ).toLocaleDateString()}
                        </span>
                        <span className="game-chip">
                          Due{' '}
                          {entry.assignment.dueAt
                            ? new Date(
                                entry.assignment.dueAt,
                              ).toLocaleDateString()
                            : 'none'}
                        </span>
                      </div>
                    </div>

                    <section className="level-map mt-4">
                      {entry.assignment.roomManifest.map((room) => {
                        const progress = assignmentProgressByKey.get(
                          `${entry.assignment.id}:${room.roomKey}`,
                        );
                        const isCompleted =
                          progress?.status === 'COMPLETED';
                        const statusLabel = isCompleted
                          ? 'Cleared'
                          : progress?.status === 'IN_PROGRESS'
                            ? 'In Progress'
                            : 'Assigned';

                        return (
                          <article
                            key={`${entry.assignment.id}:${room.roomKey}`}
                            className={`level-card level-card--unlocked ${isCompleted ? 'level-card--completed' : ''}`}
                          >
                            <div className="level-card__header">
                              <div>
                                <p className="level-card__eyebrow">
                                  {room.sourceType === 'CUSTOM_ROOM'
                                    ? 'Custom Room'
                                    : 'Official Room'}
                                </p>
                                <h3 className="level-card__title">
                                  {room.title}
                                </h3>
                              </div>
                              <span
                                className={`level-badge ${isCompleted ? 'level-badge--completed' : 'level-badge--open'}`}
                              >
                                {statusLabel}
                              </span>
                            </div>

                            <div className="level-card__meta">
                              <span>{room.lesson}</span>
                              <span>{room.difficulty}</span>
                              <span>Par {room.parMoves}</span>
                            </div>

                            <p className="level-card__objective">
                              {room.objective}
                            </p>

                            <div className="level-card__footer">
                              <div className="level-card__track">
                                <span
                                  className={`level-dot ${isCompleted ? 'level-dot--completed' : 'level-dot--open'}`}
                                />
                                <span>
                                  {progress?.bestLetterGrade
                                    ? `Best grade ${progress.bestLetterGrade}`
                                    : 'Ready from your classroom assignment'}
                                </span>
                              </div>
                              <Button
                                className={
                                  isCompleted
                                    ? 'pixel-button pixel-button--ghost'
                                    : 'pixel-button'
                                }
                                variant={isCompleted ? 'ghost' : 'primary'}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openPuzzle(
                                    room.roomKey,
                                    entry.assignment.id,
                                  );
                                }}
                              >
                                {isCompleted
                                  ? 'Replay Assignment'
                                  : 'Play Assignment'}
                              </Button>
                            </div>
                          </article>
                        );
                      })}
                    </section>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </section>
      ) : null}

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
