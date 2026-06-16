import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import { curriculumWorlds, playableWorlds } from '@/features/game/data/curriculumRoadmap';
import { getRoadmapStats } from '@/features/game/data/lessonRoadmap';
import { useGame } from '@/hooks/useGame';

export const LevelSelect = () => {
  const navigate = useNavigate();
  const { puzzles, loadPuzzle, unlockedPuzzleIds, completedPuzzleIds } = useGame();
  const roadmapStats = getRoadmapStats(curriculumWorlds);
  const completedCount = completedPuzzleIds.length;
  const nextOpenPuzzleId =
    puzzles.find((puzzle) => unlockedPuzzleIds.includes(puzzle.id) && !completedPuzzleIds.includes(puzzle.id))?.id ??
    puzzles[0]?.id;

  const openPuzzle = (puzzleId: string) => {
    loadPuzzle(puzzleId);
    navigate('/gameplay');
  };

  return (
    <div className="pixel-page space-y-6">
      <section className="mission-brief">
        <div className="mission-brief__copy">
          <p className="mission-brief__eyebrow">Level Map</p>
          <h1 className="mission-brief__title">Clear the ice rooms one world at a time.</h1>
          <p className="mission-brief__objective">
            The live game now covers Foundations, Decisions, and Loops, while the next worlds are already scoped for
            functions, variables, and strategy.
          </p>
        </div>
        <div className="mission-brief__stats">
          <div className="mission-stat">
            <span className="mission-stat__label">Levels Cleared</span>
            <span className="mission-stat__value">
              {completedCount}/{puzzles.length}
            </span>
          </div>
          <div className="mission-stat">
            <span className="mission-stat__label">Unlocked</span>
            <span className="mission-stat__value">{unlockedPuzzleIds.length}</span>
          </div>
          <div className="mission-stat">
            <span className="mission-stat__label">Current Focus</span>
            <span className="mission-stat__value">
              {puzzles.findIndex((puzzle) => puzzle.id === nextOpenPuzzleId) + 1 || 1}
            </span>
          </div>
          <div className="mission-stat">
            <span className="mission-stat__label">Roadmap</span>
            <span className="mission-stat__value">
              {roadmapStats.playableWorlds} live / {roadmapStats.scaffoldedWorlds} next
            </span>
          </div>
        </div>
      </section>

      <section className="world-roadmap">
        {curriculumWorlds.map((world) => (
          <article
            key={world.id}
            className={`world-card ${world.status === 'playable' ? 'world-card--playable' : 'world-card--scaffolded'}`}
          >
            <div className="world-card__header">
              <div>
                <p className="world-card__eyebrow">
                  World {world.order} - {world.agentOwner}
                </p>
                <h2 className="world-card__title">{world.title}</h2>
              </div>
              <span className={`world-card__status world-card__status--${world.status}`}>
                {world.status === 'playable' ? 'Playable Now' : 'Scaffolded Next'}
              </span>
            </div>

            <p className="world-card__description">{world.description}</p>
            <p className="world-card__outcome">{world.studentOutcome}</p>

            <div className="world-card__chips">
              {world.focus.map((topic) => (
                <span key={topic}>{topic}</span>
              ))}
            </div>

            <div className="world-card__details">
              <div>
                <p className="world-card__label">Current Mechanics</p>
                <p className="world-card__text">{world.currentMechanics.join(' / ')}</p>
              </div>
              <div>
                <p className="world-card__label">Next Mechanics</p>
                <p className="world-card__text">{world.futureMechanics.join(' / ')}</p>
              </div>
            </div>

            <div className="world-card__footer">
              <span>{world.puzzles.length} lesson rooms mapped</span>
              <span>
                {world.status === 'playable'
                  ? 'Included in current progression'
                  : 'Roadmapped for the next engine pass'}
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="pixel-kicker">Playable Rooms</p>
            <h2 className="pixel-panel__title">Current progression</h2>
          </div>
          <span className="game-chip">
            {completedCount}/{playableWorlds.reduce((count, world) => count + world.puzzles.length, 0)} cleared
          </span>
        </div>

        <section className="level-map">
          {puzzles.map((puzzle, index) => {
            const isUnlocked = unlockedPuzzleIds.includes(puzzle.id);
            const isCompleted = completedPuzzleIds.includes(puzzle.id);
            const isNext = puzzle.id === nextOpenPuzzleId && !isCompleted;

            return (
              <article
                key={puzzle.id}
                className={`level-card ${isUnlocked ? 'level-card--unlocked' : 'level-card--locked'} ${isCompleted ? 'level-card--completed' : ''} ${isUnlocked ? 'level-card--interactive' : ''}`}
                role={isUnlocked ? 'button' : undefined}
                tabIndex={isUnlocked ? 0 : -1}
                onClick={isUnlocked ? () => openPuzzle(puzzle.id) : undefined}
                onKeyDown={
                  isUnlocked
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openPuzzle(puzzle.id);
                        }
                      }
                    : undefined
                }
              >
                <div className="level-card__header">
                  <div>
                    <p className="level-card__eyebrow">Level {index + 1}</p>
                    <h2 className="level-card__title">{puzzle.title}</h2>
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
                        ? 'Next required mission'
                        : isCompleted
                          ? 'Completed and replayable'
                          : 'Unlock the previous room first'}
                    </span>
                  </div>
                  <Button
                    className={isCompleted ? 'pixel-button pixel-button--ghost' : 'pixel-button'}
                    variant={isCompleted ? 'ghost' : 'primary'}
                    disabled={!isUnlocked}
                    onClick={(event) => {
                      event.stopPropagation();
                      openPuzzle(puzzle.id);
                    }}
                  >
                    {isCompleted ? 'Replay Level' : isUnlocked ? 'Play Level' : 'Locked'}
                  </Button>
                </div>
              </article>
            );
          })}
        </section>
      </section>
    </div>
  );
};
