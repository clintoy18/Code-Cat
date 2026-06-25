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
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">Classroom Manager</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Create rooms, enroll students, and assign gameplay.</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-700">
          The teacher workflow is centered here so roster setup and assignment delivery stay visible at the same time.
          That reduces context switching compared with a separated students page and lessons page.
        </p>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <article className="glass-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-brand-700">New Classroom</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Seed the roster at creation time</h2>
            </div>
            <span className="rounded-full bg-brand-100 px-4 py-2 text-sm font-semibold text-brand-700">
              Existing accounts only
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Classroom name</span>
              <input
                value={classroomForm.name}
                onChange={(event) => setClassroomForm((current) => ({ ...current, name: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-[var(--color-line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                placeholder="World 3 Loop Workshop"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Description</span>
              <textarea
                value={classroomForm.description}
                onChange={(event) => setClassroomForm((current) => ({ ...current, description: event.target.value }))}
                className="mt-2 min-h-28 w-full rounded-2xl border border-[var(--color-line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                placeholder="Students practice loops, route planning, and cleaner reuse before moving into helper functions."
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-white/75 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={classroomForm.isPrivate}
                  onChange={(event) => setClassroomForm((current) => ({ ...current, isPrivate: event.target.checked }))}
                />
                Private to teacher
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-white/75 px-4 py-3 text-sm text-slate-700">
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
              <p className="text-sm font-semibold text-slate-700">Initial students</p>
              <div className="mt-2 max-h-64 space-y-2 overflow-y-auto rounded-3xl border border-[var(--color-line)] bg-white/75 p-3">
                {students.map((student) => (
                  <label key={student.id} className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2 hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{student.username}</p>
                      <p className="text-xs text-slate-500">{student.email}</p>
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
              className="w-full rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createClassroomMutation.isPending ? 'Creating classroom...' : 'Create classroom'}
            </button>
          </div>
        </article>

        <article className="space-y-4">
          <div className="glass-panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-brand-700">Classrooms</p>
                <h2 className="mt-2 font-display text-2xl font-bold">Pick an active classroom</h2>
              </div>
              <span className="rounded-full bg-brand-100 px-4 py-2 text-sm font-semibold text-brand-700">
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
                      ? 'border-brand-400 bg-brand-50/80'
                      : 'border-[var(--color-line)] bg-white/75 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl font-bold text-[var(--color-ink)]">{classroom.name}</h3>
                      <p className="mt-2 text-sm text-slate-600">{classroom.description}</p>
                    </div>
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white">
                      {classroom.isPrivate ? 'Private' : 'Open'}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
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
                    <p className="text-sm uppercase tracking-[0.28em] text-brand-700">Roster</p>
                    <h2 className="mt-2 font-display text-2xl font-bold">{selectedClassroom.name}</h2>
                  </div>
                  <span className="rounded-full bg-brand-100 px-4 py-2 text-sm font-semibold text-brand-700">
                    {classroomDetailQuery.data?.enrollments.length ?? 0} enrolled
                  </span>
                </div>
                <div className="mt-5 max-h-64 space-y-2 overflow-y-auto">
                  {classroomDetailQuery.data?.enrollments.map((entry) => (
                    <article key={entry.id} className="rounded-2xl border border-[var(--color-line)] bg-white/75 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-800">{entry.student.username}</p>
                      <p className="mt-1 text-xs text-slate-500">{entry.student.email}</p>
                    </article>
                  ))}
                </div>
                <div className="mt-5 space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Add more students</p>
                  <div className="max-h-52 space-y-2 overflow-y-auto rounded-3xl border border-[var(--color-line)] bg-white/70 p-3">
                    {students
                      .filter(
                        (student) =>
                          !classroomDetailQuery.data?.enrollments.some((entry) => entry.student.id === student.id),
                      )
                      .map((student) => (
                        <label key={student.id} className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2 hover:bg-slate-50">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{student.username}</p>
                            <p className="text-xs text-slate-500">{student.email}</p>
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
                    className="w-full rounded-2xl border border-[var(--color-line)] bg-white/85 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {enrollStudentsMutation.isPending ? 'Enrolling...' : 'Enroll selected students'}
                  </button>
                </div>
              </section>

              <section className="glass-panel p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-brand-700">Assignments</p>
                    <h2 className="mt-2 font-display text-2xl font-bold">Schedule official or custom gameplay</h2>
                  </div>
                  <span className="rounded-full bg-brand-100 px-4 py-2 text-sm font-semibold text-brand-700">
                    Start + due
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Title</span>
                    <input
                      value={assignmentForm.title}
                      onChange={(event) => setAssignmentForm((current) => ({ ...current, title: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-[var(--color-line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                      placeholder="Loop review sprint"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Assignment note</span>
                    <textarea
                      value={assignmentForm.description}
                      onChange={(event) =>
                        setAssignmentForm((current) => ({ ...current, description: event.target.value }))
                      }
                      className="mt-2 min-h-24 w-full rounded-2xl border border-[var(--color-line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                      placeholder="Use this to focus students on efficiency, helper reuse, or debugging notes."
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Target type</span>
                    <select
                      value={assignmentForm.targetType}
                      onChange={(event) =>
                        setAssignmentForm((current) => ({
                          ...current,
                          targetType: event.target.value as AssignmentTargetType,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-[var(--color-line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                    >
                      <option value={AssignmentTargetType.OFFICIAL_WORLD}>Official world</option>
                      <option value={AssignmentTargetType.OFFICIAL_PUZZLE}>Single official room</option>
                      <option value={AssignmentTargetType.CUSTOM_ROOM}>Custom room</option>
                    </select>
                  </label>

                  {assignmentForm.targetType === AssignmentTargetType.OFFICIAL_WORLD ? (
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Official world</span>
                      <select
                        value={assignmentForm.officialWorldId}
                        onChange={(event) =>
                          setAssignmentForm((current) => ({
                            ...current,
                            officialWorldId: event.target.value,
                            officialPuzzleId: '',
                          }))
                        }
                        className="mt-2 w-full rounded-2xl border border-[var(--color-line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
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
                      <span className="text-sm font-semibold text-slate-700">Official room</span>
                      <select
                        value={assignmentForm.officialPuzzleId}
                        onChange={(event) =>
                          setAssignmentForm((current) => ({
                            ...current,
                            officialPuzzleId: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-2xl border border-[var(--color-line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
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
                      <span className="text-sm font-semibold text-slate-700">Published custom room</span>
                      <select
                        value={assignmentForm.customRoomVersionId}
                        onChange={(event) =>
                          setAssignmentForm((current) => ({
                            ...current,
                            customRoomVersionId: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-2xl border border-[var(--color-line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
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
                      <span className="text-sm font-semibold text-slate-700">Start at</span>
                      <input
                        type="datetime-local"
                        value={assignmentForm.startAt}
                        onChange={(event) =>
                          setAssignmentForm((current) => ({ ...current, startAt: event.target.value }))
                        }
                        className="mt-2 w-full rounded-2xl border border-[var(--color-line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Due at</span>
                      <input
                        type="datetime-local"
                        value={assignmentForm.dueAt}
                        onChange={(event) =>
                          setAssignmentForm((current) => ({ ...current, dueAt: event.target.value }))
                        }
                        className="mt-2 w-full rounded-2xl border border-[var(--color-line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={submitAssignment}
                    disabled={createAssignmentMutation.isPending}
                    className="w-full rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {createAssignmentMutation.isPending ? 'Assigning...' : 'Create assignment'}
                  </button>
                </div>

                <div className="mt-6 space-y-3">
                  {(classroomDetailQuery.data?.assignments ?? []).map((assignment) => (
                    <article key={assignment.id} className="rounded-2xl border border-[var(--color-line)] bg-white/75 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display text-xl font-bold text-[var(--color-ink)]">{assignment.title}</h3>
                          <p className="mt-2 text-sm text-slate-600">{assignment.description ?? 'No extra note.'}</p>
                        </div>
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white">
                          {assignment.targetType.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
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
            <div className="glass-panel p-6 text-sm text-slate-600">
              Create a classroom first, then this page becomes the control center for roster changes and assignment
              scheduling.
            </div>
          )}
        </article>
      </section>
    </div>
  );
};
