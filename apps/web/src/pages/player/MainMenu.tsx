import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';

const cards = [
  { title: 'Sequencing Sprint', body: 'Arrange steps in the right order to guide the cat.' },
  { title: 'Loop Lab', body: 'Reuse blocks efficiently and spot repeated movement.' },
  { title: 'Condition Maze', body: 'Pick the right path when the puzzle state changes.' },
];

export const MainMenu = () => (
  <div className="space-y-6">
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel overflow-hidden p-8"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">Code Cat</p>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div>
          <h1 className="font-display text-4xl font-extrabold leading-tight">
            Learn programming logic by helping a cat solve puzzle rooms.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-700">
            Sequence actions, build loops, and unlock achievements while the gameplay stays readable enough
            for classroom use.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/levels">
              <Button size="lg">Play Levels</Button>
            </Link>
            <Link to="/achievements">
              <Button variant="ghost" size="lg">View Achievements</Button>
            </Link>
          </div>
        </div>
        <div className="rounded-[2rem] bg-brand-900 p-6 text-brand-50">
          <p className="text-sm uppercase tracking-[0.3em] text-brand-200">Today&apos;s Objective</p>
          <h2 className="mt-4 font-display text-2xl font-bold">Teach the cat to think in steps.</h2>
          <p className="mt-3 text-sm text-brand-100">
            The starter scaffold is ready for a pure TypeScript puzzle engine to feed execution updates into Zustand next.
          </p>
        </div>
      </div>
    </motion.section>
    <section className="grid gap-4 md:grid-cols-3">
      {cards.map((card, index) => (
        <motion.article
          key={card.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
          className="glass-panel p-6"
        >
          <h3 className="font-display text-xl font-bold">{card.title}</h3>
          <p className="mt-3 text-sm text-slate-700">{card.body}</p>
        </motion.article>
      ))}
    </section>
  </div>
);
