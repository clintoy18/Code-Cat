const achievements = [
  { title: 'First Steps', description: 'Complete your first sequencing puzzle.' },
  { title: 'Loop Whisperer', description: 'Solve a puzzle using the fewest blocks possible.' },
  { title: 'Maze Analyst', description: 'Finish a branching puzzle without hints.' },
];

export const Achievements = () => (
  <div className="space-y-6">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">Achievements</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Track what players are mastering.</h1>
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {achievements.map((achievement) => (
        <article key={achievement.title} className="glass-panel p-6">
          <h2 className="font-display text-xl font-bold">{achievement.title}</h2>
          <p className="mt-3 text-sm text-slate-700">{achievement.description}</p>
        </article>
      ))}
    </div>
  </div>
);
