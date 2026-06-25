import { useMemo, useState } from 'react';
import { RoomLifecycleStatus, type GameCondition, type LessonTopic, type RoomDifficulty } from '@shared/types/teacher';
import { blockPresetCatalog, buildTeacherBlocksFromPresetSelection, useCreateRoomMutation, useTeacherRoomsQuery } from '@/features/teacher';

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
  rows: number;
  cols: number;
  startRow: number;
  startCol: number;
  doorRow: number;
  doorCol: number;
  keyRow: string;
  keyCol: string;
  doorRequiresKey: boolean;
  wallsText: string;
  selectedPresetIds: string[];
  helperName: string;
  repeatCount: number;
  whileCondition: GameCondition;
};

const parseWalls = (value: string) =>
  value
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.split(',').map((segment) => Number(segment.trim())))
    .filter((entry) => entry.length === 2 && entry.every((segment) => Number.isFinite(segment)))
    .map(([row, col]) => ({ row, col }));

export const Lessons = () => {
  const roomsQuery = useTeacherRoomsQuery();
  const createRoomMutation = useCreateRoomMutation();
  const roomVersions = useMemo(() => roomsQuery.data ?? [], [roomsQuery.data]);
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
    rows: 5,
    cols: 5,
    startRow: 4,
    startCol: 0,
    doorRow: 0,
    doorCol: 4,
    keyRow: '',
    keyCol: '',
    doorRequiresKey: false,
    wallsText: '',
    selectedPresetIds: ['move-up', 'move-right', 'repeat'],
    helperName: 'helperStep',
    repeatCount: 2,
    whileCondition: 'PATH_UP_CLEAR',
  });

  const publishedRoomCount = useMemo(
    () => roomVersions.filter((room) => room.lifecycleStatus === 'PUBLISHED').length,
    [roomVersions],
  );

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
      rows: room.definition.rows,
      cols: room.definition.cols,
      startRow: room.definition.start.row,
      startCol: room.definition.start.col,
      doorRow: room.definition.door.row,
      doorCol: room.definition.door.col,
      keyRow: room.definition.key?.row?.toString() ?? '',
      keyCol: room.definition.key?.col?.toString() ?? '',
      doorRequiresKey: Boolean(room.definition.doorRequiresKey),
      wallsText: room.definition.walls.map((wall) => `${wall.row}, ${wall.col}`).join('\n'),
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
    const definition = {
      rows: Number(form.rows),
      cols: Number(form.cols),
      start: {
        row: Number(form.startRow),
        col: Number(form.startCol),
      },
      door: {
        row: Number(form.doorRow),
        col: Number(form.doorCol),
      },
      key:
        form.keyRow !== '' && form.keyCol !== ''
          ? {
              row: Number(form.keyRow),
              col: Number(form.keyCol),
            }
          : null,
      doorRequiresKey: form.doorRequiresKey,
      walls: parseWalls(form.wallsText),
      availableBlocks: buildTeacherBlocksFromPresetSelection({
        selectedPresetIds: form.selectedPresetIds,
        helperName: form.helperName,
        repeatCount: Number(form.repeatCount),
        whileCondition: form.whileCondition,
      }),
    };

    await createRoomMutation.mutateAsync({
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
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="teacher-kicker text-sm font-semibold uppercase tracking-[0.3em]">Room Builder</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Publish teacher-made rooms without leaving the dashboard.</h1>
        <p className="teacher-copy mt-3 max-w-3xl text-sm">
          The builder focuses on MVP controls that affect playability directly: layout, key-door logic, block palette,
          par moves, lesson tag, and objective text. It avoids a heavier custom-world editor for now.
        </p>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <article className="glass-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="teacher-kicker text-sm uppercase tracking-[0.28em]">Builder</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Create or version a room</h2>
            </div>
            <span className="teacher-chip">
              {publishedRoomCount} published
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
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
            <label className="block">
              <span className="teacher-label text-sm font-semibold">Lesson tag</span>
              <select
                value={form.lessonTag}
                onChange={(event) => setForm((current) => ({ ...current, lessonTag: event.target.value as typeof current.lessonTag }))}
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
                onChange={(event) => setForm((current) => ({ ...current, difficulty: event.target.value as typeof current.difficulty }))}
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
                onChange={(event) => setForm((current) => ({ ...current, lifecycleStatus: event.target.value as RoomLifecycleStatus }))}
                className="teacher-field mt-2"
              >
                <option value={RoomLifecycleStatus.DRAFT}>Draft</option>
                <option value={RoomLifecycleStatus.PUBLISHED}>Published</option>
                <option value={RoomLifecycleStatus.ARCHIVED}>Archived</option>
              </select>
            </label>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Rows', 'rows'],
              ['Cols', 'cols'],
              ['Start row', 'startRow'],
              ['Start col', 'startCol'],
              ['Door row', 'doorRow'],
              ['Door col', 'doorCol'],
              ['Key row', 'keyRow'],
              ['Key col', 'keyCol'],
            ].map(([label, field]) => (
              <label key={field} className="block">
                <span className="teacher-label text-sm font-semibold">{label}</span>
                <input
                  type="number"
                  min={0}
                  value={form[field as keyof typeof form] as string | number}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [field]: field.startsWith('key') ? event.target.value : Number(event.target.value),
                    }))
                  }
                  className="teacher-field mt-2"
                />
              </label>
            ))}
          </div>

          <label className="teacher-surface teacher-copy mt-4 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={form.doorRequiresKey}
              onChange={(event) => setForm((current) => ({ ...current, doorRequiresKey: event.target.checked }))}
            />
            Require key before entering the door
          </label>

          <label className="mt-4 block">
            <span className="teacher-label text-sm font-semibold">Walls</span>
            <textarea
              value={form.wallsText}
              onChange={(event) => setForm((current) => ({ ...current, wallsText: event.target.value }))}
              className="teacher-field mt-2 min-h-28"
              placeholder={'One wall per line\n1, 2\n2, 2\n3, 2'}
            />
          </label>

          <div className="mt-6">
            <p className="teacher-label text-sm font-semibold">Allowed blocks</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {blockPresetCatalog.map((preset) => (
                <label key={preset.id} className="teacher-surface teacher-copy flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm">
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
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
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
                  setForm((current) => ({ ...current, whileCondition: event.target.value as typeof current.whileCondition }))
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

          <button
            type="button"
            onClick={submitRoom}
            disabled={createRoomMutation.isPending}
            className="teacher-button-primary mt-6 w-full"
          >
            {createRoomMutation.isPending ? 'Saving room version...' : 'Save room version'}
          </button>
        </article>

        <article className="glass-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="teacher-kicker text-sm uppercase tracking-[0.28em]">Library</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Latest room versions</h2>
            </div>
            <span className="teacher-chip">
              {roomVersions.length} latest
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {roomVersions.map((room) => (
              <article key={room.id} className="teacher-surface rounded-3xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl font-bold text-[var(--color-ink)]">{room.title}</h3>
                    <p className="teacher-copy mt-2 text-sm">{room.description}</p>
                  </div>
                  <span className="teacher-tag">
                    {room.lifecycleStatus}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-2)]">
                  <span>v{room.versionNumber}</span>
                  <span>{room.lessonTag}</span>
                  <span>{room.parMoves} par</span>
                  <span>{room.codeBudget} budget</span>
                </div>
                <p className="teacher-copy mt-3 text-sm">{room.objective}</p>
                <button
                  type="button"
                  onClick={() => hydrateFromRoom(room.id)}
                  className="teacher-button-secondary mt-4"
                >
                  Use as next version base
                </button>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
};
