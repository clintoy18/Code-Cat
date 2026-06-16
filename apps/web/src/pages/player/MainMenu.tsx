import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import { curriculumWorlds } from '@/features/game/data/curriculumRoadmap';
import { useGame } from '@/hooks/useGame';
import codeCatLogo from '@/assets/codecat-logo.png';

const cards = [
  { title: 'Foundations World', body: 'Start with sequencing, debugging, and efficiency before the cat enters richer logic rooms.' },
  { title: 'Decision World', body: 'Move beyond straight-line routes and teach the cat to react to true and false checks.' },
  { title: 'Roadmap Worlds', body: 'Loops, functions, variables, and strategy are now mapped as the next curriculum tracks.' },
];

export const MainMenu = () => {
  const { puzzles, unlockedPuzzleIds, completedPuzzleIds } = useGame();
  const playableWorldCount = curriculumWorlds.filter((world) => world.status === 'playable').length;
  const scaffoldedWorldCount = curriculumWorlds.filter((world) => world.status === 'scaffolded').length;
  const nextPuzzle =
    puzzles.find((puzzle) => unlockedPuzzleIds.includes(puzzle.id) && !completedPuzzleIds.includes(puzzle.id)) ?? puzzles[0];
  const completionPercent = puzzles.length ? Math.round((completedPuzzleIds.length / puzzles.length) * 100) : 0;

  return (
    <div className="pixel-page space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="pixel-hero"
      >
        <div>
          <img src={codeCatLogo} alt="Code Cat" className="hero-logo" />
          <h1 className="pixel-hero__title">A classroom puzzle game where code moves the cat tile by tile.</h1>
          <p className="pixel-hero__body">
            Students learn logic through short playable rooms, clear one level at a time, and stay focused in a
            game-first interface instead of a worksheet-like screen.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/levels">
              <Button size="lg" className="pixel-button">
                Open Level Map
              </Button>
            </Link>
            <Link to="/gameplay">
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
          <p className="mt-3 text-sm text-brand-100">
            {completedPuzzleIds.length} of {puzzles.length} playable rooms completed across {playableWorldCount} live
            worlds. {scaffoldedWorldCount} more worlds are scoped next.
          </p>
        </div>
      </motion.section>

      <section className="pixel-card-grid">
        {cards.map((card, index) => (
          <motion.article
            key={card.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="pixel-panel"
          >
            <p className="pixel-kicker">Game Loop</p>
            <h3 className="pixel-panel__title">{card.title}</h3>
            <p className="pixel-panel__body">{card.body}</p>
          </motion.article>
        ))}
      </section>
    </div>
  );
};
