import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { starterPuzzles } from '@/features/game/data/starterPuzzles';
import { LevelSelect } from './LevelSelect';

const mockStartOfficialSession = vi.fn();
const mockStudentAssignmentsData = [
  {
    classroom: {
      id: 'classroom-1',
      teacherId: 'teacher-1',
      name: 'Loop Lab',
      description: 'Teacher assigned loop drills.',
      isPrivate: true,
      requiresApproval: false,
      createdAt: '2026-06-25T00:00:00.000Z',
      updatedAt: '2026-06-25T00:00:00.000Z',
    },
    enrolledAt: '2026-06-25T00:00:00.000Z',
    assignments: [
      {
        assignment: {
          id: 'assignment-1',
          classroomId: 'classroom-1',
          teacherId: 'teacher-1',
          targetType: 'OFFICIAL_WORLD',
          title: 'Loop Sprint',
          description: 'Focus on efficient repeats.',
          startAt: '2026-06-25T00:00:00.000Z',
          dueAt: '2026-07-02T00:00:00.000Z',
          officialWorldId: 'loops',
          officialPuzzleId: null,
          customRoomVersionId: null,
          roomManifest: [
            {
              roomKey: 'terrace-repeat',
              title: 'Terrace Repeat',
              objective: 'Build two repeat blocks.',
              lesson: 'Loops',
              difficulty: 'Easy',
              parMoves: 2,
              codeBudget: 2,
              sourceType: 'OFFICIAL_PUZZLE',
              worldId: 'loops',
              officialPuzzleId: 'terrace-repeat',
            },
          ],
          createdAt: '2026-06-25T00:00:00.000Z',
          updatedAt: '2026-06-25T00:00:00.000Z',
        },
        progress: [],
        customRoom: null,
      },
    ],
  },
];

vi.mock('@/hooks/useGame', () => ({
  useGame: () => ({
    officialPuzzles: starterPuzzles,
    loadPuzzle: vi.fn(),
    unlockedPuzzleIds: starterPuzzles.map((puzzle) => puzzle.id),
    completedPuzzleIds: [],
    startOfficialSession: mockStartOfficialSession,
  }),
}));

vi.mock('@/features/teacher', () => ({
  useStudentAssignmentsQuery: () => ({
    data: mockStudentAssignmentsData,
  }),
}));

describe('LevelSelect', () => {
  it('prioritizes the next playable room and hides scaffolded roadmap copy', () => {
    render(
      <MemoryRouter>
        <LevelSelect />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: /Recommended next room/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Playable Worlds/i)).toBeInTheDocument();
    expect(screen.getByText(/World 6: Strategy/i)).toBeInTheDocument();
    expect(screen.queryByText(/scaffolded/i)).not.toBeInTheDocument();
  });

  it('shows assigned classroom work above the official progression map', () => {
    render(
      <MemoryRouter>
        <LevelSelect />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Teacher classroom work/i)).toBeInTheDocument();
    expect(screen.getByText(/Loop Lab/i)).toBeInTheDocument();
    expect(screen.getByText(/Loop Sprint/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Play Assignment/i })).toBeInTheDocument();
  });
});
