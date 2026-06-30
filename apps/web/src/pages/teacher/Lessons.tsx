import { useEffect, useMemo, useState } from 'react';
import {
  AssignmentTargetType,
  RoomLifecycleStatus,
  type GameCondition,
  type LessonTopic,
  type RoomDifficulty,
} from '@shared/types/teacher';
import { Link, useSearchParams } from 'react-router-dom';
import { EmptyState, PaginationControls } from '@/components/shared';
import {
  blockPresetCatalog,
  buildOfficialAssignmentOptions,
  buildTeacherBlocksFromPresetSelection,
  useCreateAssignmentMutation,
  useCreateRoomMutation,
  useTeacherClassroomsQuery,
  useTeacherRoomsQuery,
  useUpdateRoomLifecycleMutation,
} from '@/features/teacher';
import { getApiErrorMessage } from '@/lib/api';
import { useToastStore } from '@/store/toastStore';
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
type WizardStepId = 'classroom' | 'source' | 'build' | 'schedule';

const todayDateValue = new Date().toISOString().slice(0, 16);
const nextWeekDateValue = new Date(
  Date.now() + 7 * 24 * 60 * 60 * 1000,
).toISOString().slice(0, 16);

const createInitialAssignmentDraft = () => ({
  title: '',
  description: '',
  startAt: todayDateValue,
  dueAt: nextWeekDateValue,
});

const wizardSteps: Array<{
  id: WizardStepId;
  title: string;
  description: string;
}> = [
  {
    id: 'classroom',
    title: 'Classroom',
    description: 'Choose which roster will receive this gameplay.',
  },
  {
    id: 'source',
    title: 'Level source',
    description: 'Decide between official content and a custom classroom room.',
  },
  {
    id: 'build',
    title: 'Configure gameplay',
    description: 'Pick the official target or build the custom room.',
  },
  {
    id: 'schedule',
    title: 'Schedule and publish',
    description: 'Set visibility dates and publish to students.',
  },
];

const lessonTopics: LessonTopic[] = [
  'Sequencing',
  'Debugging',
  'Efficiency',
  'Conditionals',
  'Boolean Logic',
  'Loops',
  'Functions',
  'Variables',
  'Strategy',
];

const difficultyOptions: RoomDifficulty[] = ['Easy', 'Medium', 'Hard'];

const whileConditions: GameCondition[] = [
  'PATH_UP_CLEAR',
  'PATH_RIGHT_CLEAR',
  'PATH_DOWN_CLEAR',
  'PATH_LEFT_CLEAR',
  'HAS_KEY',
  'DOOR_UP',
  'DOOR_RIGHT',
  'DOOR_DOWN',
  'DOOR_LEFT',
];

const isCustomBriefComplete = (form: RoomBuilderFormState) =>
  Boolean(
    form.title.trim() &&
      form.description.trim() &&
      form.objective.trim() &&
      form.selectedPresetIds.length,
  );

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
  const [currentStep, setCurrentStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const showToast = useToastStore((state) => state.showToast);

  const classroomsQuery = useTeacherClassroomsQuery({ page: classroomsPage, pageSize: 12 });
  const roomsQuery = useTeacherRoomsQuery({ page: roomVersionsPage, pageSize: 12 });
  const createRoomMutation = useCreateRoomMutation();
  const updateRoomLifecycleMutation = useUpdateRoomLifecycleMutation();
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
  const [assignmentDraft, setAssignmentDraft] = useState(
    createInitialAssignmentDraft(),
  );

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
  const currentStepConfig = wizardSteps[currentStep];
  const isCustomBuildFocus =
    currentStepConfig.id === 'build' && deliveryMode === 'custom';
  const officialSummaryTitle =
    officialScope === 'world'
      ? selectedOfficialWorld?.worldTitle ?? 'Official world'
      : selectedOfficialPuzzle?.title ?? 'Official level';
  const customSummaryTitle = form.title.trim() || 'Untitled custom room';

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
  }, [selectedOfficialPuzzleId, selectedOfficialWorld]);

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

  const canAdvanceFromCurrentStep = () => {
    const stepId = currentStepConfig.id;

    if (stepId === 'classroom') {
      return Boolean(selectedClassroomId);
    }

    if (stepId === 'source') {
      return deliveryMode === 'official'
        ? Boolean(selectedOfficialWorldId)
        : true;
    }

    if (stepId === 'build') {
      if (deliveryMode === 'official') {
        return officialScope === 'world'
          ? Boolean(selectedOfficialWorld)
          : Boolean(selectedOfficialPuzzle);
      }

      return isCustomBriefComplete(form);
    }

    return true;
  };

  const goToNextStep = () => {
    if (!canAdvanceFromCurrentStep()) {
      return;
    }

    setSubmitError(null);
    setCurrentStep((step) => Math.min(step + 1, wizardSteps.length - 1));
  };

  const goToPreviousStep = () => {
    setSubmitError(null);
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const resetOfficialAssignmentFlow = () => {
    setSubmitError(null);
    setCurrentStep(0);
    setOfficialScope('world');
    setSelectedOfficialWorldId('');
    setSelectedOfficialPuzzleId('');
    setAssignmentDraft(createInitialAssignmentDraft());
  };

  const loadRoomIntoBuilder = (roomId: string) => {
    hydrateFromRoom(roomId);
    setDeliveryMode('custom');
    setCurrentStep(2);
    setSubmitError(null);
  };

  const updateRoomStatus = async (roomId: string, lifecycleStatus: RoomLifecycleStatus) => {
    const targetRoom = roomVersions.find((room) => room.id === roomId);

    if (!targetRoom) {
      return;
    }

    try {
      const roomVersion = await updateRoomLifecycleMutation.mutateAsync({
        roomId,
        lifecycleStatus,
      });
      showToast({
        tone: 'success',
        title: 'Room status updated',
        description: `${roomVersion.title} is now ${roomVersion.lifecycleStatus.toLowerCase()}.`,
      });
    } catch (error) {
      showToast({
        tone: 'error',
        title: 'Room status update failed',
        description: getApiErrorMessage(error, 'The room status could not be changed right now.'),
      });
    }
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

      try {
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

          showToast({
            tone: 'success',
            title: 'Official world assigned',
            description: `${selectedOfficialWorld.worldTitle} is now scheduled for ${selectedClassroom?.name ?? 'this classroom'}.`,
          });
          resetOfficialAssignmentFlow();
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

        showToast({
          tone: 'success',
          title: 'Official level assigned',
          description: `${selectedOfficialPuzzle.title} is now ready for ${selectedClassroom?.name ?? 'this classroom'}.`,
        });
        resetOfficialAssignmentFlow();
        return;
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          'The official classroom gameplay could not be published right now.',
        );
        setSubmitError(message);
        showToast({
          tone: 'error',
          title: 'Publish failed',
          description: message,
        });
        return;
      }
    }

    if (!isCustomBriefComplete(form)) {
      setSubmitError('Complete the custom room brief before publishing this classroom level.');
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

    try {
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

      showToast({
        tone: 'success',
        title: 'Custom room published',
        description: `${roomVersion.title} is now playable for ${selectedClassroom?.name ?? 'this classroom'}.`,
      });
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'The custom classroom room could not be published right now.',
      );
      setSubmitError(message);
      showToast({
        tone: 'error',
        title: 'Publish failed',
        description: message,
      });
    }
  };

  const renderClassroomStep = () => (
    <section className="teacher-wizardStage">
      <div className="teacher-wizardStage__header">
        <p className="teacher-kicker">Step 1</p>
        <h2 className="font-display text-2xl font-bold">Choose the classroom</h2>
        <p className="teacher-copy text-sm">
          Start with the roster destination. Every gameplay item created here is attached to one classroom and becomes
          playable for its enrolled students.
        </p>
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

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <PaginationControls
          page={classroomsQuery.data?.pagination.page ?? 1}
          totalPages={classroomsQuery.data?.pagination.totalPages ?? 1}
          totalItems={classroomsQuery.data?.pagination.totalItems ?? classrooms.length}
          pageSize={classroomsQuery.data?.pagination.pageSize ?? 12}
          onPageChange={setClassroomsPage}
        />
        <Link to="/teacher/students" className="teacher-button-secondary">
          Manage classrooms
        </Link>
      </div>
    </section>
  );

  const renderSourceStep = () => (
    <section className="teacher-wizardStage">
      <div className="teacher-wizardStage__header">
        <p className="teacher-kicker">Step 2</p>
        <h2 className="font-display text-2xl font-bold">Choose the level source</h2>
        <p className="teacher-copy text-sm">
          Keep the decision simple: assign something already built into the game, or create a classroom-specific room.
        </p>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <button
          type="button"
          onClick={() => setDeliveryMode('official')}
          className={`rounded-3xl border p-5 text-left transition ${
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
                Use the official worlds and official levels that already exist in the system.
              </p>
            </div>
            <span className="teacher-tag">Fastest path</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-2)]">
            <span>{officialAssignmentOptions.length} worlds</span>
            <span>Best for consistent delivery</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setDeliveryMode('custom')}
          className={`rounded-3xl border p-5 text-left transition ${
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
                Build one teacher-authored room, version it on publish, and assign it only to this classroom.
              </p>
            </div>
            <span className="teacher-tag">Teacher-authored</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-2)]">
            <span>{roomsQuery.data?.pagination.totalItems ?? roomVersions.length} saved versions</span>
            <span>Best for lesson-specific practice</span>
          </div>
        </button>
      </div>
    </section>
  );

  const renderOfficialBuildStep = () => (
    <section className="teacher-wizardStage">
      <div className="teacher-wizardStage__header">
        <p className="teacher-kicker">Step 3</p>
        <h2 className="font-display text-2xl font-bold">Configure official gameplay</h2>
        <p className="teacher-copy text-sm">
          Pick the scope first, then confirm which official world or level this classroom should receive.
        </p>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(280px,0.78fr)_minmax(0,1.22fr)]">
        <section className="teacher-sectionCard">
          <div className="teacher-sectionCard__header">
            <h3 className="font-display text-xl font-bold">Scope</h3>
            <p className="teacher-copy mt-2 text-sm">
              Choose a complete official world or one focused built-in room.
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
                Assign every official room in one world.
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
                Assign one built-in room as a targeted checkpoint.
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
                ? 'Students will receive the full built-in progression in this world.'
                : 'Students will receive only this selected built-in room.'}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="teacher-chip">
              {officialManifestPreview.length} room{officialManifestPreview.length === 1 ? '' : 's'}
            </span>
            {selectedOfficialWorld ? (
              <span className="teacher-chip">
                {selectedOfficialWorld.puzzles.length} total in world
              </span>
            ) : null}
          </div>

          <div className="mt-5 space-y-3">
            {officialManifestPreview.length ? (
              officialManifestPreview.map((item) => (
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
              ))
            ) : (
              <EmptyState
                className="teacher-surface teacher-surface--muted"
                description="Official gameplay preview will appear here after you choose a built-in world or level."
              />
            )}
          </div>
        </section>
      </div>
    </section>
  );

  const renderCustomBuildStep = () => (
    <section className="teacher-wizardStage">
      <div className="teacher-wizardStage__header">
        <p className="teacher-kicker">Step 3</p>
        <h2 className="font-display text-2xl font-bold">Build the custom classroom room</h2>
        <p className="teacher-copy text-sm">
          Complete the brief, shape the board, and lock the block budget before you publish this room into the
          classroom.
        </p>
      </div>

      <div className="mt-5 grid gap-5">
        <div className="grid gap-5 2xl:grid-cols-[minmax(320px,0.72fr)_minmax(0,1.28fr)]">
          <section className="teacher-sectionCard">
            <div>
              <h3 className="font-display text-xl font-bold">Version source</h3>
              <p className="teacher-copy mt-2 text-sm">
                Start from a previous room version or create a fresh classroom-specific layout.
              </p>
            </div>
            <div className="grid gap-4">
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
              {roomVersions.length ? (
                <div className="grid gap-3">
                  {roomVersions.map((room) => (
                    <article key={room.id} className="teacher-surface rounded-2xl px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="font-display text-lg font-bold text-[var(--text-0)]">
                            {room.title}
                          </h4>
                          <p className="teacher-copy mt-2 text-sm">
                            {room.objective}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="teacher-tag">
                            {room.lifecycleStatus.toLowerCase()}
                          </span>
                          <span className="teacher-tag">
                            v{room.versionNumber}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-2)]">
                        <span>{room.lessonTag}</span>
                        <span>{room.difficulty}</span>
                        <span>Par {room.parMoves}</span>
                        <span>Budget {room.codeBudget}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => loadRoomIntoBuilder(room.id)}
                          className="teacher-button-secondary"
                        >
                          Continue in builder
                        </button>
                        {room.lifecycleStatus !== RoomLifecycleStatus.ARCHIVED ? (
                          <button
                            type="button"
                            onClick={() => updateRoomStatus(room.id, RoomLifecycleStatus.ARCHIVED)}
                            disabled={updateRoomLifecycleMutation.isPending}
                            className="teacher-button-secondary"
                          >
                            Archive
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateRoomStatus(room.id, RoomLifecycleStatus.DRAFT)}
                            disabled={updateRoomLifecycleMutation.isPending}
                            className="teacher-button-secondary"
                          >
                            Restore to draft
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
              {!roomVersions.length ? (
                <EmptyState
                  className="teacher-surface teacher-surface--muted"
                  description="Saved room versions will appear here after you publish a custom classroom room."
                />
              ) : null}
              <PaginationControls
                page={roomsQuery.data?.pagination.page ?? 1}
                totalPages={roomsQuery.data?.pagination.totalPages ?? 1}
                totalItems={roomsQuery.data?.pagination.totalItems ?? roomVersions.length}
                pageSize={roomsQuery.data?.pagination.pageSize ?? 12}
                onPageChange={setRoomVersionsPage}
              />
            </div>
          </section>

          <section className="teacher-sectionCard">
            <div className="teacher-sectionCard__header">
              <h3 className="font-display text-xl font-bold">Room brief and scoring</h3>
              <p className="teacher-copy mt-2 text-sm">
                Give the puzzle a clear lesson purpose, then set the scoring budget students will be measured against.
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
              <label className="block">
                <span className="teacher-label text-sm font-semibold">Lesson tag</span>
                <select
                  value={form.lessonTag}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      lessonTag: event.target.value as LessonTopic,
                    }))
                  }
                  className="teacher-field mt-2"
                >
                  {lessonTopics.map((topic) => (
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
                      difficulty: event.target.value as RoomDifficulty,
                    }))
                  }
                  className="teacher-field mt-2"
                >
                  {difficultyOptions.map((difficulty) => (
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
            <h3 className="font-display text-xl font-bold">Room layout</h3>
            <p className="teacher-copy mt-2 text-sm">
              Place the start, exit, walls, and key logic directly on the board.
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

        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
          <section className="teacher-sectionCard">
            <div className="teacher-sectionCard__header">
              <h3 className="font-display text-xl font-bold">Allowed blocks</h3>
              <p className="teacher-copy mt-2 text-sm">
                Restrict the command set so students solve the room using the concept you intend to assess.
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
              <h3 className="font-display text-xl font-bold">Control defaults</h3>
              <p className="teacher-copy mt-2 text-sm">
                Tune helper naming and loop defaults when those blocks are enabled.
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
                      whileCondition: event.target.value as GameCondition,
                    }))
                  }
                  className="teacher-field mt-2"
                >
                  {whileConditions.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
        </div>
      </div>
    </section>
  );

  const renderScheduleStep = () => (
    <section className="teacher-wizardStage">
      <div className="teacher-wizardStage__header">
        <p className="teacher-kicker">Step 4</p>
        <h2 className="font-display text-2xl font-bold">Schedule and publish</h2>
        <p className="teacher-copy text-sm">
          Set the player-facing title and the availability window. When you publish, enrolled students in the selected
          classroom will automatically see this gameplay.
        </p>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.72fr)]">
        <section className="teacher-sectionCard">
          <div className="teacher-sectionCard__header">
            <h3 className="font-display text-xl font-bold">Classroom gameplay details</h3>
            <p className="teacher-copy mt-2 text-sm">
              Override the title if needed, add teacher guidance, and define the start and due dates.
            </p>
          </div>

          <div className="mt-4 grid gap-4">
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
                    ? 'Leave blank to use the official title'
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
                placeholder="Add the instruction students should read before they start."
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
          </div>
        </section>

        <section className="teacher-sectionCard">
          <div className="teacher-sectionCard__header">
            <h3 className="font-display text-xl font-bold">Publish checklist</h3>
            <p className="teacher-copy mt-2 text-sm">
              Review the final payload before it becomes classroom gameplay.
            </p>
          </div>

          <div className="mt-4 space-y-3">
            <div className="teacher-note rounded-3xl px-4 py-4 text-sm">
              <p className="font-semibold text-[var(--text-0)]">Destination</p>
              <p className="teacher-copy mt-2">
                {selectedClassroom?.name ?? 'No classroom selected'} ·{' '}
                {selectedClassroom?.enrollmentCount ?? 0} enrolled students
              </p>
            </div>
            <div className="teacher-note rounded-3xl px-4 py-4 text-sm">
              <p className="font-semibold text-[var(--text-0)]">Content</p>
              <p className="teacher-copy mt-2">
                {deliveryMode === 'official'
                  ? `${officialSummaryTitle} · ${officialManifestPreview.length} room${officialManifestPreview.length === 1 ? '' : 's'}`
                  : `${customSummaryTitle} · custom classroom room`}
              </p>
            </div>
            {deliveryMode === 'custom' ? (
              <div className="teacher-note rounded-3xl px-4 py-4 text-sm">
                <p className="font-semibold text-[var(--text-0)]">Publish status</p>
                <p className="teacher-copy mt-2">
                  {form.lifecycleStatus === RoomLifecycleStatus.PUBLISHED
                    ? 'Ready for assignment'
                    : 'Must be published before students can receive it'}
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );

  const renderCurrentStep = () => {
    switch (currentStepConfig.id) {
      case 'classroom':
        return renderClassroomStep();
      case 'source':
        return renderSourceStep();
      case 'build':
        return deliveryMode === 'official'
          ? renderOfficialBuildStep()
          : renderCustomBuildStep();
      case 'schedule':
        return renderScheduleStep();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="teacher-kicker">Classroom Gameplay Builder</p>
        <h1 className="mt-2 font-display text-3xl font-bold">
          Build classroom gameplay with a guided wizard.
        </h1>
        <p className="teacher-copy mt-3 max-w-3xl text-sm">
          The builder now moves one stage at a time: choose the classroom, choose the source, configure the gameplay,
          then schedule and publish it to students.
        </p>
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
          <h2 className="mt-2 font-display text-2xl font-bold">
            You need at least one classroom before building gameplay.
          </h2>
          <p className="teacher-copy mt-3 max-w-2xl text-sm">
            Classroom gameplay starts from a real classroom context. Create the classroom first, then come back here
            to assign built-in worlds or publish a custom level for that room.
          </p>
          <Link to="/teacher/students" className="teacher-button-primary mt-5">
            Open classroom manager
          </Link>
        </section>
      ) : (
        <section>
          <article
            className={`glass-panel min-w-0 ${isCustomBuildFocus ? 'overflow-hidden px-4 pt-6 pb-4 md:px-6 md:pt-8 md:pb-4' : 'p-6'}`}
          >
            {isCustomBuildFocus ? (
              <div className="teacher-builderBanner">
                <div className="min-w-0">
                  <p className="teacher-kicker">Focused Builder</p>
                  <h2 className="mt-2 font-display text-3xl font-bold">
                    Build a classroom room for {selectedClassroom?.name ?? 'this classroom'}
                  </h2>
                  <p className="teacher-copy mt-3 max-w-3xl text-sm">
                    The custom-room stage now takes the full workspace so the board, scoring rules, and allowed blocks
                    can fit without overlap or wasted side gaps.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="teacher-chip">{selectedClassroom?.name ?? 'No classroom'}</span>
                  <span className="teacher-chip">{form.lessonTag}</span>
                  <span className="teacher-chip">{form.difficulty}</span>
                </div>
              </div>
            ) : null}

            <div
              className={`teacher-wizardShell ${isCustomBuildFocus ? 'teacher-wizardShell--builder' : ''}`}
            >
              <div
                className={`teacher-wizardStepper ${isCustomBuildFocus ? 'teacher-wizardStepper--builder' : ''}`}
              >
                {wizardSteps.map((step, index) => {
                  const isActive = index === currentStep;
                  const isComplete = index < currentStep;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setCurrentStep(index)}
                      className={`teacher-wizardStepper__step ${
                        isActive
                          ? 'teacher-wizardStepper__step--active'
                          : isComplete
                            ? 'teacher-wizardStepper__step--complete'
                            : ''
                      }`}
                    >
                      <span className="teacher-wizardStepper__index">
                        {isComplete ? '✓' : index + 1}
                      </span>
                      <span className="teacher-wizardStepper__copy">
                        <span className="teacher-wizardStepper__title">{step.title}</span>
                        <span className="teacher-wizardStepper__description">
                          {step.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div
                className={`teacher-wizardContent ${isCustomBuildFocus ? 'teacher-wizardContent--builder' : ''}`}
              >
                {renderCurrentStep()}

                {submitError ? (
                  <div className="auth-alert auth-alert--error" role="alert">
                    {submitError}
                  </div>
                ) : null}

                <div className="teacher-wizardFooter">
                  <button
                    type="button"
                    onClick={goToPreviousStep}
                    disabled={currentStep === 0 || isSaving}
                    className="teacher-button-secondary"
                  >
                    Back
                  </button>

                  <div className="flex flex-wrap gap-3">
                    {currentStep < wizardSteps.length - 1 ? (
                      <button
                        type="button"
                        onClick={goToNextStep}
                        disabled={!canAdvanceFromCurrentStep() || isSaving}
                        className="teacher-button-primary"
                      >
                        Continue
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={submitAssignment}
                        disabled={isSaving}
                        className="teacher-button-primary"
                      >
                        {isSaving
                          ? 'Saving classroom gameplay...'
                          : deliveryMode === 'official'
                            ? officialScope === 'world'
                              ? 'Assign official world'
                              : 'Assign official level'
                            : 'Publish custom level'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>
      )}
    </div>
  );
};
