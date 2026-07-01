import { useDeferredValue, useEffect, useState } from 'react';
import { Difficulty, PuzzleType } from '@shared/types';
import { EmptyState, LoadingSpinner, PaginationControls } from '@/components/shared';
import {
  useAdminLevelDetailQuery,
  useAdminLevelsQuery,
  useCreateAdminLevelMutation,
  useDeleteAdminLevelMutation,
  useUpdateAdminLevelMutation,
} from '@/features/admin';
import { getApiErrorMessage } from '@/lib/api';
import { useToastStore } from '@/store/toastStore';

type LevelPuzzleForm = {
  description: string;
  expectedOutput: string;
  hint: string;
  type: PuzzleType;
};

type LevelFormState = {
  name: string;
  description: string;
  difficulty: Difficulty;
  order: number;
  puzzles: LevelPuzzleForm[];
};

const createEmptyPuzzle = (): LevelPuzzleForm => ({
  description: '',
  expectedOutput: '',
  hint: '',
  type: PuzzleType.SEQUENCING,
});

const createEmptyForm = (): LevelFormState => ({
  name: '',
  description: '',
  difficulty: Difficulty.EASY,
  order: 1,
  puzzles: [createEmptyPuzzle()],
});

export const LevelManager = () => {
  const [page, setPage] = useState(1);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | ''>('');
  const deferredSearch = useDeferredValue(search);
  const [form, setForm] = useState<LevelFormState>(createEmptyForm);
  const levelsQuery = useAdminLevelsQuery({
    page,
    pageSize: 8,
    search: deferredSearch.trim() || undefined,
    difficulty: difficultyFilter || undefined,
  });
  const levelDetailQuery = useAdminLevelDetailQuery(selectedLevelId);
  const createMutation = useCreateAdminLevelMutation();
  const updateMutation = useUpdateAdminLevelMutation(selectedLevelId);
  const deleteMutation = useDeleteAdminLevelMutation();
  const showToast = useToastStore((state) => state.showToast);
  const levels = levelsQuery.data?.items ?? [];

  useEffect(() => {
    if (!selectedLevelId) {
      setForm(createEmptyForm());
      return;
    }

    if (!levelDetailQuery.data) {
      return;
    }

    setForm({
      name: levelDetailQuery.data.name,
      description: levelDetailQuery.data.description,
      difficulty: levelDetailQuery.data.difficulty,
      order: levelDetailQuery.data.order,
      puzzles: levelDetailQuery.data.puzzles.length
        ? levelDetailQuery.data.puzzles.map((puzzle) => ({
            description: puzzle.description,
            expectedOutput: puzzle.expectedOutput,
            hint: puzzle.hint ?? '',
            type: puzzle.type,
          }))
        : [createEmptyPuzzle()],
    });
  }, [selectedLevelId, levelDetailQuery.data]);

  const handleSave = async () => {
    const payload = {
      name: form.name,
      description: form.description,
      difficulty: form.difficulty,
      order: form.order,
      puzzles: form.puzzles.map((puzzle, index) => ({
        description: puzzle.description,
        expectedOutput: puzzle.expectedOutput,
        hint: puzzle.hint.trim() ? puzzle.hint.trim() : null,
        type: puzzle.type,
        order: index + 1,
      })),
    };

    try {
      if (selectedLevelId) {
        await updateMutation.mutateAsync(payload);
        showToast({
          tone: 'success',
          title: 'Level updated',
          description: 'The official level and its puzzle set were updated successfully.',
        });
      } else {
        const created = await createMutation.mutateAsync(payload);
        setSelectedLevelId(created.id);
        showToast({
          tone: 'success',
          title: 'Level created',
          description: 'A new official gameplay level is now available in the system.',
        });
      }
    } catch (error) {
      showToast({
        tone: 'error',
        title: 'Level not saved',
        description: getApiErrorMessage(error, 'Review the level fields and puzzle definitions, then try again.'),
      });
    }
  };

  const handleDelete = async (levelId: string) => {
    const confirmed = window.confirm('Delete this official level?');

    if (!confirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(levelId);
      if (selectedLevelId === levelId) {
        setSelectedLevelId(null);
        setForm(createEmptyForm());
      }
      showToast({
        tone: 'success',
        title: 'Level deleted',
        description: 'The official level was removed from admin content management.',
      });
    } catch (error) {
      showToast({
        tone: 'error',
        title: 'Level not deleted',
        description: getApiErrorMessage(error, 'This level could not be deleted right now.'),
      });
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6">
        <p className="teacher-kicker">Admin / Levels</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Manage built-in gameplay levels</h1>
        <p className="teacher-copy mt-3 max-w-3xl text-sm">
          This page is for official gameplay content only. Classroom-created gameplay stays on the
          teacher side and does not mix with built-in progression.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <article className="glass-panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="teacher-kicker">Official Levels</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Current curriculum list</h2>
            </div>
            <button
              type="button"
              className="teacher-button-secondary"
              onClick={() => {
                setSelectedLevelId(null);
                setForm(createEmptyForm());
              }}
            >
              New level
            </button>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px]">
            <label className="grid gap-2">
              <span className="teacher-label text-sm font-semibold">Search levels</span>
              <input
                value={search}
                onChange={(event) => {
                  setPage(1);
                  setSearch(event.target.value);
                }}
                className="teacher-field"
                placeholder="Search by level name or description"
              />
            </label>
            <label className="grid gap-2">
              <span className="teacher-label text-sm font-semibold">Difficulty</span>
              <select
                value={difficultyFilter}
                onChange={(event) => {
                  setPage(1);
                  setDifficultyFilter(event.target.value as Difficulty | '');
                }}
                className="teacher-field"
              >
                <option value="">All difficulties</option>
                {Object.values(Difficulty).map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {levelsQuery.isLoading ? <LoadingSpinner /> : null}

          {levelsQuery.isError ? (
            <EmptyState
              className="mt-5"
              title="Could not load levels"
              description="The official level list is unavailable right now. Try again after the API responds."
            />
          ) : null}

          {!levelsQuery.isLoading && !levelsQuery.isError ? (
            <>
              {levels.length ? (
                <div className="mt-5 grid gap-3">
                  {levels.map((level) => (
                    <article key={level.id} className="teacher-surface rounded-[24px] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--text-0)]">{level.name}</p>
                          <p className="mt-1 text-sm text-[var(--text-2)]">
                            Order {level.order} / {level.difficulty}
                          </p>
                        </div>
                        <span className="teacher-tag">{level.puzzleCount} puzzles</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[var(--text-1)]">{level.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-[var(--text-2)]">
                        <span>{level.playerProgressCount} progress rows</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="teacher-button-secondary"
                          onClick={() => setSelectedLevelId(level.id)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="teacher-button-secondary"
                          onClick={() => handleDelete(level.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  className="mt-5"
                  description={
                    deferredSearch.trim() || difficultyFilter
                      ? 'No official levels matched the current filters.'
                      : 'Official levels will appear here once the first built-in level is created.'
                  }
                />
              )}

              <PaginationControls
                page={levelsQuery.data?.pagination.page ?? 1}
                totalPages={levelsQuery.data?.pagination.totalPages ?? 1}
                totalItems={levelsQuery.data?.pagination.totalItems ?? levels.length}
                pageSize={levelsQuery.data?.pagination.pageSize ?? 8}
                onPageChange={setPage}
              />
            </>
          ) : null}
        </article>

        <article className="glass-panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="teacher-kicker">{selectedLevelId ? 'Edit Level' : 'Create Level'}</p>
              <h2 className="mt-2 font-display text-2xl font-bold">
                {selectedLevelId ? 'Update official level' : 'Compose a new official level'}
              </h2>
            </div>
            {selectedLevelId && levelDetailQuery.isLoading ? <span className="teacher-tag">Loading</span> : null}
          </div>

          <div className="mt-5 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="teacher-label text-sm font-semibold">Level name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="teacher-field"
                  placeholder="World 1: Getting Started"
                />
              </label>
              <label className="grid gap-2">
                <span className="teacher-label text-sm font-semibold">Sort order</span>
                <input
                  type="number"
                  min={1}
                  value={form.order}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, order: Number(event.target.value) || 1 }))
                  }
                  className="teacher-field"
                />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="teacher-label text-sm font-semibold">Description</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className="teacher-field min-h-28 resize-y"
                placeholder="Describe the coding skill progression and intended learning outcome."
              />
            </label>

            <label className="grid gap-2 md:max-w-xs">
              <span className="teacher-label text-sm font-semibold">Difficulty</span>
              <select
                value={form.difficulty}
                onChange={(event) =>
                  setForm((current) => ({ ...current, difficulty: event.target.value as Difficulty }))
                }
                className="teacher-field"
              >
                {Object.values(Difficulty).map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
            </label>

            <div className="teacher-divider" />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="teacher-kicker">Puzzle Set</p>
                <h3 className="mt-2 font-display text-xl font-bold">Level puzzle definitions</h3>
              </div>
              <button
                type="button"
                className="teacher-button-secondary"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    puzzles: [...current.puzzles, createEmptyPuzzle()],
                  }))
                }
              >
                Add puzzle
              </button>
            </div>

            <div className="grid gap-4">
              {form.puzzles.map((puzzle, index) => (
                <article key={`${selectedLevelId ?? 'new'}-puzzle-${index + 1}`} className="teacher-surface rounded-[24px] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-[var(--text-0)]">Puzzle {index + 1}</p>
                    {form.puzzles.length > 1 ? (
                      <button
                        type="button"
                        className="teacher-button-secondary"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            puzzles: current.puzzles.filter((_, puzzleIndex) => puzzleIndex !== index),
                          }))
                        }
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-4 grid gap-4">
                    <label className="grid gap-2">
                      <span className="teacher-label text-sm font-semibold">Puzzle description</span>
                      <textarea
                        value={puzzle.description}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            puzzles: current.puzzles.map((entry, puzzleIndex) =>
                              puzzleIndex === index
                                ? { ...entry, description: event.target.value }
                                : entry,
                            ),
                          }))
                        }
                        className="teacher-field min-h-24 resize-y"
                        placeholder="Describe the puzzle objective for the player."
                      />
                    </label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="teacher-label text-sm font-semibold">Expected output</span>
                        <input
                          value={puzzle.expectedOutput}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              puzzles: current.puzzles.map((entry, puzzleIndex) =>
                                puzzleIndex === index
                                  ? { ...entry, expectedOutput: event.target.value }
                                  : entry,
                              ),
                            }))
                          }
                          className="teacher-field"
                          placeholder="Door reached"
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="teacher-label text-sm font-semibold">Puzzle type</span>
                        <select
                          value={puzzle.type}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              puzzles: current.puzzles.map((entry, puzzleIndex) =>
                                puzzleIndex === index
                                  ? { ...entry, type: event.target.value as PuzzleType }
                                  : entry,
                              ),
                            }))
                          }
                          className="teacher-field"
                        >
                          {Object.values(PuzzleType).map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label className="grid gap-2">
                      <span className="teacher-label text-sm font-semibold">Hint</span>
                      <input
                        value={puzzle.hint}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            puzzles: current.puzzles.map((entry, puzzleIndex) =>
                              puzzleIndex === index
                                ? { ...entry, hint: event.target.value }
                                : entry,
                            ),
                          }))
                        }
                        className="teacher-field"
                        placeholder="Optional hint shown to the student."
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="teacher-button-primary"
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {selectedLevelId ? 'Save level' : 'Create level'}
            </button>
            <button
              type="button"
              className="teacher-button-secondary"
              onClick={() => {
                setSelectedLevelId(null);
                setForm(createEmptyForm());
              }}
            >
              Reset form
            </button>
          </div>
        </article>
      </section>
    </div>
  );
};
