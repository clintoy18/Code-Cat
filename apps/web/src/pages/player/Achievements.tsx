import { curriculumWorlds } from '@/features/game/data/curriculumRoadmap';
import { useGame } from '@/hooks/useGame';

type AchievementDefinition = {
  id: string;
  title: string;
  description: string;
  isUnlocked: (args: {
    completedPuzzleIds: string[];
    completedPuzzlesByLesson: Map<string, number>;
    completedPuzzlesByWorld: Map<string, number>;
  }) => boolean;
};

const achievementDefinitions: AchievementDefinition[] = [
  {
    id: 'first-steps',
    title: 'First Steps',
    description: 'Complete your first sequencing puzzle.',
    isUnlocked: ({ completedPuzzleIds }) => completedPuzzleIds.length >= 1,
  },
  {
    id: 'branch-scout',
    title: 'Branch Scout',
    description: 'Clear a Decisions room using true or false checks.',
    isUnlocked: ({ completedPuzzlesByLesson }) =>
      (completedPuzzlesByLesson.get('Conditionals') ?? 0) >= 1,
  },
  {
    id: 'loop-whisperer',
    title: 'Loop Whisperer',
    description: 'Complete a Loops room with structured repetition.',
    isUnlocked: ({ completedPuzzlesByLesson }) =>
      (completedPuzzlesByLesson.get('Loops') ?? 0) >= 1,
  },
  {
    id: 'helper-builder',
    title: 'Helper Builder',
    description: 'Clear a Functions room using a named helper.',
    isUnlocked: ({ completedPuzzlesByLesson }) =>
      (completedPuzzlesByLesson.get('Functions') ?? 0) >= 1,
  },
  {
    id: 'key-keeper',
    title: 'Key Keeper',
    description: 'Clear a Variables and State room after collecting the key.',
    isUnlocked: ({ completedPuzzlesByLesson }) =>
      (completedPuzzlesByLesson.get('Variables') ?? 0) >= 1,
  },
  {
    id: 'route-strategist',
    title: 'Route Strategist',
    description: 'Finish a Strategy room while staying under the move budget.',
    isUnlocked: ({ completedPuzzlesByLesson }) =>
      (completedPuzzlesByLesson.get('Strategy') ?? 0) >= 1,
  },
  {
    id: 'world-climber',
    title: 'World Climber',
    description: 'Fully clear any live world in the current curriculum.',
    isUnlocked: ({ completedPuzzlesByWorld }) =>
      Array.from(completedPuzzlesByWorld.values()).some((count) => count >= 1),
  },
];

const getCompletedWorldCounts = (completedPuzzleIds: string[]) =>
  curriculumWorlds.reduce((counts, world) => {
    const completedCount = world.puzzles.filter((puzzle) =>
      completedPuzzleIds.includes(puzzle.id),
    ).length;

    if (completedCount === world.puzzles.length && world.puzzles.length > 0) {
      counts.set(world.id, completedCount);
    }

    return counts;
  }, new Map<string, number>());

export const Achievements = () => {
  const { puzzles, completedPuzzleIds } = useGame();

  const completedPuzzlesByLesson = completedPuzzleIds.reduce((counts, id) => {
    const puzzle = puzzles.find((entry) => entry.id === id);

    if (!puzzle) {
      return counts;
    }

    counts.set(puzzle.lesson, (counts.get(puzzle.lesson) ?? 0) + 1);

    return counts;
  }, new Map<string, number>());

  const completedPuzzlesByWorld = getCompletedWorldCounts(completedPuzzleIds);
  const achievements = achievementDefinitions.map((achievement) => ({
    ...achievement,
    unlocked: achievement.isUnlocked({
      completedPuzzleIds,
      completedPuzzlesByLesson,
      completedPuzzlesByWorld,
    }),
  }));
  const unlockedCount = achievements.filter(
    (achievement) => achievement.unlocked,
  ).length;

  return (
    <div className="pixel-page space-y-6">
      <section className="mission-brief">
        <div className="mission-brief__copy">
          <p className="mission-brief__eyebrow">Achievements</p>
          <h1 className="mission-brief__title">
            Track what the player has mastered.
          </h1>
          <p className="mission-brief__objective">
            Achievements now unlock from real student progress, not placeholder
            milestones. Clear more rooms to reveal the rest.
          </p>
        </div>
        <div className="mission-brief__stats">
          <div className="mission-stat">
            <span className="mission-stat__label">Unlocked</span>
            <span className="mission-stat__value">
              {unlockedCount}/{achievements.length}
            </span>
          </div>
          <div className="mission-stat">
            <span className="mission-stat__label">Levels Cleared</span>
            <span className="mission-stat__value">{completedPuzzleIds.length}</span>
          </div>
          <div className="mission-stat">
            <span className="mission-stat__label">Worlds Finished</span>
            <span className="mission-stat__value">
              {completedPuzzlesByWorld.size}
            </span>
          </div>
          <div className="mission-stat">
            <span className="mission-stat__label">Next Goal</span>
            <span className="mission-stat__value">
              {achievements.find((achievement) => !achievement.unlocked)?.title ??
                'All clear'}
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {achievements.map((achievement) => (
          <article
            key={achievement.id}
            className={`glass-panel p-6 ${achievement.unlocked ? '' : 'opacity-80'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="pixel-kicker">
                  {achievement.unlocked ? 'Unlocked' : 'Locked'}
                </p>
                <h2 className="pixel-panel__title">{achievement.title}</h2>
              </div>
              <span className="game-chip">
                {achievement.unlocked ? 'Earned' : 'Pending'}
              </span>
            </div>
            <p className="pixel-panel__body">{achievement.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
};
