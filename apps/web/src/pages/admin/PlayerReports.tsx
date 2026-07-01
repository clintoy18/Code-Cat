import { useDeferredValue, useState } from 'react';
import { AdminReportType } from '@shared/types';
import { EmptyState, LoadingSpinner, PaginationControls } from '@/components/shared';
import { useAdminReportsQuery, useGenerateReportMutation } from '@/features/admin';
import { getApiErrorMessage } from '@/lib/api';
import { useToastStore } from '@/store/toastStore';

export const PlayerReports = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<AdminReportType | ''>('');
  const [newReportType, setNewReportType] = useState<AdminReportType>(AdminReportType.PLAYER_PROGRESS);
  const [description, setDescription] = useState('');
  const deferredSearch = useDeferredValue(search);
  const reportsQuery = useAdminReportsQuery({
    page,
    pageSize: 8,
    search: deferredSearch.trim() || undefined,
    reportType: filterType || undefined,
  });
  const generateMutation = useGenerateReportMutation();
  const showToast = useToastStore((state) => state.showToast);
  const reports = reportsQuery.data?.items ?? [];

  const handleGenerate = async () => {
    try {
      await generateMutation.mutateAsync({
        reportType: newReportType,
        description,
      });
      setDescription('');
      showToast({
        tone: 'success',
        title: 'Report generated',
        description: 'The admin report has been recorded and added to the oversight feed.',
      });
    } catch (error) {
      showToast({
        tone: 'error',
        title: 'Report not generated',
        description: getApiErrorMessage(error, 'Review the report details and try again.'),
      });
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6">
        <p className="teacher-kicker">Admin / Reports</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Generate and review oversight reports</h1>
        <p className="teacher-copy mt-3 max-w-3xl text-sm">
          Reports are stored as admin records for your capstone demo workflow. Use them to track
          progress health, content usage, and achievement outcomes over time.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <article className="glass-panel p-6">
          <p className="teacher-kicker">Generate Report</p>
          <h2 className="mt-2 font-display text-2xl font-bold">Create a new admin report</h2>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2">
              <span className="teacher-label text-sm font-semibold">Report type</span>
              <select
                value={newReportType}
                onChange={(event) => setNewReportType(event.target.value as AdminReportType)}
                className="teacher-field"
              >
                {Object.values(AdminReportType).map((type) => (
                  <option key={type} value={type}>
                    {type.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="teacher-label text-sm font-semibold">Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="teacher-field min-h-40 resize-y"
                placeholder="Describe what this report is intended to capture."
              />
            </label>
          </div>
          <div className="mt-5">
            <button
              type="button"
              className="teacher-button-primary"
              onClick={handleGenerate}
              disabled={generateMutation.isPending || description.trim().length < 10}
            >
              Generate report
            </button>
          </div>
        </article>

        <article className="glass-panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="teacher-kicker">Report Feed</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Generated reports</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="grid gap-2 text-sm">
                <span className="teacher-label font-semibold">Search</span>
                <input
                  value={search}
                  onChange={(event) => {
                    setPage(1);
                    setSearch(event.target.value);
                  }}
                  className="teacher-field min-w-56"
                  placeholder="Search report descriptions"
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="teacher-label font-semibold">Filter</span>
                <select
                  value={filterType}
                  onChange={(event) => {
                    setPage(1);
                    setFilterType(event.target.value as AdminReportType | '');
                  }}
                  className="teacher-field min-w-48"
                >
                  <option value="">All report types</option>
                  {Object.values(AdminReportType).map((type) => (
                    <option key={type} value={type}>
                      {type.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>
              <span className="teacher-chip">
                {reportsQuery.data?.pagination.totalItems ?? 0} total reports
              </span>
            </div>
          </div>

          {reportsQuery.isLoading ? <LoadingSpinner /> : null}

          {reportsQuery.isError ? (
            <EmptyState
              className="mt-5"
              title="Could not load reports"
              description="The report feed is not available right now. Try again after the API responds."
            />
          ) : null}

          {!reportsQuery.isLoading && !reportsQuery.isError ? (
            <>
              {reports.length ? (
                <div className="mt-5 grid gap-3">
                  {reports.map((report) => (
                    <article key={report.id} className="teacher-surface rounded-[24px] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--text-0)]">
                            {report.reportType.replaceAll('_', ' ')}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[var(--text-1)]">
                            {report.description}
                          </p>
                        </div>
                        <span className="teacher-tag">{report.admin.username}</span>
                      </div>
                      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[var(--text-2)]">
                        {new Date(report.generatedAt).toLocaleString()}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  className="mt-5"
                  description={
                    deferredSearch.trim() || filterType
                      ? 'No reports matched the current filters.'
                      : 'Reports will show here once the first admin export is generated.'
                  }
                />
              )}

              <PaginationControls
                page={reportsQuery.data?.pagination.page ?? 1}
                totalPages={reportsQuery.data?.pagination.totalPages ?? 1}
                totalItems={reportsQuery.data?.pagination.totalItems ?? reports.length}
                pageSize={reportsQuery.data?.pagination.pageSize ?? 8}
                onPageChange={setPage}
              />
            </>
          ) : null}
        </article>
      </section>
    </div>
  );
};
