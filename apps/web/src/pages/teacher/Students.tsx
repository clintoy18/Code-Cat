import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, PaginationControls } from '@/components/shared';
import {
  useCreateClassroomMutation,
  useEnrollStudentsMutation,
  useTeacherClassroomQuery,
  useTeacherClassroomsQuery,
  useTeacherStudentsQuery,
} from '@/features/teacher';
import { getApiErrorMessage } from '@/lib/api';
import { useToastStore } from '@/store/toastStore';

export const Students = () => {
  const [studentsPage, setStudentsPage] = useState(1);
  const [classroomsPage, setClassroomsPage] = useState(1);
  const [enrollmentsPage, setEnrollmentsPage] = useState(1);
  const [assignmentsPage, setAssignmentsPage] = useState(1);
  const [availableStudentsPage, setAvailableStudentsPage] = useState(1);
  const studentsQuery = useTeacherStudentsQuery({ page: studentsPage, pageSize: 12 });
  const classroomsQuery = useTeacherClassroomsQuery({ page: classroomsPage, pageSize: 8 });
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
  const showToast = useToastStore((state) => state.showToast);

  const classrooms = useMemo(() => classroomsQuery.data?.items ?? [], [classroomsQuery.data]);
  const students = useMemo(() => studentsQuery.data?.items ?? [], [studentsQuery.data]);

  useEffect(() => {
    if (!selectedClassroomId && classrooms[0]) {
      setSelectedClassroomId(classrooms[0].id);
    }
  }, [classrooms, selectedClassroomId]);

  useEffect(() => {
    setEnrollmentsPage(1);
    setAssignmentsPage(1);
    setAvailableStudentsPage(1);
  }, [selectedClassroomId]);

  const classroomDetailQuery = useTeacherClassroomQuery(selectedClassroomId, {
    enrollmentsPage,
    enrollmentsPageSize: 10,
    assignmentsPage,
    assignmentsPageSize: 10,
  });
  const classroomStudentsQuery = useTeacherStudentsQuery({
    page: availableStudentsPage,
    pageSize: 12,
    classroomId: selectedClassroomId ?? undefined,
  });
  const enrollStudentsMutation = useEnrollStudentsMutation(selectedClassroomId);
  const selectedClassroom = classroomDetailQuery.data?.classroom ?? null;
  const unenrolledStudents = useMemo(
    () => (classroomStudentsQuery.data?.items ?? []).filter((student) => !student.isEnrolledInClassroom),
    [classroomStudentsQuery.data],
  );

  const submitClassroom = async () => {
    try {
      const classroom = await createClassroomMutation.mutateAsync({
        ...classroomForm,
        studentIds: classroomForm.studentIds,
      });
      setSelectedClassroomId(classroom.id);
      setClassroomsPage(1);

      setClassroomForm({
        name: '',
        description: '',
        isPrivate: true,
        requiresApproval: false,
        studentIds: [],
      });

      showToast({
        tone: 'success',
        title: 'Classroom created',
        description: `${classroom.name} is ready for roster setup and classroom gameplay.`,
      });
    } catch (error) {
      showToast({
        tone: 'error',
        title: 'Classroom not created',
        description: getApiErrorMessage(error, 'The classroom setup failed. Check the form and try again.'),
      });
    }
  };

  const submitEnrollment = async () => {
    if (!selectedClassroomId || !enrollmentDraft.length) {
      return;
    }

    try {
      await enrollStudentsMutation.mutateAsync(enrollmentDraft);
      setEnrollmentDraft([]);
      setEnrollmentsPage(1);

      showToast({
        tone: 'success',
        title: 'Roster updated',
        description: `${enrollmentDraft.length} student${enrollmentDraft.length === 1 ? '' : 's'} added to ${
          selectedClassroom?.name ?? 'the classroom'
        }.`,
      });
    } catch (error) {
      showToast({
        tone: 'error',
        title: 'Roster update failed',
        description: getApiErrorMessage(error, 'The selected students could not be enrolled right now.'),
      });
    }
  };

  const submitSingleEnrollment = async () => {
    if (!selectedClassroomId || !singleEnrollmentStudentId) {
      return;
    }

    const studentLabel =
      unenrolledStudents.find((student) => student.id === singleEnrollmentStudentId)?.username ?? 'Student';

    try {
      await enrollStudentsMutation.mutateAsync([singleEnrollmentStudentId]);
      setSingleEnrollmentStudentId('');
      setEnrollmentsPage(1);

      showToast({
        tone: 'success',
        title: 'Student enrolled',
        description: `${studentLabel} can now access gameplay from ${selectedClassroom?.name ?? 'this classroom'}.`,
      });
    } catch (error) {
      showToast({
        tone: 'error',
        title: 'Enrollment failed',
        description: getApiErrorMessage(error, 'That student could not be enrolled right now.'),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="teacher-kicker">Classroom Manager</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Create the classroom, then hand it off to classroom gameplay.</h1>
        <p className="teacher-copy mt-3 max-w-3xl text-sm">
          This page owns classroom setup and roster management. Once a classroom exists, the builder page is where the
          teacher either assigns built-in gameplay or creates a custom classroom level for enrolled students.
        </p>
      </div>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="glass-panel p-5">
          <p className="teacher-kicker">Create</p>
          <h2 className="mt-3 font-display text-2xl font-bold">Set up the classroom</h2>
          <p className="teacher-copy mt-3 text-sm">
            Add the classroom name, lesson description, and optional initial students.
          </p>
        </article>
        <article className="glass-panel p-5">
          <p className="teacher-kicker">Build</p>
          <h2 className="mt-3 font-display text-2xl font-bold">Create or assign gameplay</h2>
          <p className="teacher-copy mt-3 text-sm">
            Use the classroom builder to assign an existing official level or publish a custom room into that
            classroom.
          </p>
        </article>
        <article className="glass-panel p-5">
          <p className="teacher-kicker">Enroll</p>
          <h2 className="mt-3 font-display text-2xl font-bold">Manage the roster</h2>
          <p className="teacher-copy mt-3 text-sm">
            Add one learner quickly or bulk-enroll the remaining students so they can automatically see classroom
            gameplay.
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <article className="glass-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="teacher-kicker">New Classroom</p>
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
                  <EmptyState
                    description="Student accounts will appear here after they are created, then you can add them to the initial classroom roster."
                  />
                )}
              </div>
              <PaginationControls
                page={studentsQuery.data?.pagination.page ?? 1}
                totalPages={studentsQuery.data?.pagination.totalPages ?? 1}
                totalItems={studentsQuery.data?.pagination.totalItems ?? students.length}
                pageSize={studentsQuery.data?.pagination.pageSize ?? 12}
                onPageChange={setStudentsPage}
              />
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
                <p className="teacher-kicker">Classrooms</p>
                <h2 className="mt-2 font-display text-2xl font-bold">Pick an active classroom</h2>
              </div>
              <span className="teacher-chip">
                {classroomsQuery.data?.pagination.totalItems ?? classrooms.length} total
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
                <EmptyState
                  className="teacher-surface teacher-surface--muted md:col-span-2"
                  description="Classrooms will appear here after you create the first one on the left. Roster management and classroom gameplay delivery unlock after that."
                />
              )}
            </div>
            <PaginationControls
              page={classroomsQuery.data?.pagination.page ?? 1}
              totalPages={classroomsQuery.data?.pagination.totalPages ?? 1}
              totalItems={classroomsQuery.data?.pagination.totalItems ?? classrooms.length}
              pageSize={classroomsQuery.data?.pagination.pageSize ?? 8}
              onPageChange={setClassroomsPage}
            />
          </div>

          {selectedClassroom ? (
            <div className="space-y-4">
              <section className="glass-panel min-w-0 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="teacher-kicker">Roster</p>
                    <h2 className="mt-2 font-display text-2xl font-bold">{selectedClassroom.name}</h2>
                    <p className="teacher-copy mt-3 text-sm">
                      Finish roster changes here before creating classroom gameplay for this room.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="teacher-chip">
                      {classroomDetailQuery.data?.enrollments.pagination.totalItems ?? 0} enrolled
                    </span>
                    <span className="teacher-chip">{selectedClassroom.isPrivate ? 'Private' : 'Open'}</span>
                  </div>
                </div>
                <div className="mt-5 grid gap-4">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="teacher-label text-sm font-semibold">Current students</p>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-2)]">
                        {classroomDetailQuery.data?.enrollments.pagination.totalItems ?? 0} seats used
                      </span>
                    </div>
                    <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                      {classroomDetailQuery.data?.enrollments.items.length ? (
                        classroomDetailQuery.data.enrollments.items.map((entry) => (
                          <article key={entry.id} className="teacher-surface rounded-2xl px-4 py-3">
                            <p className="text-sm font-semibold text-[var(--text-0)]">{entry.student.username}</p>
                            <p className="mt-1 text-xs text-[var(--text-2)]">{entry.student.email}</p>
                          </article>
                        ))
                      ) : (
                        <EmptyState
                          className="teacher-surface teacher-surface--muted"
                          description="Enrolled students will appear here after you add them to this classroom. Use single enroll for a quick start or bulk enroll for the full roster."
                        />
                      )}
                    </div>
                    <PaginationControls
                      page={classroomDetailQuery.data?.enrollments.pagination.page ?? 1}
                      totalPages={classroomDetailQuery.data?.enrollments.pagination.totalPages ?? 1}
                      totalItems={classroomDetailQuery.data?.enrollments.pagination.totalItems ?? 0}
                      pageSize={classroomDetailQuery.data?.enrollments.pagination.pageSize ?? 10}
                      onPageChange={setEnrollmentsPage}
                    />
                  </div>

                  <div className="teacher-surface min-w-0 rounded-3xl p-4">
                    <div className="space-y-4">
                      <div>
                        <p className="teacher-kicker">Add Students</p>
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
                          {!unenrolledStudents.length ? (
                            <EmptyState
                              className="teacher-surface teacher-surface--muted"
                              description="Students available for quick enrollment will appear here after you create more accounts or choose a classroom with open seats."
                            />
                          ) : null}
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
                            <EmptyState
                              description="Students available for bulk enrollment will appear here once this classroom has open seats."
                            />
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
                        <PaginationControls
                          page={classroomStudentsQuery.data?.pagination.page ?? 1}
                          totalPages={classroomStudentsQuery.data?.pagination.totalPages ?? 1}
                          totalItems={classroomStudentsQuery.data?.pagination.totalItems ?? unenrolledStudents.length}
                          pageSize={classroomStudentsQuery.data?.pagination.pageSize ?? 12}
                          onPageChange={setAvailableStudentsPage}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="glass-panel min-w-0 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="teacher-kicker">Scheduled Gameplays</p>
                    <h2 className="mt-2 font-display text-2xl font-bold">What students will see next</h2>
                    <p className="teacher-copy mt-3 text-sm">
                      Use the builder to either assign official gameplay or publish a custom classroom level for this
                      roster.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="teacher-chip">
                      {classroomDetailQuery.data?.assignments.pagination.totalItems ?? 0} live
                    </span>
                    <span className="teacher-chip">
                      {selectedClassroom.isPrivate ? 'Private room' : 'Open room'}
                    </span>
                    <Link
                      to={`/teacher/lessons?classroomId=${selectedClassroom.id}`}
                      className="teacher-button-primary"
                    >
                      Create or assign level
                    </Link>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {(classroomDetailQuery.data?.assignments.items ?? []).length ? (
                    classroomDetailQuery.data?.assignments.items.map((assignment) => (
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
                    <EmptyState
                      className="teacher-surface teacher-surface--muted"
                      description="Classroom gameplay will appear here after you assign an official level or publish a custom classroom room for this roster."
                    />
                  )}
                </div>
                <PaginationControls
                  page={classroomDetailQuery.data?.assignments.pagination.page ?? 1}
                  totalPages={classroomDetailQuery.data?.assignments.pagination.totalPages ?? 1}
                  totalItems={classroomDetailQuery.data?.assignments.pagination.totalItems ?? 0}
                  pageSize={classroomDetailQuery.data?.assignments.pagination.pageSize ?? 10}
                  onPageChange={setAssignmentsPage}
                />
              </section>
            </div>
          ) : (
            <div className="glass-panel p-6">
              <EmptyState description="Create a classroom first. Roster management and the handoff into the room builder will appear here after that." />
            </div>
          )}
        </article>
      </section>
    </div>
  );
};
