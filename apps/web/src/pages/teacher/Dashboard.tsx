export const Dashboard = () => (
  <div className="space-y-6">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">Teacher Hub</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Guide students through sequencing and logic.</h1>
      <p className="mt-3 max-w-2xl text-sm text-slate-700">
        Track puzzle completion, identify repeated failed attempts, and introduce condition blocks once
        students handle directional movement consistently.
      </p>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      <article className="glass-panel p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-brand-700">Focus</p>
        <h2 className="mt-4 font-display text-2xl font-bold">Sequencing</h2>
        <p className="mt-3 text-sm text-slate-700">Start with explicit `moveUp()` and `moveRight()` commands.</p>
      </article>
      <article className="glass-panel p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-brand-700">Next Skill</p>
        <h2 className="mt-4 font-display text-2xl font-bold">Conditionals</h2>
        <p className="mt-3 text-sm text-slate-700">Use `if path is clear` blocks to teach branch decisions.</p>
      </article>
      <article className="glass-panel p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-brand-700">Goal</p>
        <h2 className="mt-4 font-display text-2xl font-bold">Door Reached</h2>
        <p className="mt-3 text-sm text-slate-700">The cat puzzle gives immediate, visible feedback for each step.</p>
      </article>
    </div>
  </div>
);
