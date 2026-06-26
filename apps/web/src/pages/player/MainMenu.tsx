import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import { curriculumWorlds } from '@/features/game/data/curriculumRoadmap';
import { useGame } from '@/hooks/useGame';
import codeCatLogo from '@/assets/codecat-logo.png';

const cards = [
  {
    title: 'Normal gameplay',
    body: 'Follow the built-in Code Cat path world by world and keep your official progression moving.',
    to: '/levels',
    action: 'Open progression',
  },
  {
    title: 'Classroom gameplay',
    body: 'Play only the rooms your teacher assigned to the classrooms you joined.',
    to: '/classroom-gameplays',
    action: 'Open assignments',
  },
  {
    title: 'Achievements',
    body: 'Review unlocked milestones, replay momentum, and recent wins across both tracks.',
    to: '/achievements',
    action: 'View achievements',
  },
];

export const MainMenu = () => {
  const { puzzles, unlockedPuzzleIds, completedPuzzleIds } = useGame();
  const playableWorldCount = curriculumWorlds.filter((world) => world.status === 'playable').length;
  const scaffoldedWorldCount = curriculumWorlds.filter((world) => world.status === 'scaffolded').length;
  const nextPuzzle =
    puzzles.find((puzzle) => unlockedPuzzleIds.includes(puzzle.id) && !completedPuzzleIds.includes(puzzle.id)) ?? puzzles[0];
  const completionPercent = puzzles.length ? Math.round((completedPuzzleIds.length / puzzles.length) * 100) : 0;

  return (
    <div className="pixel-page main-menu-shell">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="pixel-hero main-menu-shell__hero"
      >
        <div>
          <img src={codeCatLogo} alt="Code Cat" className="hero-logo" />
          <h1 className="pixel-hero__title">
            One place to continue your next coding room.
          </h1>
          <p className="pixel-hero__body">
            Move between the built-in Code Cat journey and teacher-assigned
            classrooms without mixing progress. This menu keeps the next room,
            your live worlds, and your classroom work easy to find.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/levels">
              <Button size="lg" className="pixel-button">
                Open Level Map
              </Button>
            </Link>
            <Link to={nextPuzzle ? `/gameplay/${nextPuzzle.id}` : '/levels'}>
              <Button variant="secondary" size="lg" className="pixel-button pixel-button--secondary">
                Continue Mission
              </Button>
            </Link>
            <Link to="/achievements">
              <Button variant="ghost" size="lg" className="pixel-button pixel-button--ghost">
                Achievements
              </Button>
            </Link>
          </div>
        </div>
        <div className="pixel-panel pixel-panel--dark">
          <p className="pixel-kicker pixel-kicker--light">Up Next</p>
          <h2 className="pixel-panel__title">{nextPuzzle?.title ?? 'Starter mission ready'}</h2>
          <p className="pixel-panel__body">
            {nextPuzzle
              ? `${nextPuzzle.lesson} / ${nextPuzzle.difficulty} / ${nextPuzzle.objective}`
              : 'All current playable rooms are complete.'}
          </p>
          <div className="pixel-progress mt-5">
            <div className="pixel-progress__bar" style={{ width: `${completionPercent}%` }} />
          </div>
          <p className="mt-3 text-sm text-[var(--text-1)]">
            {completedPuzzleIds.length} of {puzzles.length} playable rooms
            completed across {playableWorldCount} live worlds. {scaffoldedWorldCount}{' '}
            future worlds remain outside the student path.
          </p>
        </div>
      </motion.section>

      <section className="pixel-card-grid main-menu-shell__grid">
        {cards.map((card, index) => (
          <motion.article
            key={card.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="pixel-panel"
          >
            <p className="pixel-kicker">Workspace</p>
            <h3 className="pixel-panel__title">{card.title}</h3>
            <p className="pixel-panel__body">{card.body}</p>
            <div className="mt-5">
              <Link to={card.to}>
                <Button variant="ghost" className="pixel-button pixel-button--ghost">
                  {card.action}
                </Button>
              </Link>
            </div>
          </motion.article>
        ))}
      </section>
    </div>
  );
};
