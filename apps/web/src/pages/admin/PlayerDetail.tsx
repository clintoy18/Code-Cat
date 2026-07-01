import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState, LoadingSpinner, PaginationControls } from '@/components/shared';
import { useAdminPlayerProgressQuery } from '@/features/admin';

const formatDateTime = (value: string | null) => {
  if (!value) {
    return 'Not available';
  }

  return new Date(value).toLocaleString();
};

export const PlayerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);
  const playerQuery = useAdminPlayerProgressQuery(id ?? null, { page, pageSize: 10 });
  const payload = playerQuery.data;
  const progressItems = payload?.progress.items ?? [];
  const achievements = payload?.achievements ?? [];

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to="/admin/players" className="teacher-button-secondary">
              Back to players
            </Link>
            <p className="teacher-kicker mt-5">Admin / Player Detail</p>
            <h1 className="mt-2 font-display text-3xl font-bold">
              {payload?.player.username ?? 'Student progress'}
            </h1>
            <p className="teacher-copy mt-3 text-sm">
              {payload?.player.email ?? 'Progress, attempts, achievements, and completion history live here.'}
            </p>
          </div>
          <span className="teacher-chip">
            Last activity: {formatDateTime(payload?.player.lastActiveAt ?? null)}
          </span>
        </div>
      </section>

      {playerQuery.isLoading ? <LoadingSpinner /> : null}

      {playerQuery.isError ? (
        <EmptyState
          title="Could not load player progress"
          description="The selected student could not be loaded. Return to the player list and try another account."
        />
      ) : null}

      {!playerQuery.isLoading && !playerQuery.isError && payload ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <article className="glass-panel p-5">
              <p className="teacher-kicker">Progress rows</p>
              <p className="mt-4 font-display text-3xl font-bold">{payload.player.progressCount}</p>
            </article>
            <article className="glass-panel p-5">
              <p className="teacher-kicker">Completed</p>
              <p className="mt-4 font-display text-3xl font-bold">{payload.player.completedProgressCount}</p>
            </article>
            <article className="glass-panel p-5">
              <p className="teacher-kicker">Achievements</p>
              <p className="mt-4 font-display text-3xl font-bold">{payload.player.achievementCount}</p>
            </article>
            <article className="glass-panel p-5">
              <p className="teacher-kicker">Attempts</p>
              <p className="mt-4 font-display text-3xl font-bold">{payload.player.totalAttempts}</p>
            </article>
            <article className="glass-panel p-5">
              <p className="teacher-kicker">Time spent</p>
              <p className="mt-4 font-display text-3xl font-bold">{payload.player.totalTimeSpent}s</p>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
            <article className="glass-panel p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="teacher-kicker">Progress History</p>
                  <h2 className="mt-2 font-display text-2xl font-bold">Latest puzzle outcomes</h2>
                </div>
                <span className="teacher-tag">
                  {payload.progress.pagination.totalItems} total rows
                </span>
              </div>

              {progressItems.length ? (
                <div className="mt-5 grid gap-3">
                  {progressItems.map((entry) => (
                    <article key={entry.id} className="teacher-surface rounded-[24px] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--text-0)]">{entry.level.name}</p>
                          <p className="mt-1 text-sm text-[var(--text-2)]">
                            Puzzle {entry.puzzle.order}: {entry.puzzle.description}
                          </p>
                        </div>
                        <span className="teacher-tag">{entry.status.replaceAll('_', ' ')}</span>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <p className="text-sm text-[var(--text-1)]">Attempts: {entry.attempts}</p>
                        <p className="text-sm text-[var(--text-1)]">Time spent: {entry.timeSpent}s</p>
                        <p className="text-sm text-[var(--text-1)]">
                          Updated: {new Date(entry.lastUpdated).toLocaleString()}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  className="mt-5"
                  description="No progress rows have been recorded for this student yet."
                />
              )}

              <PaginationControls
                page={payload.progress.pagination.page}
                totalPages={payload.progress.pagination.totalPages}
                totalItems={payload.progress.pagination.totalItems}
                pageSize={payload.progress.pagination.pageSize}
                onPageChange={setPage}
              />
            </article>

            <article className="glass-panel p-6">
              <p className="teacher-kicker">Achievements</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Unlocked badges</h2>

              {achievements.length ? (
                <div className="mt-5 grid gap-3">
                  {achievements.map((achievement) => (
                    <article key={achievement.id} className="teacher-surface rounded-[24px] p-4">
                      <p className="font-semibold text-[var(--text-0)]">{achievement.name}</p>
                      <p className="mt-2 text-sm text-[var(--text-1)]">{achievement.description}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--text-2)]">
                        {new Date(achievement.dateUnlocked).toLocaleString()}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  className="mt-5"
                  description="This student has not unlocked any achievements yet."
                />
              )}
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
};
