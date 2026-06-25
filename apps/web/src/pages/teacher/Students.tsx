import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useCreateClassroomMutation,
  useEnrollStudentsMutation,
  useTeacherClassroomQuery,
  useTeacherClassroomsQuery,
  useTeacherStudentsQuery,
} from '@/features/teacher';

export const Students = () => {
  const studentsQuery = useTeacherStudentsQuery();
  const classroomsQuery = useTeacherClassroomsQuery();
  const createClassroomMutation = useCreateClassroomMutation();

  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  const [classroomForm, setClassroomForm] = useState({
    name: '',
    description: '',
    isPrivate: true,
    requiresApproval: false,
    studentIds: [] as string[],
  });
  const [enrollmentDraft, setEnrollmentDraft] = useState<string[]>([]);
  const [singleEnrollmentStudentId, setSingleEnrollmentStudentId] = useState('');

  const classrooms = useMemo(() => classroomsQuery.data ?? [], [classroomsQuery.data]);
  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);

  useEffect(() => {
    if (!selectedClassroomId && classrooms[0]) {
      setSelectedClassroomId(classrooms[0].id);
    }
  }, [classrooms, selectedClassroomId]);

  const classroomDetailQuery = useTeacherClassroomQuery(selectedClassroomId);
  const enrollStudentsMutation = useEnrollStudentsMutation(selectedClassroomId);
  const selectedClassroom = classroomDetailQuery.data?.classroom ?? null;
  const unenrolledStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          !classroomDetailQuery.data?.enrollments.some(
            (entry) => entry.student.id === student.id,
          ),
      ),
    [classroomDetailQuery.data?.enrollments, students],
  );

  const submitClassroom = async () => {
    const classroom = await createClassroomMutation.mutateAsync({
      ...classroomForm,
      studentIds: classroomForm.studentIds,
    });
    setSelectedClassroomId(classroom.id);

    setClassroomForm({
      name: '',
      description: '',
      isPrivate: true,
      requiresApproval: false,
      studentIds: [],
    });
  };

  const submitEnrollment = async () => {
    if (!selectedClassroomId || !enrollmentDraft.length) {
      return;
    }

    await enrollStudentsMutation.mutateAsync(enrollmentDraft);
    setEnrollmentDraft([]);
  };

  const submitSingleEnrollment = async () => {
    if (!selectedClassroomId || !singleEnrollmentStudentId) {
      return;
    }

    await enrollStudentsMutation.mutateAsync([singleEnrollmentStudentId]);
    setSingleEnrollmentStudentId('');
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="teacher-kicker text-sm font-semibold uppercase tracking-[0.3em]">Classroom Manager</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Create classrooms and keep roster work focused.</h1>
        <p className="teacher-copy mt-3 max-w-3xl text-sm">
          This page now stays on classroom setup and student enrollment. Level building and classroom gameplays live in
          the builder so teachers are not managing the same workflow in two different places.
        </p>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <article className="glass-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="teacher-kicker text-sm uppercase tracking-[0.28em]">New Classroom</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Seed the roster at creation time</h2>
            </div>
            <span className="teacher-chip">
              Existing accounts only
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="teacher-label text-sm font-semibold">Classroom name</span>
              <input
                value={classroomForm.name}
                onChange={(event) => setClassroomForm((current) => ({ ...current, name: event.target.value }))}
                className="teacher-field mt-2"
                placeholder="World 3 Loop Workshop"
              />
            </label>
            <label className="block">
              <span className="teacher-label text-sm font-semibold">Description</span>
              <textarea
                value={classroomForm.description}
                onChange={(event) => setClassroomForm((current) => ({ ...current, description: event.target.value }))}
                className="teacher-field mt-2 min-h-28"
                placeholder="Students practice loops, route planning, and cleaner reuse before moving into helper functions."
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="teacher-surface teacher-copy flex items-center gap-3 rounded-2xl px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={classroomForm.isPrivate}
                  onChange={(event) => setClassroomForm((current) => ({ ...current, isPrivate: event.target.checked }))}
                />
                Private to teacher
              </label>
              <label className="teacher-surface teacher-copy flex items-center gap-3 rounded-2xl px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={classroomForm.requiresApproval}
                  onChange={(event) =>
                    setClassroomForm((current) => ({ ...current, requiresApproval: event.target.checked }))
                  }
                />
                Mark as approval-capable
              </label>
            </div>

            <div>
              <p className="teacher-label text-sm font-semibold">Initial students</p>
              <div className="teacher-surface mt-2 max-h-64 space-y-2 overflow-y-auto rounded-3xl p-3">
                {students.length ? (
                  students.map((student) => (
                    <label key={student.id} className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2 hover:bg-white/5">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-0)]">{student.username}</p>
                        <p className="text-xs text-[var(--text-2)]">{student.email}</p>
                      </div>
                      <input
                        type="checkbox"
                        aria-label={`Add ${student.username} to initial classroom roster`}
                        checked={classroomForm.studentIds.includes(student.id)}
                        onChange={(event) =>
                          setClassroomForm((current) => ({
                            ...current,
                            studentIds: event.target.checked
                              ? [...current.studentIds, student.id]
                              : current.studentIds.filter((entry) => entry !== student.id),
                          }))
                        }
                      />
                    </label>
                  ))
                ) : (
                  <div className="teacher-copy rounded-2xl border border-dashed border-white/10 px-3 py-4 text-sm">
                    No student accounts exist yet. Create students first, then you can seed the classroom roster here.
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={submitClassroom}
              disabled={createClassroomMutation.isPending}
              className="teacher-button-primary w-full"
            >
              {createClassroomMutation.isPending ? 'Creating classroom...' : 'Create classroom'}
            </button>
          </div>
        </article>

        <article className="space-y-4">
          <div className="glass-panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="teacher-kicker text-sm uppercase tracking-[0.28em]">Classrooms</p>
                <h2 className="mt-2 font-display text-2xl font-bold">Pick an active classroom</h2>
              </div>
              <span className="teacher-chip">
                {classrooms.length} total
              </span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {classrooms.length ? (
                classrooms.map((classroom) => (
                  <button
                    key={classroom.id}
                    type="button"
                    onClick={() => setSelectedClassroomId(classroom.id)}
                    className={`rounded-3xl border p-4 text-left transition ${
                      classroom.id === selectedClassroomId
                        ? 'teacher-surface teacher-surface--active'
                        : 'teacher-surface hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-xl font-bold text-[var(--color-ink)]">{classroom.name}</h3>
                        <p className="teacher-copy mt-2 text-sm">{classroom.description}</p>
                      </div>
                      <span className="teacher-tag">
                        {classroom.isPrivate ? 'Private' : 'Open'}
                      </span>
                    </div>
                    <div className="mt-4 flex gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-2)]">
                      <span>{classroom.enrollmentCount ?? 0} students</span>
                      <span>{classroom.assignmentCount ?? 0} assignments</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="teacher-surface teacher-copy rounded-3xl px-4 py-5 text-sm md:col-span-2">
                  No classrooms yet. Create the first classroom on the left to unlock roster management and classroom
                  gameplay delivery.
                </div>
              )}
            </div>
          </div>

          {selectedClassroom ? (
            <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
              <section className="glass-panel min-w-0 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="teacher-kicker text-sm uppercase tracking-[0.28em]">Roster</p>
                    <h2 className="mt-2 font-display text-2xl font-bold">{selectedClassroom.name}</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="teacher-chip">
                      {classroomDetailQuery.data?.enrollments.length ?? 0} enrolled
                    </span>
                    <span className="teacher-chip">{selectedClassroom.isPrivate ? 'Private' : 'Open'}</span>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="teacher-label text-sm font-semibold">Current students</p>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-2)]">
                        {classroomDetailQuery.data?.enrollments.length ?? 0} seats used
                      </span>
                    </div>
                    <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                      {classroomDetailQuery.data?.enrollments.length ? (
                        classroomDetailQuery.data.enrollments.map((entry) => (
                          <article key={entry.id} className="teacher-surface rounded-2xl px-4 py-3">
                            <p className="text-sm font-semibold text-[var(--text-0)]">{entry.student.username}</p>
                            <p className="mt-1 text-xs text-[var(--text-2)]">{entry.student.email}</p>
                          </article>
                        ))
                      ) : (
                        <div className="teacher-surface teacher-copy rounded-3xl px-4 py-5 text-sm">
                          No students enrolled yet. Add one student for a quick start or use bulk enroll for the full
                          roster.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="teacher-surface min-w-0 rounded-3xl p-4">
                    <div className="space-y-4">
                      <div>
                        <p className="teacher-kicker text-xs uppercase tracking-[0.24em]">Add Students</p>
                        <h3 className="mt-2 font-display text-xl font-bold">Single or bulk enrollment</h3>
                        <p className="teacher-copy mt-2 text-sm">
                          Use the quick selector for one-off adds, or mark a batch when you already know the full room
                          roster.
                        </p>
                      </div>

                      <div className="teacher-divider" />

                      <div className="space-y-3">
                        <p className="teacher-label text-sm font-semibold">Single enroll</p>
                        <div className="grid gap-3">
                          <select
                            value={singleEnrollmentStudentId}
                            onChange={(event) => setSingleEnrollmentStudentId(event.target.value)}
                            className="teacher-field"
                          >
                            <option value="">Select one student</option>
                            {unenrolledStudents.map((student) => (
                              <option key={student.id} value={student.id}>
                                {student.username} / {student.email}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={submitSingleEnrollment}
                            disabled={enrollStudentsMutation.isPending || !singleEnrollmentStudentId}
                            className="teacher-button-secondary"
                          >
                            Enroll student
                          </button>
                        </div>
                      </div>

                      <div className="teacher-divider" />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="teacher-label text-sm font-semibold">Bulk enroll</p>
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-2)]">
                            {unenrolledStudents.length} available
                          </span>
                        </div>
                        <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                          {unenrolledStudents.length ? (
                            unenrolledStudents.map((student) => (
                              <label
                                key={student.id}
                                className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2 hover:bg-white/5"
                              >
                                <div>
                                  <p className="text-sm font-semibold text-[var(--text-0)]">{student.username}</p>
                                  <p className="text-xs text-[var(--text-2)]">{student.email}</p>
                                </div>
                                <input
                                  type="checkbox"
                                  aria-label={`Enroll ${student.username} into ${selectedClassroom.name}`}
                                  checked={enrollmentDraft.includes(student.id)}
                                  onChange={(event) =>
                                    setEnrollmentDraft((current) =>
                                      event.target.checked
                                        ? [...current, student.id]
                                        : current.filter((entry) => entry !== student.id),
                                    )
                                  }
                                />
                              </label>
                            ))
                          ) : (
                            <div className="teacher-copy rounded-2xl border border-dashed border-white/10 px-3 py-4 text-sm">
                              Every known student is already part of this classroom.
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={submitEnrollment}
                          disabled={enrollStudentsMutation.isPending || !enrollmentDraft.length}
                          className="teacher-button-secondary w-full"
                        >
                          {enrollStudentsMutation.isPending ? 'Enrolling...' : 'Enroll selected students'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="min-w-0 space-y-4">
                <section className="glass-panel min-w-0 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="teacher-kicker text-sm uppercase tracking-[0.28em]">Next Step</p>
                      <h2 className="mt-2 font-display text-2xl font-bold">Build classroom gameplay</h2>
                      <p className="teacher-copy mt-3 text-sm">
                        Classroom levels and student-playable scheduling now happen in the room builder. This keeps
                        roster work separate from lesson delivery.
                      </p>
                    </div>
                    <span className="teacher-chip">One flow</span>
                  </div>
                  <div className="mt-5 grid gap-3">
                    <div className="teacher-surface rounded-2xl px-4 py-4">
                      <p className="teacher-label text-xs font-semibold uppercase tracking-[0.22em]">Students</p>
                      <p className="mt-2 text-2xl font-bold text-[var(--text-0)]">
                        {classroomDetailQuery.data?.enrollments.length ?? 0}
                      </p>
                    </div>
                    <div className="teacher-surface rounded-2xl px-4 py-4">
                      <p className="teacher-label text-xs font-semibold uppercase tracking-[0.22em]">Gameplays</p>
                      <p className="mt-2 text-2xl font-bold text-[var(--text-0)]">
                        {classroomDetailQuery.data?.assignments.length ?? 0}
                      </p>
                    </div>
                    <div className="teacher-surface rounded-2xl px-4 py-4">
                      <p className="teacher-label text-xs font-semibold uppercase tracking-[0.22em]">Visibility</p>
                      <p className="mt-2 text-lg font-bold text-[var(--text-0)]">
                        {selectedClassroom.isPrivate ? 'Private room' : 'Open room'}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/teacher/lessons?classroomId=${selectedClassroom.id}`}
                    className="teacher-button-primary mt-5 w-full"
                  >
                    Build level for classroom
                  </Link>
                </section>

                <section className="glass-panel min-w-0 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="teacher-kicker text-sm uppercase tracking-[0.28em]">Scheduled Gameplays</p>
                      <h2 className="mt-2 font-display text-2xl font-bold">What students will see next</h2>
                    </div>
                    <span className="teacher-chip">
                      {classroomDetailQuery.data?.assignments.length ?? 0} live
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {(classroomDetailQuery.data?.assignments ?? []).length ? (
                      classroomDetailQuery.data?.assignments.map((assignment) => (
                        <article key={assignment.id} className="teacher-surface rounded-2xl px-4 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-display text-xl font-bold text-[var(--color-ink)]">{assignment.title}</h3>
                              <p className="teacher-copy mt-2 text-sm">{assignment.description ?? 'No extra note.'}</p>
                            </div>
                            <span className="teacher-tag">{assignment.targetType.replace('_', ' ')}</span>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-2)]">
                            <span>{assignment.roomManifest.length} rooms</span>
                            <span>Starts {new Date(assignment.startAt).toLocaleDateString()}</span>
                            <span>
                              Due {assignment.dueAt ? new Date(assignment.dueAt).toLocaleDateString() : 'none'}
                            </span>
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="teacher-surface teacher-copy rounded-3xl px-4 py-5 text-sm">
                        No classroom gameplay is scheduled yet. Build a room and assign it from the lesson builder when
                        this roster is ready.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="glass-panel teacher-copy p-6 text-sm">
              Create a classroom first, then this page becomes the control center for roster updates and handoff into
              the room builder.
            </div>
          )}
        </article>
      </section>
    </div>
  );
};
