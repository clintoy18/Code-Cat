const students = [
  { name: 'Alyssa', status: 'Needs help with conditionals', progress: '4 / 8 puzzles' },
  { name: 'Marco', status: 'Strong at sequencing', progress: '6 / 8 puzzles' },
  { name: 'Tina', status: 'Blocked by wall-detection puzzles', progress: '3 / 8 puzzles' },
];

export const Students = () => (
  <div className="space-y-6">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">Students</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Review learner progress at a glance.</h1>
    </div>
    <div className="grid gap-4">
      {students.map((student) => (
        <article key={student.name} className="glass-panel flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">{student.name}</h2>
            <p className="mt-1 text-sm text-slate-600">{student.status}</p>
          </div>
          <span className="rounded-full bg-brand-100 px-4 py-2 text-sm font-semibold text-brand-700">
            {student.progress}
          </span>
        </article>
      ))}
    </div>
  </div>
);
