import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/shared';
import {
  useAdminAnnouncementsQuery,
  useAdminOverviewQuery,
  useAdminReportsQuery,
  useAdminUsersQuery,
} from '@/features/admin';

const statCards = [
  { key: 'userCount', label: 'Users', copy: 'All accounts currently managed by the system.' },
  { key: 'studentCount', label: 'Students', copy: 'Student accounts actively tracked by admin.' },
  { key: 'teacherCount', label: 'Teachers', copy: 'Teacher accounts creating private classrooms.' },
  { key: 'levelCount', label: 'Official Levels', copy: 'Built-in gameplay content available in normal play.' },
  { key: 'classroomCount', label: 'Classrooms', copy: 'Teacher-owned classrooms currently active.' },
  { key: 'announcementCount', label: 'Announcements', copy: 'Admin notices currently stored in the system.' },
  { key: 'reportCount', label: 'Reports', copy: 'Generated oversight records ready for review.' },
] as const;

export const Dashboard = () => {
  const overviewQuery = useAdminOverviewQuery();
  const usersQuery = useAdminUsersQuery({ page: 1, pageSize: 4 });
  const announcementsQuery = useAdminAnnouncementsQuery({ page: 1, pageSize: 3 });
  const reportsQuery = useAdminReportsQuery({ page: 1, pageSize: 3 });

  const users = usersQuery.data?.items ?? [];
  const announcements = announcementsQuery.data?.items ?? [];
  const reports = reportsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6">
        <p className="teacher-kicker">Admin Operations</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Run platform oversight from live system data</h1>
        <p className="teacher-copy mt-3 max-w-3xl text-sm">
          Phase 1 now covers the real admin loop: inspect student health, manage official levels,
          publish announcements, and generate oversight reports without placeholder screens.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/admin/users" className="teacher-button-primary">
            Manage users
          </Link>
          <Link to="/admin/levels" className="teacher-button-secondary">
            Manage levels
          </Link>
          <Link to="/admin/announcements" className="teacher-button-secondary">
            Post announcement
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => (
          <article key={card.key} className="glass-panel p-5">
            <p className="teacher-kicker">{card.label}</p>
            <p className="mt-4 font-display text-3xl font-bold text-[var(--text-0)]">
              {overviewQuery.isLoading ? '...' : overviewQuery.data?.[card.key] ?? 0}
            </p>
            <p className="teacher-copy mt-3 text-sm">{card.copy}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <article className="glass-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="teacher-kicker">Account Watchlist</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Recently created user accounts</h2>
            </div>
            <Link to="/admin/users" className="teacher-button-secondary">
              Open all
            </Link>
          </div>
          {users.length ? (
            <div className="admin-list mt-5">
              {users.map((user) => (
                <article key={user.id} className="admin-list__row admin-list__row--compact">
                  <div className="admin-list__identity">
                    <div className="min-w-0">
                      <p className="admin-list__title">{user.username}</p>
                      <p className="admin-list__subtitle">{user.email}</p>
                    </div>
                    <span className="teacher-tag">{user.role}</span>
                  </div>

                  <div className="admin-list__meta">
                    <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                    {user.role === 'STUDENT' ? <span>{user.studentProgressCount} progress rows</span> : null}
                    {user.role === 'TEACHER' ? <span>{user.taughtClassroomCount} classrooms</span> : null}
                    {user.role === 'ADMIN' ? <span>{user.reportCount} reports</span> : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-5"
              description="User accounts will appear here once the first learners, teachers, or admins are created."
            />
          )}
        </article>

        <article className="glass-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="teacher-kicker">Release Comms</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Latest announcements</h2>
            </div>
            <Link to="/admin/announcements" className="teacher-button-secondary">
              Manage
            </Link>
          </div>
          {announcements.length ? (
            <div className="mt-5 grid gap-3">
              {announcements.map((announcement) => (
                <article key={announcement.id} className="teacher-surface rounded-[24px] p-4">
                  <p className="font-semibold text-[var(--text-0)]">{announcement.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-1)]">{announcement.message}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--text-2)]">
                    {new Date(announcement.dateCreated).toLocaleString()}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-5"
              description="Announcements will show here after the first admin notice is posted."
            />
          )}
        </article>
      </section>

      <section className="glass-panel p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="teacher-kicker">Reports</p>
            <h2 className="mt-2 font-display text-2xl font-bold">Latest generated reports</h2>
          </div>
          <Link to="/admin/reports" className="teacher-button-secondary">
            Open reports
          </Link>
        </div>
        {reports.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {reports.map((report) => (
              <article key={report.id} className="teacher-surface rounded-[24px] p-4">
                <p className="font-semibold text-[var(--text-0)]">{report.reportType.replaceAll('_', ' ')}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-1)]">{report.description}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--text-2)]">
                  {new Date(report.generatedAt).toLocaleString()}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-5"
            description="Generated reports will appear here after the first admin export is created."
          />
        )}
      </section>
    </div>
  );
};
