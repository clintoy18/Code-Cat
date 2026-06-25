import { useEffect, useMemo, useState } from 'react';
import { AssignmentTargetType } from '@shared/types/teacher';
import {
  buildOfficialAssignmentOptions,
  useCreateAssignmentMutation,
  useCreateClassroomMutation,
  useEnrollStudentsMutation,
  useTeacherClassroomQuery,
  useTeacherClassroomsQuery,
  useTeacherRoomsQuery,
  useTeacherStudentsQuery,
} from '@/features/teacher';

const todayDateValue = new Date().toISOString().slice(0, 16);
const nextWeekDateValue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

export const Students = () => {
  const studentsQuery = useTeacherStudentsQuery();
  const classroomsQuery = useTeacherClassroomsQuery();
  const roomsQuery = useTeacherRoomsQuery();
  const createClassroomMutation = useCreateClassroomMutation();

  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  const [classroomForm, setClassroomForm] = useState({
    name: '',
    description: '',
    isPrivate: true,
    requiresApproval: false,
    studentIds: [] as string[],
  });
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    targetType: AssignmentTargetType.OFFICIAL_WORLD,
    officialWorldId: '',
    officialPuzzleId: '',
    customRoomVersionId: '',
    startAt: todayDateValue,
    dueAt: nextWeekDateValue,
  });
  const [enrollmentDraft, setEnrollmentDraft] = useState<string[]>([]);

  const classrooms = useMemo(() => classroomsQuery.data ?? [], [classroomsQuery.data]);
  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);
  const roomVersions = useMemo(() => roomsQuery.data ?? [], [roomsQuery.data]);
  const officialOptions = useMemo(() => buildOfficialAssignmentOptions(), []);

  useEffect(() => {
    if (!selectedClassroomId && classrooms[0]) {
      setSelectedClassroomId(classrooms[0].id);
    }
  }, [classrooms, selectedClassroomId]);

  const classroomDetailQuery = useTeacherClassroomQuery(selectedClassroomId);
  const enrollStudentsMutation = useEnrollStudentsMutation(selectedClassroomId);
  const createAssignmentMutation = useCreateAssignmentMutation(selectedClassroomId);
  const selectedClassroom = classroomDetailQuery.data?.classroom ?? null;
  const selectedOfficialWorld = officialOptions.find((entry) => entry.worldId === assignmentForm.officialWorldId) ?? null;
  const selectedOfficialPuzzle =
    selectedOfficialWorld?.puzzles.find((entry) => entry.officialPuzzleId === assignmentForm.officialPuzzleId) ??
    officialOptions.flatMap((entry) => entry.puzzles).find((entry) => entry.officialPuzzleId === assignmentForm.officialPuzzleId) ??
    null;

  const submitClassroom = async () => {
    await createClassroomMutation.mutateAsync({
      ...classroomForm,
      studentIds: classroomForm.studentIds,
    });

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

  const submitAssignment = async () => {
    if (!selectedClassroomId) {
      return;
    }

    const payload =
      assignmentForm.targetType === AssignmentTargetType.CUSTOM_ROOM
        ? {
            title: assignmentForm.title,
            description: assignmentForm.description || null,
            targetType: assignmentForm.targetType,
            customRoomVersionId: assignmentForm.customRoomVersionId,
            startAt: new Date(assignmentForm.startAt).toISOString(),
            dueAt: assignmentForm.dueAt ? new Date(assignmentForm.dueAt).toISOString() : null,
          }
        : assignmentForm.targetType === AssignmentTargetType.OFFICIAL_WORLD
          ? {
              title: assignmentForm.title,
              description: assignmentForm.description || null,
              targetType: assignmentForm.targetType,
              officialWorldId: assignmentForm.officialWorldId,
              roomManifest: selectedOfficialWorld?.puzzles ?? [],
              startAt: new Date(assignmentForm.startAt).toISOString(),
              dueAt: assignmentForm.dueAt ? new Date(assignmentForm.dueAt).toISOString() : null,
            }
          : {
              title: assignmentForm.title,
              description: assignmentForm.description || null,
              targetType: assignmentForm.targetType,
              officialPuzzleId: assignmentForm.officialPuzzleId,
              roomManifest: selectedOfficialPuzzle ? [selectedOfficialPuzzle] : [],
              startAt: new Date(assignmentForm.startAt).toISOString(),
              dueAt: assignmentForm.dueAt ? new Date(assignmentForm.dueAt).toISOString() : null,
            };

    await createAssignmentMutation.mutateAsync(payload);
    setAssignmentForm({
      title: '',
      description: '',
      targetType: AssignmentTargetType.OFFICIAL_WORLD,
      officialWorldId: '',
      officialPuzzleId: '',
      customRoomVersionId: '',
      startAt: todayDateValue,
      dueAt: nextWeekDateValue,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="teacher-kicker text-sm font-semibold uppercase tracking-[0.3em]">Classroom Manager</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Create rooms, enroll students, and assign gameplay.</h1>
        <p className="teacher-copy mt-3 max-w-3xl text-sm">
          The teacher workflow is centered here so roster setup and assignment delivery stay visible at the same time.
          That reduces context switching compared with a separated students page and lessons page.
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
                {students.map((student) => (
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
                ))}
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
              {classrooms.map((classroom) => (
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
              ))}
            </div>
          </div>

          {selectedClassroom ? (
            <div className="grid gap-4 xl:grid-cols-2">
              <section className="glass-panel p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="teacher-kicker text-sm uppercase tracking-[0.28em]">Roster</p>
                    <h2 className="mt-2 font-display text-2xl font-bold">{selectedClassroom.name}</h2>
                  </div>
                  <span className="teacher-chip">
                    {classroomDetailQuery.data?.enrollments.length ?? 0} enrolled
                  </span>
                </div>
                <div className="mt-5 max-h-64 space-y-2 overflow-y-auto">
                  {classroomDetailQuery.data?.enrollments.map((entry) => (
                    <article key={entry.id} className="teacher-surface rounded-2xl px-4 py-3">
                      <p className="text-sm font-semibold text-[var(--text-0)]">{entry.student.username}</p>
                      <p className="mt-1 text-xs text-[var(--text-2)]">{entry.student.email}</p>
                    </article>
                  ))}
                </div>
                <div className="mt-5 space-y-3">
                  <p className="teacher-label text-sm font-semibold">Add more students</p>
                  <div className="teacher-surface max-h-52 space-y-2 overflow-y-auto rounded-3xl p-3">
                    {students
                      .filter(
                        (student) =>
                          !classroomDetailQuery.data?.enrollments.some((entry) => entry.student.id === student.id),
                      )
                      .map((student) => (
                        <label key={student.id} className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2 hover:bg-white/5">
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-0)]">{student.username}</p>
                            <p className="text-xs text-[var(--text-2)]">{student.email}</p>
                          </div>
                          <input
                            type="checkbox"
                            aria-label={`Enroll ${student.username} into ${selectedClassroom?.name ?? 'classroom'}`}
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
                      ))}
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
              </section>

              <section className="glass-panel p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="teacher-kicker text-sm uppercase tracking-[0.28em]">Assignments</p>
                    <h2 className="mt-2 font-display text-2xl font-bold">Schedule official or custom gameplay</h2>
                  </div>
                  <span className="teacher-chip">
                    Start + due
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="teacher-label text-sm font-semibold">Title</span>
                    <input
                      value={assignmentForm.title}
                      onChange={(event) => setAssignmentForm((current) => ({ ...current, title: event.target.value }))}
                      className="teacher-field mt-2"
                      placeholder="Loop review sprint"
                    />
                  </label>

                  <label className="block">
                    <span className="teacher-label text-sm font-semibold">Assignment note</span>
                    <textarea
                      value={assignmentForm.description}
                      onChange={(event) =>
                        setAssignmentForm((current) => ({ ...current, description: event.target.value }))
                      }
                      className="teacher-field mt-2 min-h-24"
                      placeholder="Use this to focus students on efficiency, helper reuse, or debugging notes."
                    />
                  </label>

                  <label className="block">
                    <span className="teacher-label text-sm font-semibold">Target type</span>
                    <select
                      value={assignmentForm.targetType}
                      onChange={(event) =>
                        setAssignmentForm((current) => ({
                          ...current,
                          targetType: event.target.value as AssignmentTargetType,
                        }))
                      }
                      className="teacher-field mt-2"
                    >
                      <option value={AssignmentTargetType.OFFICIAL_WORLD}>Official world</option>
                      <option value={AssignmentTargetType.OFFICIAL_PUZZLE}>Single official room</option>
                      <option value={AssignmentTargetType.CUSTOM_ROOM}>Custom room</option>
                    </select>
                  </label>

                  {assignmentForm.targetType === AssignmentTargetType.OFFICIAL_WORLD ? (
                    <label className="block">
                      <span className="teacher-label text-sm font-semibold">Official world</span>
                      <select
                        value={assignmentForm.officialWorldId}
                        onChange={(event) =>
                          setAssignmentForm((current) => ({
                            ...current,
                            officialWorldId: event.target.value,
                            officialPuzzleId: '',
                          }))
                        }
                        className="teacher-field mt-2"
                      >
                        <option value="">Select a world</option>
                        {officialOptions.map((option) => (
                          <option key={option.worldId} value={option.worldId}>
                            {option.worldTitle}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  {assignmentForm.targetType === AssignmentTargetType.OFFICIAL_PUZZLE ? (
                    <label className="block">
                      <span className="teacher-label text-sm font-semibold">Official room</span>
                      <select
                        value={assignmentForm.officialPuzzleId}
                        onChange={(event) =>
                          setAssignmentForm((current) => ({
                            ...current,
                            officialPuzzleId: event.target.value,
                          }))
                        }
                        className="teacher-field mt-2"
                      >
                        <option value="">Select a room</option>
                        {officialOptions.flatMap((option) =>
                          option.puzzles.map((puzzle) => (
                            <option key={puzzle.roomKey} value={puzzle.officialPuzzleId}>
                              {option.worldTitle} / {puzzle.title}
                            </option>
                          )),
                        )}
                      </select>
                    </label>
                  ) : null}

                  {assignmentForm.targetType === AssignmentTargetType.CUSTOM_ROOM ? (
                    <label className="block">
                      <span className="teacher-label text-sm font-semibold">Published custom room</span>
                      <select
                        value={assignmentForm.customRoomVersionId}
                        onChange={(event) =>
                          setAssignmentForm((current) => ({
                            ...current,
                            customRoomVersionId: event.target.value,
                          }))
                        }
                        className="teacher-field mt-2"
                      >
                        <option value="">Select a custom room</option>
                        {roomVersions
                          .filter((room) => room.lifecycleStatus === 'PUBLISHED')
                          .map((room) => (
                            <option key={room.id} value={room.id}>
                              {room.title} / v{room.versionNumber}
                            </option>
                          ))}
                      </select>
                    </label>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="teacher-label text-sm font-semibold">Start at</span>
                      <input
                        type="datetime-local"
                        value={assignmentForm.startAt}
                        onChange={(event) =>
                          setAssignmentForm((current) => ({ ...current, startAt: event.target.value }))
                        }
                        className="teacher-field mt-2"
                      />
                    </label>
                    <label className="block">
                      <span className="teacher-label text-sm font-semibold">Due at</span>
                      <input
                        type="datetime-local"
                        value={assignmentForm.dueAt}
                        onChange={(event) =>
                          setAssignmentForm((current) => ({ ...current, dueAt: event.target.value }))
                        }
                        className="teacher-field mt-2"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={submitAssignment}
                    disabled={createAssignmentMutation.isPending}
                    className="teacher-button-primary w-full"
                  >
                    {createAssignmentMutation.isPending ? 'Assigning...' : 'Create assignment'}
                  </button>
                </div>

                <div className="mt-6 space-y-3">
                  {(classroomDetailQuery.data?.assignments ?? []).map((assignment) => (
                    <article key={assignment.id} className="teacher-surface rounded-2xl px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display text-xl font-bold text-[var(--color-ink)]">{assignment.title}</h3>
                          <p className="teacher-copy mt-2 text-sm">{assignment.description ?? 'No extra note.'}</p>
                        </div>
                        <span className="teacher-tag">
                          {assignment.targetType.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-2)]">
                        <span>{assignment.roomManifest.length} rooms</span>
                        <span>Starts {new Date(assignment.startAt).toLocaleDateString()}</span>
                        <span>
                          Due {assignment.dueAt ? new Date(assignment.dueAt).toLocaleDateString() : 'none'}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="glass-panel teacher-copy p-6 text-sm">
              Create a classroom first, then this page becomes the control center for roster changes and assignment
              scheduling.
            </div>
          )}
        </article>
      </section>
    </div>
  );
};
