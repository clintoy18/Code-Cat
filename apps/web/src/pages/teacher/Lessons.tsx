const lessonNotes = [
  'Model movement commands as individual functions before introducing reusable patterns.',
  'Ask students to predict the cat position before they run the program.',
  'Use conditional blocks to explain why branching avoids crashing into walls.',
];

export const Lessons = () => (
  <div className="space-y-6">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">Lesson Notes</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Teaching prompts for the current puzzle set.</h1>
    </div>
    <div className="glass-panel p-6">
      <ul className="space-y-4">
        {lessonNotes.map((note) => (
          <li key={note} className="rounded-2xl border border-[var(--color-line)] bg-white/70 px-4 py-3 text-sm text-slate-700">
            {note}
          </li>
        ))}
      </ul>
    </div>
  </div>
);
