import { useEffect, useMemo, useState } from 'react';
import {
  AssignmentTargetType,
  RoomLifecycleStatus,
  type GameCondition,
  type LessonTopic,
  type RoomDifficulty,
} from '@shared/types/teacher';
import { Link, useSearchParams } from 'react-router-dom';
import { PaginationControls } from '@/components/shared';
import {
  blockPresetCatalog,
  buildOfficialAssignmentOptions,
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

type DeliveryMode = 'official' | 'custom';
type OfficialScope = 'world' | 'puzzle';

const todayDateValue = new Date().toISOString().slice(0, 16);
const nextWeekDateValue = new Date(
  Date.now() + 7 * 24 * 60 * 60 * 1000,
).toISOString().slice(0, 16);

const builderSteps = [
  {
    title: 'Choose classroom',
    description: 'Start inside one classroom so every level decision has a clear destination.',
  },
  {
    title: 'Choose level source',
    description: 'Either assign built-in gameplay or build a custom classroom room.',
  },
  {
    title: 'Set schedule',
    description: 'Control when the classroom gameplay becomes available to enrolled students.',
  },
  {
    title: 'Publish to students',
    description: 'Enrolled students automatically see everything assigned to that classroom.',
  },
];

export const Lessons = () => {
  const [searchParams] = useSearchParams();
  const classroomIdFromSearch = searchParams.get('classroomId');
  const [classroomsPage, setClassroomsPage] = useState(1);
  const [roomVersionsPage, setRoomVersionsPage] = useState(1);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>(
    classroomIdFromSearch ?? '',
  );
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('official');
  const [officialScope, setOfficialScope] = useState<OfficialScope>('world');
  const [selectedOfficialWorldId, setSelectedOfficialWorldId] = useState('');
  const [selectedOfficialPuzzleId, setSelectedOfficialPuzzleId] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const classroomsQuery = useTeacherClassroomsQuery({ page: classroomsPage, pageSize: 12 });
  const roomsQuery = useTeacherRoomsQuery({ page: roomVersionsPage, pageSize: 12 });
  const createRoomMutation = useCreateRoomMutation();
  const createAssignmentMutation = useCreateAssignmentMutation(
    selectedClassroomId || null,
  );

  const classrooms = useMemo(
    () => classroomsQuery.data?.items ?? [],
    [classroomsQuery.data],
  );
  const roomVersions = useMemo(() => roomsQuery.data?.items ?? [], [roomsQuery.data]);
  const officialAssignmentOptions = useMemo(() => buildOfficialAssignmentOptions(), []);

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

  const selectedClassroom =
    classrooms.find((classroom) => classroom.id === selectedClassroomId) ?? null;
  const selectedOfficialWorld =
    officialAssignmentOptions.find((world) => world.worldId === selectedOfficialWorldId) ??
    officialAssignmentOptions[0] ??
    null;
  const selectedOfficialPuzzle =
    selectedOfficialWorld?.puzzles.find((puzzle) => puzzle.roomKey === selectedOfficialPuzzleId) ??
    selectedOfficialWorld?.puzzles[0] ??
    null;
  const officialManifestPreview =
    officialScope === 'world'
      ? selectedOfficialWorld?.puzzles ?? []
      : selectedOfficialPuzzle
        ? [selectedOfficialPuzzle]
        : [];
  const isLoadingClassrooms = classroomsQuery.isLoading && !classrooms.length;
  const isSaving =
    createRoomMutation.isPending || createAssignmentMutation.isPending;

  useEffect(() => {
    if (!selectedClassroomId && classrooms[0]) {
      setSelectedClassroomId(classrooms[0].id);
    }
  }, [classrooms, selectedClassroomId]);

  useEffect(() => {
    if (!selectedOfficialWorldId && officialAssignmentOptions[0]) {
      setSelectedOfficialWorldId(officialAssignmentOptions[0].worldId);
    }
  }, [officialAssignmentOptions, selectedOfficialWorldId]);

  useEffect(() => {
    if (!selectedOfficialWorld) {
      setSelectedOfficialPuzzleId('');
      return;
    }

    if (
      selectedOfficialPuzzleId &&
      selectedOfficialWorld.puzzles.some(
        (puzzle) => puzzle.roomKey === selectedOfficialPuzzleId,
      )
    ) {
      return;
    }

    setSelectedOfficialPuzzleId(selectedOfficialWorld.puzzles[0]?.roomKey ?? '');
  }, [
    selectedOfficialPuzzleId,
    selectedOfficialWorld,
  ]);

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
      selectedPresetIds: room.definition.availableBlocks.some(
        (block) => block.kind === 'FUNCTION_DEF',
      )
        ? ['helper']
        : room.definition.availableBlocks.map((block) => block.key),
      helperName:
        room.definition.availableBlocks
          .find(
            (block) =>
              block.kind === 'FUNCTION_DEF' || block.kind === 'FUNCTION_CALL',
          )
          ?.key
          ?.replace('function-def-', '')
          .replace('function-call-', '') ?? 'helperStep',
      repeatCount:
        room.definition.availableBlocks.find(
          (block) => block.kind === 'REPEAT' && 'repeatCount' in block,
        )?.repeatCount ?? 2,
      whileCondition:
        room.definition.availableBlocks.find(
          (block) => block.kind === 'WHILE' && 'condition' in block,
        )?.condition ?? 'PATH_UP_CLEAR',
    });
  };

  const submitAssignment = async () => {
    setSubmitError(null);

    if (!selectedClassroomId) {
      setSubmitError('Choose a classroom first so the assignment has a student destination.');
      return;
    }

    const startAt = new Date(assignmentDraft.startAt).toISOString();
    const dueAt = assignmentDraft.dueAt
      ? new Date(assignmentDraft.dueAt).toISOString()
      : null;

    if (deliveryMode === 'official') {
      if (!selectedOfficialWorld) {
        setSubmitError('Choose an official world before assigning classroom gameplay.');
        return;
      }

      if (officialScope === 'world') {
        await createAssignmentMutation.mutateAsync({
          title: assignmentDraft.title.trim() || selectedOfficialWorld.worldTitle,
          description:
            assignmentDraft.description.trim() ||
            `Assign all ${selectedOfficialWorld.puzzles.length} built-in rooms from ${selectedOfficialWorld.worldTitle}.`,
          targetType: AssignmentTargetType.OFFICIAL_WORLD,
          officialWorldId: selectedOfficialWorld.worldId,
          roomManifest: selectedOfficialWorld.puzzles,
          startAt,
          dueAt,
        });

        return;
      }

      if (!selectedOfficialPuzzle) {
        setSubmitError('Choose a built-in puzzle before assigning single-level gameplay.');
        return;
      }

      await createAssignmentMutation.mutateAsync({
        title: assignmentDraft.title.trim() || selectedOfficialPuzzle.title,
        description:
          assignmentDraft.description.trim() || selectedOfficialPuzzle.objective,
        targetType: AssignmentTargetType.OFFICIAL_PUZZLE,
        officialPuzzleId:
          selectedOfficialPuzzle.officialPuzzleId ?? selectedOfficialPuzzle.roomKey,
        roomManifest: [selectedOfficialPuzzle],
        startAt,
        dueAt,
      });

      return;
    }

    if (form.lifecycleStatus !== RoomLifecycleStatus.PUBLISHED) {
      setSubmitError(
        'Custom classroom levels must be published before they can be assigned to students.',
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

    await createAssignmentMutation.mutateAsync({
      title: assignmentDraft.title.trim() || roomVersion.title,
      description:
        assignmentDraft.description.trim() || roomVersion.description || null,
      targetType: AssignmentTargetType.CUSTOM_ROOM,
      customRoomVersionId: roomVersion.id,
      startAt,
      dueAt,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="teacher-kicker">Classroom Gameplay Builder</p>
        <h1 className="mt-2 font-display text-3xl font-bold">
          Create the classroom, then either assign built-in gameplay or author a custom level.
        </h1>
        <p className="teacher-copy mt-3 max-w-3xl text-sm">
          This page now follows the teaching flow directly. Pick the classroom first, choose whether you want official
          gameplay or a custom room, set the schedule, and enrolled students automatically receive that classroom
          gameplay.
        </p>
      </div>

      <div className="teacher-flow">
        {builderSteps.map((step, index) => (
          <article key={step.title} className="teacher-flow__step">
            <span className="teacher-flow__stepNumber">0{index + 1}</span>
            <div className="teacher-flow__stepCopy">
              <h2 className="font-display text-lg font-bold text-[var(--text-0)]">
                {step.title}
              </h2>
              <p className="teacher-copy text-sm">{step.description}</p>
            </div>
          </article>
        ))}
      </div>

      {isLoadingClassrooms ? (
        <section className="glass-panel p-6">
          <p className="teacher-kicker">Loading</p>
          <h2 className="mt-2 font-display text-2xl font-bold">Loading classrooms...</h2>
          <p className="teacher-copy mt-3 max-w-2xl text-sm">
            The builder is pulling your classroom list so it can attach gameplay to the correct roster.
          </p>
        </section>
      ) : !classrooms.length ? (
        <section className="glass-panel p-6">
          <p className="teacher-kicker">Start Here</p>
          <h2 className="mt-2 font-display text-2xl font-bold">You need at least one classroom before building gameplay.</h2>
          <p className="teacher-copy mt-3 max-w-2xl text-sm">
            Classroom gameplay now starts from a real classroom context. Create the classroom first, then come back
            here to assign built-in worlds or publish a custom level for that room.
          </p>
          <Link to="/teacher/students" className="teacher-button-primary mt-5">
            Open classroom manager
          </Link>
        </section>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-6">
            <article className="glass-panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="teacher-kicker">Step 1</p>
                  <h2 className="mt-2 font-display text-2xl font-bold">Choose the classroom</h2>
                  <p className="teacher-copy mt-3 text-sm">
                    Every level or world assignment on this page is attached to one classroom and becomes playable for
                    that classroom&apos;s enrolled students.
                  </p>
                </div>
                <Link
                  to="/teacher/students"
                  className="teacher-button-secondary"
                >
                  Manage classrooms
                </Link>
              </div>

              <div className="mt-5 grid gap-3">
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
                      <div className="min-w-0">
                        <h3 className="font-display text-xl font-bold text-[var(--text-0)]">
                          {classroom.name}
                        </h3>
                        <p className="teacher-copy mt-2 text-sm">{classroom.description}</p>
                      </div>
                      <span className="teacher-tag">
                        {classroom.isPrivate ? 'Private' : 'Open'}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-2)]">
                      <span>{classroom.enrollmentCount ?? 0} students</span>
                      <span>{classroom.assignmentCount ?? 0} assignments</span>
                    </div>
                  </button>
                ))}
              </div>

              <PaginationControls
                page={classroomsQuery.data?.pagination.page ?? 1}
                totalPages={classroomsQuery.data?.pagination.totalPages ?? 1}
                totalItems={classroomsQuery.data?.pagination.totalItems ?? classrooms.length}
                pageSize={classroomsQuery.data?.pagination.pageSize ?? 12}
                onPageChange={setClassroomsPage}
              />
            </article>

            <article className="glass-panel p-6">
              <p className="teacher-kicker">Step 2</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Choose the level source</h2>
              <p className="teacher-copy mt-3 text-sm">
                Use official gameplay when the built-in curriculum already fits the lesson. Switch to a custom room
                when this classroom needs its own puzzle layout and scoring budget.
              </p>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryMode('official')}
                  className={`rounded-3xl border p-4 text-left transition ${
                    deliveryMode === 'official'
                      ? 'teacher-surface teacher-surface--active'
                      : 'teacher-surface hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl font-bold text-[var(--text-0)]">
                        Assign built-in gameplay
                      </h3>
                      <p className="teacher-copy mt-2 text-sm">
                        Pick an official world or one official level already inside the system.
                      </p>
                    </div>
                    <span className="teacher-tag">Fastest path</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMode('custom')}
                  className={`rounded-3xl border p-4 text-left transition ${
                    deliveryMode === 'custom'
                      ? 'teacher-surface teacher-surface--active'
                      : 'teacher-surface hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl font-bold text-[var(--text-0)]">
                        Create a custom classroom level
                      </h3>
                      <p className="teacher-copy mt-2 text-sm">
                        Build a room, version it on publish, and assign it only to this classroom.
                      </p>
                    </div>
                    <span className="teacher-tag">Teacher-authored</span>
                  </div>
                </button>
              </div>
            </article>

            <article className="glass-panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="teacher-kicker">Step 3</p>
                  <h2 className="mt-2 font-display text-2xl font-bold">Schedule classroom gameplay</h2>
                </div>
                {selectedClassroom ? (
                  <span className="teacher-chip">
                    {selectedClassroom.enrollmentCount ?? 0} students will see this
                  </span>
                ) : null}
              </div>

              <div className="mt-5 grid gap-4">
                <label className="block">
                  <span className="teacher-label text-sm font-semibold">Gameplay title</span>
                  <input
                    value={assignmentDraft.title}
                    onChange={(event) =>
                      setAssignmentDraft((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    className="teacher-field mt-2"
                    placeholder={
                      deliveryMode === 'official'
                        ? 'Leave blank to use the official world or level title'
                        : 'Leave blank to reuse the custom room title'
                    }
                  />
                </label>

                <label className="block">
                  <span className="teacher-label text-sm font-semibold">Teacher note</span>
                  <textarea
                    value={assignmentDraft.description}
                    onChange={(event) =>
                      setAssignmentDraft((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    className="teacher-field mt-2 min-h-24"
                    placeholder="Add the instruction students should read before they start this classroom gameplay."
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
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
                    />
                  </label>
                </div>

                <div className="teacher-note rounded-3xl px-4 py-4 text-sm">
                  <p className="font-semibold text-[var(--text-0)]">Delivery rule</p>
                  <p className="teacher-copy mt-2">
                    Once this is assigned, students already enrolled in{' '}
                    <span className="font-semibold text-[var(--text-0)]">
                      {selectedClassroom?.name ?? 'the selected classroom'}
                    </span>{' '}
                    can immediately access it from the student classroom gameplay section.
                  </p>
                </div>
              </div>
            </article>
          </div>

          <div className="space-y-6">
            {deliveryMode === 'official' ? (
              <article className="glass-panel space-y-6 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="teacher-kicker">Step 4</p>
                    <h2 className="mt-2 font-display text-2xl font-bold">Assign official gameplay</h2>
                    <p className="teacher-copy mt-3 max-w-3xl text-sm">
                      Choose whether this classroom should receive a whole official world or a single built-in level.
                      This does not create a custom room; it reuses the existing curriculum.
                    </p>
                  </div>
                  <span className="teacher-chip">
                    {officialManifestPreview.length} room{officialManifestPreview.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
                  <section className="teacher-sectionCard">
                    <div className="teacher-sectionCard__header">
                      <h3 className="font-display text-xl font-bold">Scope</h3>
                      <p className="teacher-copy mt-2 text-sm">
                        Assign the whole progression arc or only one targeted official level.
                      </p>
                    </div>

                    <div className="mt-4 grid gap-3">
                      <button
                        type="button"
                        onClick={() => setOfficialScope('world')}
                        className={`rounded-3xl border p-4 text-left transition ${
                          officialScope === 'world'
                            ? 'teacher-surface teacher-surface--active'
                            : 'teacher-surface hover:bg-white/10'
                        }`}
                      >
                        <p className="font-semibold text-[var(--text-0)]">Whole world</p>
                        <p className="teacher-copy mt-2 text-sm">
                          Give the classroom every built-in room from one official world.
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOfficialScope('puzzle')}
                        className={`rounded-3xl border p-4 text-left transition ${
                          officialScope === 'puzzle'
                            ? 'teacher-surface teacher-surface--active'
                            : 'teacher-surface hover:bg-white/10'
                        }`}
                      >
                        <p className="font-semibold text-[var(--text-0)]">Single level</p>
                        <p className="teacher-copy mt-2 text-sm">
                          Target one built-in room when the class only needs a focused checkpoint.
                        </p>
                      </button>
                    </div>

                    <div className="mt-4 grid gap-4">
                      <label className="block">
                        <span className="teacher-label text-sm font-semibold">Official world</span>
                        <select
                          value={selectedOfficialWorldId}
                          onChange={(event) => setSelectedOfficialWorldId(event.target.value)}
                          className="teacher-field mt-2"
                        >
                          {officialAssignmentOptions.map((world) => (
                            <option key={world.worldId} value={world.worldId}>
                              {world.worldTitle}
                            </option>
                          ))}
                        </select>
                      </label>

                      {officialScope === 'puzzle' ? (
                        <label className="block">
                          <span className="teacher-label text-sm font-semibold">Official level</span>
                          <select
                            value={selectedOfficialPuzzleId}
                            onChange={(event) => setSelectedOfficialPuzzleId(event.target.value)}
                            className="teacher-field mt-2"
                          >
                            {(selectedOfficialWorld?.puzzles ?? []).map((puzzle) => (
                              <option key={puzzle.roomKey} value={puzzle.roomKey}>
                                {puzzle.title}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                    </div>
                  </section>

                  <section className="teacher-sectionCard">
                    <div className="teacher-sectionCard__header">
                      <h3 className="font-display text-xl font-bold">
                        {selectedOfficialWorld?.worldTitle ?? 'Official gameplay preview'}
                      </h3>
                      <p className="teacher-copy mt-2 text-sm">
                        {officialScope === 'world'
                          ? 'Students will receive this entire built-in progression set.'
                          : 'Students will receive this one built-in level as classroom gameplay.'}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="teacher-chip">
                        {officialManifestPreview.length} playable room{officialManifestPreview.length === 1 ? '' : 's'}
                      </span>
                      {selectedOfficialWorld ? (
                        <span className="teacher-chip">
                          {selectedOfficialWorld.puzzles.length} total in world
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-5 space-y-3">
                      {officialManifestPreview.map((item) => (
                        <article key={item.roomKey} className="teacher-surface rounded-3xl px-4 py-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="font-display text-lg font-bold text-[var(--text-0)]">
                                {item.title}
                              </h4>
                              <p className="teacher-copy mt-2 text-sm">{item.objective}</p>
                            </div>
                            <span className="teacher-tag">{item.difficulty}</span>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-2)]">
                            <span>{item.lesson}</span>
                            <span>{item.parMoves} par moves</span>
                            <span>{item.codeBudget} code budget</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              </article>
            ) : (
              <article className="glass-panel space-y-6 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="teacher-kicker">Step 4</p>
                    <h2 className="mt-2 font-display text-2xl font-bold">Build a custom classroom level</h2>
                    <p className="teacher-copy mt-3 max-w-3xl text-sm">
                      This path creates a teacher-authored room version, then publishes that room straight into the
                      selected classroom. The room itself is versioned on publish.
                    </p>
                  </div>
                  <span className="teacher-chip">
                    {roomsQuery.data?.pagination.totalItems ?? roomVersions.length} saved versions
                  </span>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                  <section className="teacher-sectionCard">
                    <div className="teacher-sectionCard__header">
                      <h3 className="font-display text-xl font-bold">Version source</h3>
                      <p className="teacher-copy mt-2 text-sm">
                        Start from scratch or load one of your latest teacher-authored room versions.
                      </p>
                    </div>
                    <div className="mt-4 space-y-4">
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
                      <h3 className="font-display text-xl font-bold">Room brief</h3>
                      <p className="teacher-copy mt-2 text-sm">
                        Define the lesson framing before editing the board so the room stays easy to evaluate.
                      </p>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="block md:col-span-2">
                        <span className="teacher-label text-sm font-semibold">Room title</span>
                        <input
                          value={form.title}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, title: event.target.value }))
                          }
                          className="teacher-field mt-2"
                          placeholder="Loop Corridor Checkpoint"
                        />
                      </label>
                      <label className="block md:col-span-2">
                        <span className="teacher-label text-sm font-semibold">Description</span>
                        <textarea
                          value={form.description}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, description: event.target.value }))
                          }
                          className="teacher-field mt-2 min-h-24"
                          placeholder="Students must reach the exit with fewer wasted moves and tighter loop usage."
                        />
                      </label>
                      <label className="block md:col-span-2">
                        <span className="teacher-label text-sm font-semibold">Objective</span>
                        <textarea
                          value={form.objective}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, objective: event.target.value }))
                          }
                          className="teacher-field mt-2 min-h-24"
                          placeholder="Collect the key, then reach the exit using the cleanest loop-based route."
                        />
                      </label>
                    </div>
                  </section>

                  <section className="teacher-sectionCard xl:col-span-3">
                    <div className="teacher-sectionCard__header">
                      <h3 className="font-display text-xl font-bold">Scoring and publish rules</h3>
                      <p className="teacher-copy mt-2 text-sm">
                        Configure the scoring budget and set this custom room to published so it can be assigned.
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
                          {[
                            'Sequencing',
                            'Debugging',
                            'Efficiency',
                            'Conditionals',
                            'Boolean Logic',
                            'Loops',
                            'Functions',
                            'Variables',
                            'Strategy',
                          ].map((topic) => (
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
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              parMoves: Number(event.target.value),
                            }))
                          }
                          className="teacher-field mt-2"
                        />
                      </label>
                      <label className="block">
                        <span className="teacher-label text-sm font-semibold">Code budget</span>
                        <input
                          type="number"
                          min={1}
                          value={form.codeBudget}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              codeBudget: Number(event.target.value),
                            }))
                          }
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
                    <h3 className="font-display text-xl font-bold">Build the room layout</h3>
                    <p className="teacher-copy mt-2 text-sm">
                      Place the start, exit, key, and walls directly on the board so the puzzle logic stays visible
                      while you edit it.
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
                      <h3 className="font-display text-xl font-bold">Allowed blocks</h3>
                      <p className="teacher-copy mt-2 text-sm">
                        Restrict the command set so students solve the room with the exact concept you want to assess.
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
                            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-2)]">
                              {preset.category}
                            </p>
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
                                  : current.selectedPresetIds.filter(
                                      (entry) => entry !== preset.id,
                                    ),
                              }))
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </section>

                  <section className="teacher-sectionCard">
                    <div className="teacher-sectionCard__header">
                      <h3 className="font-display text-xl font-bold">Control defaults</h3>
                      <p className="teacher-copy mt-2 text-sm">
                        Tune the helper name and loop defaults that appear when those blocks are enabled.
                      </p>
                    </div>
                    <div className="mt-4 grid gap-4">
                      <label className="block">
                        <span className="teacher-label text-sm font-semibold">Helper name</span>
                        <input
                          value={form.helperName}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              helperName: event.target.value,
                            }))
                          }
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
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              repeatCount: Number(event.target.value),
                            }))
                          }
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
                          {[
                            'PATH_UP_CLEAR',
                            'PATH_RIGHT_CLEAR',
                            'PATH_DOWN_CLEAR',
                            'PATH_LEFT_CLEAR',
                            'HAS_KEY',
                            'DOOR_UP',
                            'DOOR_RIGHT',
                            'DOOR_DOWN',
                            'DOOR_LEFT',
                          ].map((condition) => (
                            <option key={condition} value={condition}>
                              {condition}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </section>
                </div>
              </article>
            )}

            {submitError ? (
              <div className="auth-alert auth-alert--error" role="alert">
                {submitError}
              </div>
            ) : null}

            <button
              type="button"
              onClick={submitAssignment}
              disabled={isSaving}
              className="teacher-button-primary w-full"
            >
              {isSaving
                ? 'Saving classroom gameplay...'
                : deliveryMode === 'official'
                  ? officialScope === 'world'
                    ? 'Assign official world to classroom'
                    : 'Assign official level to classroom'
                  : 'Publish custom level to classroom'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
