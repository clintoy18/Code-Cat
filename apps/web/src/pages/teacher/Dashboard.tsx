import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/shared';
import { useTeacherClassroomsQuery, useTeacherOverviewQuery } from '@/features/teacher';

const teacherWorkflow = [
  {
    step: 'Create',
    title: 'Set up the classroom',
    description: 'Name the classroom, define the lesson focus, and seed the first roster.',
    to: '/teacher/students',
    action: 'Open classrooms',
  },
  {
    step: 'Enroll',
    title: 'Manage the roster',
    description: 'Handle one-off adds or bulk enrollment without leaving the classroom flow.',
    to: '/teacher/students',
    action: 'Manage roster',
  },
  {
    step: 'Build',
    title: 'Publish classroom gameplay',
    description: 'Create a custom room, version it, then deliver it directly into student play.',
    to: '/teacher/lessons',
    action: 'Open builder',
  },
] as const;

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
  const classroomsQuery = useTeacherClassroomsQuery({ page: 1, pageSize: 4 });

  const overview = overviewQuery.data;
  const classrooms = classroomsQuery.data?.items ?? [];
  const classroomPagination = classroomsQuery.data?.pagination ?? null;

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6">
        <p className="teacher-kicker">
          Teacher Operations
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">
          Build classrooms in the same order teachers already think.
        </h1>
        <p className="teacher-copy mt-3 max-w-3xl text-sm">
          Classroom setup, roster management, room building, and progress
          review now live in one product flow. The goal is simple: less UI
          hunting, faster lesson delivery.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/teacher/students"
            className="teacher-button-primary"
          >
            Create Classroom
          </Link>
          <Link
            to="/teacher/lessons"
            className="teacher-button-secondary"
          >
            Build Classroom Level
          </Link>
          <Link
            to="/teacher/progress"
            className="teacher-button-secondary"
          >
            Review Progress
          </Link>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {teacherWorkflow.map((item) => (
          <article key={item.step} className="glass-panel p-5">
            <p className="teacher-kicker">{item.step}</p>
            <h2 className="mt-3 font-display text-2xl font-bold">{item.title}</h2>
            <p className="teacher-copy mt-3 text-sm">{item.description}</p>
            <Link to={item.to} className="teacher-button-secondary mt-5">
              {item.action}
            </Link>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <article key={card.key} className="glass-panel p-5">
            <p className="teacher-kicker">{card.label}</p>
            <p className="mt-4 font-display text-3xl font-bold text-[var(--color-ink)]">
              {overviewQuery.isLoading ? '...' : overview?.[card.key] ?? 0}
            </p>
            <p className="teacher-copy mt-3 text-sm">{card.copy}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <article className="glass-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="teacher-kicker">Live Classrooms</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Current teaching load</h2>
            </div>
            <span className="teacher-chip">
              {classroomPagination?.totalItems ?? classrooms.length} active
            </span>
          </div>
          <div className="mt-5 grid gap-3">
            {classrooms.length ? (
              classrooms.slice(0, 4).map((classroom) => (
                <article
                  key={classroom.id}
                  className="teacher-surface rounded-3xl p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl font-bold text-[var(--color-ink)]">{classroom.name}</h3>
                      <p className="teacher-copy mt-2 text-sm">{classroom.description}</p>
                    </div>
                    <span className="teacher-tag text-xs">
                      {classroom.isPrivate ? 'Private' : 'Open'}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-2)]">
                    <span>{classroom.enrollmentCount ?? 0} students</span>
                    <span>{classroom.assignmentCount ?? 0} assignments</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link to="/teacher/students" className="teacher-button-secondary">
                      Manage roster
                    </Link>
                    <Link to={`/teacher/lessons?classroomId=${classroom.id}`} className="teacher-button-secondary">
                      Build level
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState
                className="teacher-surface teacher-surface--muted"
                description="Classrooms will appear here after you create one in the classroom manager and start building your roster."
                action={(
                  <Link to="/teacher/students" className="teacher-button-secondary">
                    Open classroom manager
                  </Link>
                )}
              />
            )}
          </div>
        </article>

        <article className="glass-panel p-6">
          <p className="teacher-kicker">Working Rules</p>
          <h2 className="mt-2 font-display text-2xl font-bold">How this teacher workflow behaves today</h2>
          <ul className="teacher-copy mt-5 space-y-3 text-sm">
            <li className="teacher-surface rounded-2xl px-4 py-3">
              Students are selected from existing accounts, not classroom-only placeholders.
            </li>
            <li className="teacher-surface rounded-2xl px-4 py-3">
              Classroom pages focus on classroom setup and enrollment, while room delivery stays in the builder.
            </li>
            <li className="teacher-surface rounded-2xl px-4 py-3">
              Room grades are tracked as a 100-point internal score and displayed as letter grades.
            </li>
            <li className="teacher-surface rounded-2xl px-4 py-3">
              Publishing a custom room creates a versioned room record that can be reused in later assignments.
            </li>
          </ul>
          <div className="teacher-note mt-5 rounded-3xl p-4 text-sm">
            {overview?.dueSoonCount
              ? `${overview.dueSoonCount} assignments are due in the next seven days.`
              : 'No classroom assignments are due in the next seven days.'}
          </div>
        </article>
      </section>
    </div>
  );
};
