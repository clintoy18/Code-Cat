export const Dashboard = () => (
  <div className="space-y-6">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">Admin</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Monitor players and content rollout.</h1>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      {['Players', 'Levels', 'Reports'].map((item) => (
        <article key={item} className="rounded-[1.75rem] bg-brand-900 p-6 text-brand-50">
          <p className="text-sm uppercase tracking-[0.3em] text-brand-200">{item}</p>
          <p className="mt-4 text-3xl font-bold">00</p>
        </article>
      ))}
    </div>
  </div>
);
