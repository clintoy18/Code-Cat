import { useDeferredValue, useEffect, useState } from 'react';
import { EmptyState, LoadingSpinner, PaginationControls } from '@/components/shared';
import {
  useAdminAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useUpdateAnnouncementMutation,
} from '@/features/admin';
import { getApiErrorMessage } from '@/lib/api';
import { useToastStore } from '@/store/toastStore';

const emptyForm = {
  title: '',
  message: '',
};

export const Announcements = () => {
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [form, setForm] = useState(emptyForm);
  const announcementsQuery = useAdminAnnouncementsQuery({
    page,
    pageSize: 8,
    search: deferredSearch.trim() || undefined,
  });
  const createMutation = useCreateAnnouncementMutation();
  const updateMutation = useUpdateAnnouncementMutation(editingId);
  const deleteMutation = useDeleteAnnouncementMutation();
  const showToast = useToastStore((state) => state.showToast);
  const announcements = announcementsQuery.data?.items ?? [];

  useEffect(() => {
    if (!editingId) {
      setForm(emptyForm);
    }
  }, [editingId]);

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync(form);
        showToast({
          tone: 'success',
          title: 'Announcement updated',
          description: 'The latest system notice is now live for the admin workspace.',
        });
      } else {
        await createMutation.mutateAsync(form);
        showToast({
          tone: 'success',
          title: 'Announcement created',
          description: 'A new system note has been posted successfully.',
        });
      }

      setEditingId(null);
      setForm(emptyForm);
    } catch (error) {
      showToast({
        tone: 'error',
        title: 'Announcement not saved',
        description: getApiErrorMessage(error, 'Check the title and message, then try again.'),
      });
    }
  };

  const handleDelete = async (announcementId: string) => {
    const confirmed = window.confirm('Delete this announcement?');

    if (!confirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(announcementId);
      if (editingId === announcementId) {
        setEditingId(null);
        setForm(emptyForm);
      }
      showToast({
        tone: 'success',
        title: 'Announcement removed',
        description: 'The notice has been cleared from the system feed.',
      });
    } catch (error) {
      showToast({
        tone: 'error',
        title: 'Announcement not removed',
        description: getApiErrorMessage(error, 'The announcement could not be deleted right now.'),
      });
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6">
        <p className="teacher-kicker">Admin / Announcements</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Post and maintain system notices</h1>
        <p className="teacher-copy mt-3 max-w-3xl text-sm">
          Use this page for broadcast copy, release notes, and classwide reminders that admins need
          to manage centrally.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <article className="glass-panel p-6">
          <p className="teacher-kicker">{editingId ? 'Update Notice' : 'New Notice'}</p>
          <h2 className="mt-2 font-display text-2xl font-bold">
            {editingId ? 'Edit announcement' : 'Create announcement'}
          </h2>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2">
              <span className="teacher-label text-sm font-semibold">Title</span>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="teacher-field"
                placeholder="Platform maintenance, demo reminder, release note"
              />
            </label>
            <label className="grid gap-2">
              <span className="teacher-label text-sm font-semibold">Message</span>
              <textarea
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                className="teacher-field min-h-40 resize-y"
                placeholder="Write the announcement copy here."
              />
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className="teacher-button-primary"
              onClick={handleSubmit}
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                form.title.trim().length < 3 ||
                form.message.trim().length < 10
              }
            >
              {editingId ? 'Save announcement' : 'Post announcement'}
            </button>
            <button
              type="button"
              className="teacher-button-secondary"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Reset
            </button>
          </div>
        </article>

        <article className="glass-panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="teacher-kicker">Announcement Feed</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Recent posts</h2>
            </div>
            <span className="teacher-chip">
              {announcementsQuery.data?.pagination.totalItems ?? 0} total notices
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:max-w-md">
            <label className="grid gap-2">
              <span className="teacher-label text-sm font-semibold">Search announcements</span>
              <input
                value={search}
                onChange={(event) => {
                  setPage(1);
                  setSearch(event.target.value);
                }}
                className="teacher-field"
                placeholder="Search by announcement title or message"
              />
            </label>
          </div>

          {announcementsQuery.isLoading ? <LoadingSpinner /> : null}

          {announcementsQuery.isError ? (
            <EmptyState
              className="mt-5"
              title="Could not load announcements"
              description="The announcement feed is unavailable right now. Try again after the API responds."
            />
          ) : null}

          {!announcementsQuery.isLoading && !announcementsQuery.isError ? (
            <>
              {announcements.length ? (
                <div className="mt-5 grid gap-3">
                  {announcements.map((announcement) => (
                    <article key={announcement.id} className="teacher-surface rounded-[24px] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-display text-xl font-bold text-[var(--text-0)]">
                            {announcement.title}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-[var(--text-1)]">
                            {announcement.message}
                          </p>
                        </div>
                        <span className="teacher-tag">{announcement.admin.username}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-2)]">
                          {new Date(announcement.dateCreated).toLocaleString()}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="teacher-button-secondary"
                            onClick={() => {
                              setEditingId(announcement.id);
                              setForm({
                                title: announcement.title,
                                message: announcement.message,
                              });
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="teacher-button-secondary"
                            onClick={() => handleDelete(announcement.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  className="mt-5"
                  description={
                    deferredSearch.trim()
                      ? 'No announcements matched the current search.'
                      : 'Announcements will appear here once the first system notice is posted.'
                  }
                />
              )}

              <PaginationControls
                page={announcementsQuery.data?.pagination.page ?? 1}
                totalPages={announcementsQuery.data?.pagination.totalPages ?? 1}
                totalItems={announcementsQuery.data?.pagination.totalItems ?? announcements.length}
                pageSize={announcementsQuery.data?.pagination.pageSize ?? 8}
                onPageChange={setPage}
              />
            </>
          ) : null}
        </article>
      </section>
    </div>
  );
};
