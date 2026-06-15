import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import { useGame } from '@/hooks/useGame';

export const LevelSelect = () => {
  const navigate = useNavigate();
  const { puzzles, loadPuzzle } = useGame();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">Levels</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Choose a challenge track.</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {puzzles.map((puzzle) => (
          <article key={puzzle.id} className="glass-panel p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold">{puzzle.title}</h2>
              <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                {puzzle.lesson}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-700">{puzzle.objective}</p>
            <Button
              className="mt-5"
              onClick={() => {
                loadPuzzle(puzzle.id);
                navigate('/gameplay');
              }}
            >
              Load Puzzle
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
};
