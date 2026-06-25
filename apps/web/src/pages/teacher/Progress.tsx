import { useEffect, useMemo, useState } from 'react';
import { useTeacherClassroomDashboardQuery, useTeacherClassroomsQuery } from '@/features/teacher';

export const Progress = () => {
  const classroomsQuery = useTeacherClassroomsQuery();
  const classrooms = useMemo(() => classroomsQuery.data ?? [], [classroomsQuery.data]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedClassroomId && classrooms[0]) {
      setSelectedClassroomId(classrooms[0].id);
    }
  }, [classrooms, selectedClassroomId]);

  const dashboardQuery = useTeacherClassroomDashboardQuery(selectedClassroomId);
  const dashboard = dashboardQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <p className="teacher-kicker text-sm font-semibold uppercase tracking-[0.3em]">Progress Review</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Audit progress by classroom, not by loose student snapshots.</h1>
        <p className="teacher-copy mt-3 max-w-3xl text-sm">
          This view keeps attempts, failures, completion timestamps, and grade summaries tied to the assigned gameplay
          context so a teacher can evaluate how a student performed in one classroom without mixing unrelated runs.
        </p>
      </div>

      <section className="glass-panel p-6">
        <label className="block max-w-sm">
          <span className="teacher-label text-sm font-semibold">Active classroom</span>
          <select
            value={selectedClassroomId ?? ''}
            onChange={(event) => setSelectedClassroomId(event.target.value)}
            className="teacher-field mt-2"
          >
            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {dashboard ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <article className="glass-panel p-5">
              <p className="teacher-kicker text-sm uppercase tracking-[0.28em]">Students</p>
              <p className="mt-4 font-display text-3xl font-bold">{dashboard.summary.studentCount}</p>
            </article>
            <article className="glass-panel p-5">
              <p className="teacher-kicker text-sm uppercase tracking-[0.28em]">Assignments</p>
              <p className="mt-4 font-display text-3xl font-bold">{dashboard.summary.assignmentCount}</p>
            </article>
            <article className="glass-panel p-5">
              <p className="teacher-kicker text-sm uppercase tracking-[0.28em]">Assigned Rooms</p>
              <p className="mt-4 font-display text-3xl font-bold">{dashboard.summary.roomCount}</p>
            </article>
          </section>

          <section className="glass-panel p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="teacher-kicker text-sm uppercase tracking-[0.28em]">Roster Outcomes</p>
                <h2 className="mt-2 font-display text-2xl font-bold">{dashboard.classroom.name}</h2>
              </div>
              <span className="teacher-chip">
                {dashboard.roster.length} rows
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {dashboard.roster.map((entry) => (
                <article key={entry.student.id} className="teacher-surface rounded-3xl p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-xl font-bold text-[var(--color-ink)]">{entry.student.username}</h3>
                      <p className="mt-1 text-sm text-[var(--text-2)]">{entry.student.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-2)]">
                      <span>{entry.solvedRooms}/{entry.assignedRooms} solved</span>
                      <span>{entry.totalAttempts} attempts</span>
                      <span>{entry.totalFailures} failures</span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div className="teacher-surface teacher-surface--active rounded-2xl px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-2)]">Average</p>
                      <p className="mt-2 font-display text-2xl font-bold">{entry.averageScore ?? '-'}</p>
                    </div>
                    <div className="teacher-surface teacher-surface--active rounded-2xl px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-2)]">Letter</p>
                      <p className="mt-2 font-display text-2xl font-bold">{entry.letterGrade ?? '-'}</p>
                    </div>
                    <div className="teacher-surface teacher-surface--active rounded-2xl px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-2)]">High Scores</p>
                      <p className="mt-2 font-display text-2xl font-bold">{entry.achievements.highScores}</p>
                    </div>
                    <div className="teacher-surface teacher-surface--active rounded-2xl px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-2)]">Last Played</p>
                      <p className="teacher-copy mt-2 text-sm font-semibold">
                        {entry.lastPlayedAt ? new Date(entry.lastPlayedAt).toLocaleString() : 'Not yet'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {entry.roomProgress.map((room) => (
                      <div
                        key={room.id}
                        className="teacher-surface teacher-surface--active flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-[var(--text-0)]">{room.roomTitle}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--text-2)]">
                            {room.roomSource} / {room.status}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-2)]">
                          <span>Best {room.bestScore ?? '-'}</span>
                          <span>Latest {room.latestScore ?? '-'}</span>
                          <span>Attempts {room.attempts}</span>
                          <span>Solved {room.solvedAt ? new Date(room.solvedAt).toLocaleDateString() : 'No'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
};
