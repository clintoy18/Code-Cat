import { useDeferredValue, useState } from 'react';
import { Role } from '@shared/types';
import { EmptyState, LoadingSpinner, PaginationControls } from '@/components/shared';
import {
  useAdminUsersQuery,
  useCreateAdminUserMutation,
  useDeleteAdminUserMutation,
  useUpdateAdminUserMutation,
} from '@/features/admin';
import { getApiErrorMessage } from '@/lib/api';
import { useToastStore } from '@/store/toastStore';

const emptyForm = {
  username: '',
  email: '',
  password: '',
  role: Role.STUDENT,
};

const getUserMetrics = (user: {
  role: Role;
  studentProgressCount: number;
  taughtClassroomCount: number;
  achievementCount: number;
  assignmentCount: number;
  reportCount: number;
  enrolledClassroomCount: number;
  customRoomCount: number;
  announcementCount: number;
}) => [
  {
    label: user.role === Role.STUDENT ? 'Progress' : 'Classrooms',
    value: user.role === Role.STUDENT ? user.studentProgressCount : user.taughtClassroomCount,
  },
  {
    label:
      user.role === Role.STUDENT ? 'Achievements' : user.role === Role.TEACHER ? 'Assignments' : 'Reports',
    value: user.role === Role.STUDENT ? user.achievementCount : user.role === Role.TEACHER ? user.assignmentCount : user.reportCount,
  },
  {
    label:
      user.role === Role.STUDENT ? 'Enrollments' : user.role === Role.TEACHER ? 'Custom rooms' : 'Announcements',
    value:
      user.role === Role.STUDENT
        ? user.enrolledClassroomCount
        : user.role === Role.TEACHER
          ? user.customRoomCount
          : user.announcementCount,
  },
];

export const Users = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const deferredSearch = useDeferredValue(search);
  const usersQuery = useAdminUsersQuery({
    page,
    pageSize: 12,
    search: deferredSearch.trim() || undefined,
    role: roleFilter || undefined,
  });
  const createUserMutation = useCreateAdminUserMutation();
  const updateUserMutation = useUpdateAdminUserMutation(editingId);
  const deleteUserMutation = useDeleteAdminUserMutation();
  const showToast = useToastStore((state) => state.showToast);
  const users = usersQuery.data?.items ?? [];

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await updateUserMutation.mutateAsync({
          username: form.username,
          email: form.email,
          role: form.role,
          password: form.password.trim() ? form.password : undefined,
        });
        showToast({
          tone: 'success',
          title: 'User updated',
          description: 'The account details were updated successfully.',
        });
      } else {
        await createUserMutation.mutateAsync(form);
        showToast({
          tone: 'success',
          title: 'User created',
          description: 'A new account is now available in the system.',
        });
      }

      setEditingId(null);
      setForm(emptyForm);
    } catch (error) {
      showToast({
        tone: 'error',
        title: 'User not saved',
        description: getApiErrorMessage(error, 'Check the account details and try again.'),
      });
    }
  };

  const handleDelete = async (userId: string) => {
    const confirmed = window.confirm('Delete this user account?');

    if (!confirmed) {
      return;
    }

    try {
      await deleteUserMutation.mutateAsync(userId);
      if (editingId === userId) {
        setEditingId(null);
        setForm(emptyForm);
      }
      showToast({
        tone: 'success',
        title: 'User deleted',
        description: 'The account was removed successfully.',
      });
    } catch (error) {
      showToast({
        tone: 'error',
        title: 'User not deleted',
        description: getApiErrorMessage(error, 'This account could not be deleted right now.'),
      });
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6">
        <p className="teacher-kicker">Admin / Users</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Create and manage user accounts</h1>
        <p className="teacher-copy mt-3 max-w-3xl text-sm">
          Admin owns account management. Player performance and classroom outcomes stay on the teacher side,
          while this screen handles account creation, edits, search, filtering, and safe deletion.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <article className="glass-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="teacher-kicker">Directory</p>
            <h2 className="mt-2 font-display text-2xl font-bold">User records</h2>
          </div>
          <span className="teacher-chip">
            {usersQuery.data?.pagination.totalItems ?? 0} total users
          </span>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <label className="grid gap-2">
            <span className="teacher-label text-sm font-semibold">Search users</span>
            <input
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              className="teacher-field"
              placeholder="Search by account name or email"
            />
          </label>
          <label className="grid gap-2">
            <span className="teacher-label text-sm font-semibold">Role</span>
            <select
              value={roleFilter}
              onChange={(event) => {
                setPage(1);
                setRoleFilter(event.target.value as Role | '');
              }}
              className="teacher-field"
            >
              <option value="">All roles</option>
              {Object.values(Role).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
        </div>

        {usersQuery.isLoading ? <LoadingSpinner /> : null}

        {usersQuery.isError ? (
          <EmptyState
            title="Could not load users"
            description="The account directory is not available right now. Refresh the page or try again after the API settles."
            className="mt-5"
          />
        ) : null}

        {!usersQuery.isLoading && !usersQuery.isError ? (
          <>
            {users.length ? (
              <div className="admin-list mt-5">
                <div className="admin-list__header admin-list__header--users">
                  <span>Account</span>
                  <span>Created</span>
                  <span>Role activity</span>
                  <span>Performance</span>
                  <span>Coverage</span>
                  <span>Actions</span>
                </div>
                <div className="space-y-3">
                  {users.map((user) => {
                    const metrics = getUserMetrics(user);

                    return (
                      <article key={user.id} className="admin-list__row admin-list__row--users">
                        <div className="admin-list__identity">
                          <div className="min-w-0">
                            <h3 className="admin-list__title">{user.username}</h3>
                            <p className="admin-list__subtitle">{user.email}</p>
                          </div>
                          <span className="teacher-tag">{user.role}</span>
                        </div>

                        <div className="admin-list__cell">
                          <span className="admin-list__mobileLabel">Created</span>
                          <p className="admin-list__value">{new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>

                        {metrics.map((metric) => (
                          <div key={metric.label} className="admin-list__cell">
                            <span className="admin-list__mobileLabel">{metric.label}</span>
                            <p className="admin-list__value">{metric.value}</p>
                            <p className="admin-list__caption">{metric.label}</p>
                          </div>
                        ))}

                        <div className="admin-list__actions">
                          <button
                            type="button"
                            className="teacher-button-secondary"
                            onClick={() => {
                              setEditingId(user.id);
                              setForm({
                                username: user.username,
                                email: user.email,
                                password: '',
                                role: user.role,
                              });
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="teacher-button-secondary"
                            disabled={!user.canDelete}
                            onClick={() => handleDelete(user.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : (
              <EmptyState
                className="mt-5"
                description={
                  deferredSearch.trim() || roleFilter
                    ? 'No user accounts matched the current filters.'
                    : 'User accounts will appear here once accounts have been seeded or created.'
                }
              />
            )}

            <PaginationControls
              page={usersQuery.data?.pagination.page ?? 1}
              totalPages={usersQuery.data?.pagination.totalPages ?? 1}
              totalItems={usersQuery.data?.pagination.totalItems ?? users.length}
              pageSize={usersQuery.data?.pagination.pageSize ?? 12}
              onPageChange={setPage}
            />
          </>
        ) : null}
      </article>

      <article className="glass-panel p-6">
        <p className="teacher-kicker">{editingId ? 'Update Account' : 'Create Account'}</p>
        <h2 className="mt-2 font-display text-2xl font-bold">
          {editingId ? 'Edit user account' : 'Create a new user account'}
        </h2>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-2">
            <span className="teacher-label text-sm font-semibold">Username</span>
            <input
              value={form.username}
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              className="teacher-field"
              placeholder="Enter display name"
            />
          </label>
          <label className="grid gap-2">
            <span className="teacher-label text-sm font-semibold">Email</span>
            <input
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="teacher-field"
              placeholder="account@codecat.dev"
            />
          </label>
          <label className="grid gap-2">
            <span className="teacher-label text-sm font-semibold">Role</span>
            <select
              value={form.role}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Role }))}
              className="teacher-field"
            >
              {Object.values(Role).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="teacher-label text-sm font-semibold">
              {editingId ? 'Password reset' : 'Password'}
            </span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="teacher-field"
              placeholder={editingId ? 'Leave blank to keep current password' : 'Minimum 8 characters'}
            />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            className="teacher-button-primary"
            onClick={handleSubmit}
            disabled={
              createUserMutation.isPending ||
              updateUserMutation.isPending ||
              form.username.trim().length < 3 ||
              form.email.trim().length < 5 ||
              (!editingId && form.password.trim().length < 8)
            }
          >
            {editingId ? 'Save account' : 'Create account'}
          </button>
          <button
            type="button"
            className="teacher-button-secondary"
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
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
