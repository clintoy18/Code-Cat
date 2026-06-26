import { useEffect, useMemo, useState } from 'react';
import {
  AssignmentTargetType,
  RoomLifecycleStatus,
  type GameCondition,
  type LessonTopic,
  type RoomDifficulty,
} from '@shared/types/teacher';
import { useSearchParams } from 'react-router-dom';
import { PaginationControls } from '@/components/shared';
import {
  blockPresetCatalog,
  buildTeacherBlocksFromPresetSelection,
  useCreateAssignmentMutation,
  useCreateRoomMutation,
  useTeacherClassroomsQuery,
  useTeacherRoomsQuery,
} from '@/features/teacher';
import {
  RoomLayoutEditor,
  type IRoomLayoutDraft,
} from '@/features/teacher/RoomLayoutEditor';

type RoomBuilderFormState = {
  baseVersionId: string;
  title: string;
  description: string;
  objective: string;
  lessonTag: LessonTopic;
  difficulty: RoomDifficulty;
  parMoves: number;
  codeBudget: number;
  lifecycleStatus: RoomLifecycleStatus;
  layout: IRoomLayoutDraft;
  selectedPresetIds: string[];
  helperName: string;
  repeatCount: number;
  whileCondition: GameCondition;
};

const todayDateValue = new Date().toISOString().slice(0, 16);
const nextWeekDateValue = new Date(
  Date.now() + 7 * 24 * 60 * 60 * 1000,
).toISOString().slice(0, 16);
const builderSteps = [
  {
    title: 'Pick classroom',
    description: 'Choose the classroom that should receive the level after publish.',
  },
  {
    title: 'Build level',
    description: 'Set the layout, objective, and scoring limits in one pass.',
  },
  {
    title: 'Assign gameplay',
    description: 'Publish the level into a student-playable classroom gameplay.',
  },
];

export const Lessons = () => {
  const [searchParams] = useSearchParams();
  const classroomIdFromSearch = searchParams.get('classroomId');
  const [classroomsPage, setClassroomsPage] = useState(1);
  const [roomVersionsPage, setRoomVersionsPage] = useState(1);
  const classroomsQuery = useTeacherClassroomsQuery({ page: classroomsPage, pageSize: 12 });
  const roomsQuery = useTeacherRoomsQuery({ page: roomVersionsPage, pageSize: 12 });
  const createRoomMutation = useCreateRoomMutation();
  const classrooms = useMemo(
    () => classroomsQuery.data?.items ?? [],
    [classroomsQuery.data],
  );
  const roomVersions = useMemo(() => roomsQuery.data?.items ?? [], [roomsQuery.data]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>(
    classroomIdFromSearch ?? '',
  );
  const [form, setForm] = useState<RoomBuilderFormState>({
    baseVersionId: '',
    title: '',
    description: '',
    objective: '',
    lessonTag: 'Loops',
    difficulty: 'Medium',
    parMoves: 6,
    codeBudget: 6,
    lifecycleStatus: RoomLifecycleStatus.PUBLISHED,
    layout: {
      rows: 5,
      cols: 5,
      start: { row: 4, col: 0 },
      door: { row: 0, col: 4 },
      key: null,
      doorRequiresKey: false,
      walls: [],
    },
    selectedPresetIds: ['move-up', 'move-right', 'repeat'],
    helperName: 'helperStep',
    repeatCount: 2,
    whileCondition: 'PATH_UP_CLEAR',
  });
  const [assignmentDraft, setAssignmentDraft] = useState({
    title: '',
    description: '',
    startAt: todayDateValue,
    dueAt: nextWeekDateValue,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createAssignmentMutation = useCreateAssignmentMutation(
    selectedClassroomId || null,
  );
  const selectedClassroom =
    classrooms.find((classroom) => classroom.id === selectedClassroomId) ?? null;
  const willPublishToClassroom = Boolean(selectedClassroomId);

  useEffect(() => {
    if (!selectedClassroomId && classrooms[0]) {
      setSelectedClassroomId(classrooms[0].id);
    }
  }, [classrooms, selectedClassroomId]);

  const hydrateFromRoom = (roomId: string) => {
    const room = roomVersions.find((entry) => entry.id === roomId);

    if (!room) {
      return;
    }

    setForm({
      baseVersionId: room.id,
      title: room.title,
      description: room.description,
      objective: room.objective,
      lessonTag: room.lessonTag,
      difficulty: room.difficulty,
      parMoves: room.parMoves,
      codeBudget: room.codeBudget,
      lifecycleStatus: room.lifecycleStatus,
      layout: {
        rows: room.definition.rows,
        cols: room.definition.cols,
        start: room.definition.start,
        door: room.definition.door,
        key: room.definition.key ?? null,
        doorRequiresKey: Boolean(room.definition.doorRequiresKey),
        walls: room.definition.walls,
      },
      selectedPresetIds: room.definition.availableBlocks.some((block) => block.kind === 'FUNCTION_DEF')
        ? ['helper']
        : room.definition.availableBlocks.map((block) => block.key),
      helperName:
        room.definition.availableBlocks.find((block) => block.kind === 'FUNCTION_DEF' || block.kind === 'FUNCTION_CALL')
          ?.key
          ?.replace('function-def-', '')
          .replace('function-call-', '') ?? 'helperStep',
      repeatCount:
        room.definition.availableBlocks.find((block) => block.kind === 'REPEAT' && 'repeatCount' in block)?.repeatCount ??
        2,
      whileCondition:
        room.definition.availableBlocks.find((block) => block.kind === 'WHILE' && 'condition' in block)?.condition ??
        'PATH_UP_CLEAR',
    });
  };

  const submitRoom = async () => {
    setSubmitError(null);

    if (
      willPublishToClassroom &&
      form.lifecycleStatus !== RoomLifecycleStatus.PUBLISHED
    ) {
      setSubmitError(
        'Rooms must be published before they can be attached to a classroom.',
      );
      return;
    }

    const definition = {
      rows: Number(form.layout.rows),
      cols: Number(form.layout.cols),
      start: form.layout.start,
      door: form.layout.door,
      key: form.layout.key,
      doorRequiresKey: form.layout.doorRequiresKey,
      walls: form.layout.walls,
      availableBlocks: buildTeacherBlocksFromPresetSelection({
        selectedPresetIds: form.selectedPresetIds,
        helperName: form.helperName,
        repeatCount: Number(form.repeatCount),
        whileCondition: form.whileCondition,
      }),
    };

    const roomVersion = await createRoomMutation.mutateAsync({
      baseVersionId: form.baseVersionId || undefined,
      title: form.title,
      description: form.description,
      objective: form.objective,
      lessonTag: form.lessonTag,
      difficulty: form.difficulty,
      parMoves: Number(form.parMoves),
      codeBudget: Number(form.codeBudget),
      lifecycleStatus: form.lifecycleStatus,
      definition,
    });

    if (selectedClassroomId) {
      await createAssignmentMutation.mutateAsync({
        title: assignmentDraft.title.trim() || roomVersion.title,
        description:
          assignmentDraft.description.trim() || roomVersion.description || null,
        targetType: AssignmentTargetType.CUSTOM_ROOM,
        customRoomVersionId: roomVersion.id,
        startAt: new Date(assignmentDraft.startAt).toISOString(),
        dueAt: assignmentDraft.dueAt
          ? new Date(assignmentDraft.dueAt).toISOString()
          : null,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="teacher-kicker">Room Builder</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Create classroom levels for the rooms you already manage.</h1>
        <p className="teacher-copy mt-3 max-w-3xl text-sm">
          This page is the level-creation step of the teacher flow: pick a classroom, build the level, then publish it
          into classroom gameplay for enrolled students. If a student is already enrolled in that classroom, they can
          play the level as soon as it is published here.
        </p>
      </div>

      <div className="teacher-flow">
        {builderSteps.map((step, index) => (
          <article key={step.title} className="teacher-flow__step">
            <span className="teacher-flow__stepNumber">0{index + 1}</span>
            <div className="teacher-flow__stepCopy">
              <h2 className="font-display text-lg font-bold text-[var(--text-0)]">{step.title}</h2>
              <p className="teacher-copy text-sm">{step.description}</p>
            </div>
          </article>
        ))}
      </div>

      <section>
        <article className="glass-panel space-y-6 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="teacher-kicker">Classroom Level Builder</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Create or version a classroom level</h2>
            </div>
            <span className="teacher-chip">
              {roomsQuery.data?.pagination.totalItems ?? roomVersions.length} latest versions
            </span>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <section className="teacher-sectionCard">
              <div className="teacher-sectionCard__header">
                <p className="teacher-kicker">Step 1</p>
                <h3 className="mt-2 font-display text-xl font-bold">Target and version source</h3>
                <p className="teacher-copy mt-2 text-sm">
                  Start with the classroom target, then decide whether to build from a blank slate or a saved version.
                </p>
              </div>
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="teacher-label text-sm font-semibold">Target classroom</span>
                  <select
                    value={selectedClassroomId}
                    onChange={(event) => setSelectedClassroomId(event.target.value)}
                    className="teacher-field mt-2"
                  >
                    <option value="">Build room first without classroom assignment</option>
                    {classrooms.map((classroom) => (
                      <option key={classroom.id} value={classroom.id}>
                        {classroom.name}
                      </option>
                    ))}
                  </select>
                  <p className="teacher-copy mt-2 text-xs">
                    Choosing a classroom here means enrolled students can play this level as soon as you publish it.
                  </p>
                </label>
                <PaginationControls
                  page={classroomsQuery.data?.pagination.page ?? 1}
                  totalPages={classroomsQuery.data?.pagination.totalPages ?? 1}
                  totalItems={classroomsQuery.data?.pagination.totalItems ?? classrooms.length}
                  pageSize={classroomsQuery.data?.pagination.pageSize ?? 12}
                  onPageChange={setClassroomsPage}
                />
                <label className="block">
                  <span className="teacher-label text-sm font-semibold">Use base version</span>
                  <select
                    value={form.baseVersionId}
                    onChange={(event) => hydrateFromRoom(event.target.value)}
                    className="teacher-field mt-2"
                  >
                    <option value="">Start from scratch</option>
                    {roomVersions.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.title} / v{room.versionNumber}
                      </option>
                    ))}
                  </select>
                  <p className="teacher-copy mt-2 text-xs">
                    Saved versions stay in this selector, so the separate library panel is no longer necessary.
                  </p>
                </label>
                <PaginationControls
                  page={roomsQuery.data?.pagination.page ?? 1}
                  totalPages={roomsQuery.data?.pagination.totalPages ?? 1}
                  totalItems={roomsQuery.data?.pagination.totalItems ?? roomVersions.length}
                  pageSize={roomsQuery.data?.pagination.pageSize ?? 12}
                  onPageChange={setRoomVersionsPage}
                />
              </div>
            </section>

            <section className="teacher-sectionCard xl:col-span-2">
              <div className="teacher-sectionCard__header">
                <p className="teacher-kicker">Step 2</p>
                <h3 className="mt-2 font-display text-xl font-bold">Room brief</h3>
                <p className="teacher-copy mt-2 text-sm">
                  Set the player-facing lesson framing before editing the grid so the room has a clear purpose.
                </p>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <span className="teacher-label text-sm font-semibold">Room title</span>
                  <input
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    className="teacher-field mt-2"
                    placeholder="Key Ladder Lab"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="teacher-label text-sm font-semibold">Description</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    className="teacher-field mt-2 min-h-24"
                    placeholder="Students must collect a key, avoid wasted moves, and reuse the cleanest route."
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="teacher-label text-sm font-semibold">Objective</span>
                  <textarea
                    value={form.objective}
                    onChange={(event) => setForm((current) => ({ ...current, objective: event.target.value }))}
                    className="teacher-field mt-2 min-h-24"
                    placeholder="Collect the key, then use the shortest safe route into the locked exit."
                  />
                </label>
              </div>
            </section>

            <section className="teacher-sectionCard xl:col-span-3">
              <div className="teacher-sectionCard__header">
                <p className="teacher-kicker">Step 3</p>
                <h3 className="mt-2 font-display text-xl font-bold">Scoring and publish rules</h3>
                <p className="teacher-copy mt-2 text-sm">
                  Set lesson topic, difficulty, and the performance budget students will be scored against.
                </p>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-5">
                <label className="block">
                  <span className="teacher-label text-sm font-semibold">Lesson tag</span>
                  <select
                    value={form.lessonTag}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        lessonTag: event.target.value as typeof current.lessonTag,
                      }))
                    }
                    className="teacher-field mt-2"
                  >
                    {['Sequencing', 'Debugging', 'Efficiency', 'Conditionals', 'Boolean Logic', 'Loops', 'Functions', 'Variables', 'Strategy'].map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="teacher-label text-sm font-semibold">Difficulty</span>
                  <select
                    value={form.difficulty}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        difficulty: event.target.value as typeof current.difficulty,
                      }))
                    }
                    className="teacher-field mt-2"
                  >
                    {['Easy', 'Medium', 'Hard'].map((difficulty) => (
                      <option key={difficulty} value={difficulty}>
                        {difficulty}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="teacher-label text-sm font-semibold">Par moves</span>
                  <input
                    type="number"
                    min={1}
                    value={form.parMoves}
                    onChange={(event) => setForm((current) => ({ ...current, parMoves: Number(event.target.value) }))}
                    className="teacher-field mt-2"
                  />
                </label>
                <label className="block">
                  <span className="teacher-label text-sm font-semibold">Code budget</span>
                  <input
                    type="number"
                    min={1}
                    value={form.codeBudget}
                    onChange={(event) => setForm((current) => ({ ...current, codeBudget: Number(event.target.value) }))}
                    className="teacher-field mt-2"
                  />
                </label>
                <label className="block">
                  <span className="teacher-label text-sm font-semibold">Publish status</span>
                  <select
                    value={form.lifecycleStatus}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        lifecycleStatus: event.target.value as RoomLifecycleStatus,
                      }))
                    }
                    className="teacher-field mt-2"
                  >
                    <option value={RoomLifecycleStatus.DRAFT}>Draft</option>
                    <option value={RoomLifecycleStatus.PUBLISHED}>Published</option>
                    <option value={RoomLifecycleStatus.ARCHIVED}>Archived</option>
                  </select>
                </label>
              </div>
            </section>
          </div>

          <section className="teacher-sectionCard">
            <div className="teacher-sectionCard__header">
              <p className="teacher-kicker">Step 4</p>
              <h3 className="mt-2 font-display text-xl font-bold">Build the room layout</h3>
              <p className="teacher-copy mt-2 text-sm">
                Place the start, exit, walls, and key logic directly on the board so the puzzle is easy to reason
                about while editing.
              </p>
            </div>
            <div className="mt-4">
            <RoomLayoutEditor
              value={form.layout}
              onChange={(layout) =>
                setForm((current) => ({
                  ...current,
                  layout,
                }))
              }
              disabled={createRoomMutation.isPending}
            />
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.82fr)]">
            <section className="teacher-sectionCard">
              <div className="teacher-sectionCard__header">
                <p className="teacher-kicker">Step 5</p>
                <h3 className="mt-2 font-display text-xl font-bold">Allowed blocks</h3>
                <p className="teacher-copy mt-2 text-sm">
                  Limit the commands available to students so the room matches the intended lesson.
                </p>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {blockPresetCatalog.map((preset) => (
                  <label
                    key={preset.id}
                    className="teacher-surface teacher-copy flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-[var(--text-0)]">{preset.label}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-2)]">{preset.category}</p>
                    </div>
                    <input
                      type="checkbox"
                      aria-label={`Allow block ${preset.label}`}
                      checked={form.selectedPresetIds.includes(preset.id)}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          selectedPresetIds: event.target.checked
                            ? [...current.selectedPresetIds, preset.id]
                            : current.selectedPresetIds.filter((entry) => entry !== preset.id),
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="teacher-sectionCard">
              <div className="teacher-sectionCard__header">
                <p className="teacher-kicker">Tuning</p>
                <h3 className="mt-2 font-display text-xl font-bold">Control defaults</h3>
                <p className="teacher-copy mt-2 text-sm">
                  Adjust the helper naming and loop defaults that appear when those block types are enabled.
                </p>
              </div>
              <div className="mt-4 grid gap-4">
                <label className="block">
                  <span className="teacher-label text-sm font-semibold">Helper name</span>
                  <input
                    value={form.helperName}
                    onChange={(event) => setForm((current) => ({ ...current, helperName: event.target.value }))}
                    className="teacher-field mt-2"
                  />
                </label>
                <label className="block">
                  <span className="teacher-label text-sm font-semibold">Repeat count</span>
                  <input
                    type="number"
                    min={2}
                    max={5}
                    value={form.repeatCount}
                    onChange={(event) => setForm((current) => ({ ...current, repeatCount: Number(event.target.value) }))}
                    className="teacher-field mt-2"
                  />
                </label>
                <label className="block">
                  <span className="teacher-label text-sm font-semibold">While condition</span>
                  <select
                    value={form.whileCondition}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        whileCondition: event.target.value as typeof current.whileCondition,
                      }))
                    }
                    className="teacher-field mt-2"
                  >
                    {['PATH_UP_CLEAR', 'PATH_RIGHT_CLEAR', 'PATH_DOWN_CLEAR', 'PATH_LEFT_CLEAR', 'HAS_KEY', 'DOOR_UP', 'DOOR_RIGHT', 'DOOR_DOWN', 'DOOR_LEFT'].map((condition) => (
                      <option key={condition} value={condition}>
                        {condition}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>
          </div>

          <section className="teacher-sectionCard">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="teacher-kicker">Step 6</p>
                <h3 className="mt-2 font-display text-2xl font-bold">
                  Make this level playable for students
                </h3>
                <p className="teacher-copy mt-3 text-sm">
                  {selectedClassroom
                    ? `This level will be published directly into ${selectedClassroom.name}. Any enrolled student can play it automatically.`
                    : 'Select a classroom above if this level should become automatically playable for enrolled students.'}
                </p>
              </div>
              <span className="teacher-chip">
                {selectedClassroom ? 'Auto-published' : 'Optional step'}
              </span>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="teacher-label text-sm font-semibold">Classroom gameplay title</span>
                <input
                  value={assignmentDraft.title}
                  onChange={(event) =>
                    setAssignmentDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className="teacher-field mt-2"
                  placeholder="Defaults to the room title if left blank"
                  disabled={!selectedClassroomId}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="teacher-label text-sm font-semibold">Classroom gameplay note</span>
                <textarea
                  value={assignmentDraft.description}
                  onChange={(event) =>
                    setAssignmentDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="teacher-field mt-2 min-h-24"
                  placeholder="Explain what students should focus on in this classroom level."
                  disabled={!selectedClassroomId}
                />
              </label>
              <label className="block">
                <span className="teacher-label text-sm font-semibold">Start at</span>
                <input
                  type="datetime-local"
                  value={assignmentDraft.startAt}
                  onChange={(event) =>
                    setAssignmentDraft((current) => ({
                      ...current,
                      startAt: event.target.value,
                    }))
                  }
                  className="teacher-field mt-2"
                  disabled={!selectedClassroomId}
                />
              </label>
              <label className="block">
                <span className="teacher-label text-sm font-semibold">Due at</span>
                <input
                  type="datetime-local"
                  value={assignmentDraft.dueAt}
                  onChange={(event) =>
                    setAssignmentDraft((current) => ({
                      ...current,
                      dueAt: event.target.value,
                    }))
                  }
                  className="teacher-field mt-2"
                  disabled={!selectedClassroomId}
                />
              </label>
            </div>
          </section>

          {submitError ? (
            <div className="auth-alert auth-alert--error mt-6" role="alert">
              {submitError}
            </div>
          ) : null}

          <button
            type="button"
            onClick={submitRoom}
            disabled={
              createRoomMutation.isPending || createAssignmentMutation.isPending
            }
            className="teacher-button-primary mt-6 w-full"
          >
            {createRoomMutation.isPending || createAssignmentMutation.isPending
              ? 'Saving classroom level...'
              : selectedClassroomId
                ? 'Save room and publish to classroom'
                : 'Save room version'}
          </button>
        </article>
      </section>
    </div>
  );
};
