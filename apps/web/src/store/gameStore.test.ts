import { beforeEach, describe, expect, it } from 'vitest';
import { Role, type IUser } from '@shared/types';
import { starterPuzzles } from '@/features/game/data/starterPuzzles';
import { useAuthStore } from './authStore';
import { useGameStore } from './gameStore';

const buildStudent = (id: string): IUser => ({
  id,
  username: id,
  email: `${id}@example.com`,
  role: Role.STUDENT,
  createdAt: '2026-06-25T00:00:00.000Z',
});

describe('gameStore progress isolation', () => {
  beforeEach(async () => {
    localStorage.clear();
    useAuthStore.getState().logout();
    await useGameStore.persist.rehydrate();
  });

  it('keeps official progression separate for each authenticated student', async () => {
    const firstPuzzle = starterPuzzles[0];
    const secondPuzzle = starterPuzzles[1];

    useAuthStore.getState().setSession({
      token: 'token-student-1',
      user: buildStudent('student-1'),
    });
    await useGameStore.persist.rehydrate();

    useGameStore.setState({
      completedPuzzleIds: [firstPuzzle.id],
      unlockedPuzzleIds: [firstPuzzle.id, secondPuzzle.id],
      activePuzzleId: secondPuzzle.id,
      latestCompletedPuzzleId: firstPuzzle.id,
    });

    expect(
      localStorage.getItem('codecat-game:student-1'),
    ).toContain(firstPuzzle.id);

    useAuthStore.getState().setSession({
      token: 'token-student-2',
      user: buildStudent('student-2'),
    });
    await useGameStore.persist.rehydrate();

    expect(useGameStore.getState().completedPuzzleIds).toEqual([]);
    expect(useGameStore.getState().latestCompletedPuzzleId).toBeNull();
    expect(useGameStore.getState().unlockedPuzzleIds).toEqual([firstPuzzle.id]);

    useGameStore.setState({
      completedPuzzleIds: [firstPuzzle.id, secondPuzzle.id],
      unlockedPuzzleIds: starterPuzzles.slice(0, 3).map((puzzle) => puzzle.id),
      activePuzzleId: starterPuzzles[2]?.id ?? secondPuzzle.id,
      latestCompletedPuzzleId: secondPuzzle.id,
    });

    expect(
      localStorage.getItem('codecat-game:student-2'),
    ).toContain(secondPuzzle.id);

    useAuthStore.getState().setSession({
      token: 'token-student-1',
      user: buildStudent('student-1'),
    });
    await useGameStore.persist.rehydrate();

    expect(useGameStore.getState().completedPuzzleIds).toEqual([
      firstPuzzle.id,
    ]);
    expect(useGameStore.getState().latestCompletedPuzzleId).toBe(
      firstPuzzle.id,
    );
    expect(useGameStore.getState().activePuzzleId).toBe(secondPuzzle.id);
  });
});
