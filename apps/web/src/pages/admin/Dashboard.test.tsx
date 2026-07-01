import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Dashboard } from './Dashboard';

vi.mock('@/features/admin', () => ({
  useAdminOverviewQuery: () => ({
    isLoading: false,
    data: {
      userCount: 15,
      studentCount: 10,
      teacherCount: 4,
      adminCount: 1,
      levelCount: 6,
      classroomCount: 12,
      assignmentCount: 18,
      announcementCount: 3,
      reportCount: 7,
    },
  }),
  useAdminUsersQuery: () => ({
    data: {
      items: [
        {
          id: 'teacher-1',
          username: 'Mia',
          email: 'mia@example.com',
          role: 'TEACHER',
          createdAt: new Date('2026-06-30T10:00:00.000Z').toISOString(),
          studentProgressCount: 0,
          achievementCount: 2,
          enrolledClassroomCount: 0,
          taughtClassroomCount: 3,
          assignmentCount: 6,
          customRoomCount: 2,
          announcementCount: 0,
          reportCount: 0,
          canDelete: false,
        },
      ],
    },
  }),
  useAdminAnnouncementsQuery: () => ({
    data: {
      items: [
        {
          id: 'announcement-1',
          adminId: 'admin-1',
          title: 'Demo readiness',
          message: 'Seed data and admin tools are now ready for review.',
          dateCreated: new Date('2026-06-30T09:00:00.000Z').toISOString(),
          admin: {
            id: 'admin-1',
            username: 'Capstone Admin',
            email: 'admin@example.com',
          },
        },
      ],
    },
  }),
  useAdminReportsQuery: () => ({
    data: {
      items: [
        {
          id: 'report-1',
          adminId: 'admin-1',
          reportType: 'PLAYER_PROGRESS',
          description: 'Snapshot of current classroom completion health.',
          generatedAt: new Date('2026-06-30T08:00:00.000Z').toISOString(),
          admin: {
            id: 'admin-1',
            username: 'Capstone Admin',
            email: 'admin@example.com',
          },
        },
      ],
    },
  }),
}));

describe('Admin Dashboard', () => {
  it('renders live admin metrics and shortcut surfaces', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: /Run platform oversight from live system data/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Demo readiness')).toBeInTheDocument();
    expect(screen.getByText('Snapshot of current classroom completion health.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Manage users/i })).toBeInTheDocument();
  });
});
