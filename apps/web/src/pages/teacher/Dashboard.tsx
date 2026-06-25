import { Link } from 'react-router-dom';
import { useTeacherClassroomsQuery, useTeacherOverviewQuery } from '@/features/teacher';

const statCards = [
  {
    key: 'classroomCount',
    label: 'Classrooms',
    copy: 'Private teacher-owned rooms with manual enrollment.',
  },
  {
    key: 'publishedRoomCount',
    label: 'Published Rooms',
    copy: 'Versioned custom rooms ready to assign.',
  },
  {
    key: 'assignmentCount',
    label: 'Assignments',
    copy: 'Live official worlds, official rooms, and custom-room drops.',
  },
  {
    key: 'enrolledStudentCount',
    label: 'Students',
    copy: 'Learners enrolled across the teacher’s classrooms.',
  },
] as const;

export const Dashboard = () => {
  const overviewQuery = useTeacherOverviewQuery();
  const classroomsQuery = useTeacherClassroomsQuery();

  const overview = overviewQuery.data;
  const classrooms = classroomsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">
          Teacher Operations
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">
          Build the classroom, assign the rooms, then watch how students solve them.
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-700">
          The workflow is now organized around real classroom delivery instead of placeholder lesson notes. Create a
          room, enroll existing students, assign official or custom gameplay, and track letter-grade outcomes from
          completion, efficiency, code quality, and retries.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/teacher/students"
            className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Open Classroom Manager
          </Link>
          <Link
            to="/teacher/lessons"
            className="rounded-2xl border border-[var(--color-line)] bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            Build Custom Room
          </Link>
          <Link
            to="/teacher/progress"
            className="rounded-2xl border border-[var(--color-line)] bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            Review Progress
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <article key={card.key} className="glass-panel p-5">
            <p className="text-sm uppercase tracking-[0.28em] text-brand-700">{card.label}</p>
            <p className="mt-4 font-display text-3xl font-bold text-[var(--color-ink)]">
              {overviewQuery.isLoading ? '...' : overview?.[card.key] ?? 0}
            </p>
            <p className="mt-3 text-sm text-slate-600">{card.copy}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <article className="glass-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-brand-700">Live Classrooms</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Current teaching load</h2>
            </div>
            <span className="rounded-full bg-brand-100 px-4 py-2 text-sm font-semibold text-brand-700">
              {classrooms.length} active
            </span>
          </div>
          <div className="mt-5 grid gap-3">
            {classrooms.length ? (
              classrooms.slice(0, 4).map((classroom) => (
                <article
                  key={classroom.id}
                  className="rounded-3xl border border-[var(--color-line)] bg-white/75 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl font-bold text-[var(--color-ink)]">{classroom.name}</h3>
                      <p className="mt-2 text-sm text-slate-600">{classroom.description}</p>
                    </div>
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white">
                      {classroom.isPrivate ? 'Private' : 'Open'}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    <span>{classroom.enrollmentCount ?? 0} students</span>
                    <span>{classroom.assignmentCount ?? 0} assignments</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-[var(--color-line)] bg-white/65 p-5 text-sm text-slate-600">
                No classrooms yet. Start in the classroom manager and seed your first roster there.
              </div>
            )}
          </div>
        </article>

        <article className="glass-panel p-6">
          <p className="text-sm uppercase tracking-[0.28em] text-brand-700">Delivery Notes</p>
          <h2 className="mt-2 font-display text-2xl font-bold">MVP rules now enforced</h2>
          <ul className="mt-5 space-y-3 text-sm text-slate-700">
            <li className="rounded-2xl border border-[var(--color-line)] bg-white/75 px-4 py-3">
              Students are selected from existing accounts, not classroom-only placeholders.
            </li>
            <li className="rounded-2xl border border-[var(--color-line)] bg-white/75 px-4 py-3">
              Official worlds can be assigned directly, while custom worlds stay out of scope for now.
            </li>
            <li className="rounded-2xl border border-[var(--color-line)] bg-white/75 px-4 py-3">
              Room grades are tracked as a 100-point internal score and displayed as letter grades.
            </li>
            <li className="rounded-2xl border border-[var(--color-line)] bg-white/75 px-4 py-3">
              Publishing a custom room creates a versioned room record that can be reused in later assignments.
            </li>
          </ul>
          <div className="mt-5 rounded-3xl bg-slate-900 p-4 text-sm text-slate-100">
            {overview?.dueSoonCount
              ? `${overview.dueSoonCount} assignments are due in the next seven days.`
              : 'No classroom assignments are due in the next seven days.'}
          </div>
        </article>
      </section>
    </div>
  );
};
