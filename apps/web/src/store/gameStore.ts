import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { starterPuzzles } from '@/features/game/data/starterPuzzles';
import {
  gameEngine,
  type IBlockTemplate,
  type IGameEngineSnapshot,
  type IPuzzleDefinition,
} from '@/features/game/engine';

interface IGameState extends IGameEngineSnapshot {
  officialPuzzles: IPuzzleDefinition[];
  puzzles: IPuzzleDefinition[];
  sessionMode: 'official' | 'assignment';
  activeAssignmentId: string | null;
  activePuzzleId: string | null;
  completedPuzzleIds: string[];
  completedAssignmentPuzzleIds: string[];
  unlockedPuzzleIds: string[];
  latestCompletedPuzzleId: string | null;
  startOfficialSession: (initialPuzzleId?: string | null) => void;
  startAssignmentSession: (assignmentId: string, puzzles: IPuzzleDefinition[], initialPuzzleId?: string | null) => void;
  loadPuzzle: (puzzleId: string) => void;
  addBlock: (template: IBlockTemplate) => void;
  replaceProgram: (templates: IBlockTemplate[]) => void;
  removeBlock: (blockId: string) => void;
  clearProgram: () => void;
  runProgram: () => IGameEngineSnapshot;
  resetPuzzle: () => void;
}

const getOfficialUnlockedPuzzleIds = (completedPuzzleIds: string[]) => {
  const unlocked = new Set<string>();

  if (starterPuzzles[0]) {
    unlocked.add(starterPuzzles[0].id);
  }

  starterPuzzles.forEach((puzzle, index) => {
    if (!completedPuzzleIds.includes(puzzle.id)) {
      return;
    }

    unlocked.add(puzzle.id);

    const nextPuzzle = starterPuzzles[index + 1];

    if (nextPuzzle) {
      unlocked.add(nextPuzzle.id);
    }
  });

  return Array.from(unlocked);
};

const getNextOpenOfficialPuzzleId = (completedPuzzleIds: string[], unlockedPuzzleIds: string[]) =>
  starterPuzzles.find((puzzle) => unlockedPuzzleIds.includes(puzzle.id) && !completedPuzzleIds.includes(puzzle.id))?.id ??
  starterPuzzles.find((puzzle) => unlockedPuzzleIds.includes(puzzle.id))?.id ??
  starterPuzzles[0]?.id ??
  null;

gameEngine.loadPuzzle(starterPuzzles[0]);

const initialSnapshot = gameEngine.getSnapshot();
const initialUnlockedPuzzleIds = getOfficialUnlockedPuzzleIds([]);

export const useGameStore = create<IGameState>()(
  persist(
    (set, get) => ({
      ...initialSnapshot,
      officialPuzzles: starterPuzzles,
      puzzles: starterPuzzles,
      sessionMode: 'official',
      activeAssignmentId: null,
      activePuzzleId: initialSnapshot.puzzle?.id ?? null,
      completedPuzzleIds: [],
      completedAssignmentPuzzleIds: [],
      unlockedPuzzleIds: initialUnlockedPuzzleIds,
      latestCompletedPuzzleId: null,
      startOfficialSession: (initialPuzzleId = null) => {
        const { completedPuzzleIds } = get();
        const unlockedPuzzleIds = getOfficialUnlockedPuzzleIds(completedPuzzleIds);
        const nextPuzzleId =
          initialPuzzleId && unlockedPuzzleIds.includes(initialPuzzleId)
            ? initialPuzzleId
            : getNextOpenOfficialPuzzleId(completedPuzzleIds, unlockedPuzzleIds);
        const nextPuzzle =
          starterPuzzles.find((puzzle) => puzzle.id === nextPuzzleId) ?? starterPuzzles[0] ?? null;

        if (nextPuzzle) {
          gameEngine.loadPuzzle(nextPuzzle);
        }

        set({
          officialPuzzles: starterPuzzles,
          puzzles: starterPuzzles,
          sessionMode: 'official',
          activeAssignmentId: null,
          completedAssignmentPuzzleIds: [],
          unlockedPuzzleIds,
          latestCompletedPuzzleId: null,
        });
      },
      startAssignmentSession: (assignmentId, puzzles, initialPuzzleId = null) => {
        const nextPuzzle =
          puzzles.find((puzzle) => puzzle.id === initialPuzzleId) ?? puzzles[0] ?? null;

        if (!nextPuzzle) {
          return;
        }

        gameEngine.loadPuzzle(nextPuzzle);
        set({
          puzzles,
          sessionMode: 'assignment',
          activeAssignmentId: assignmentId,
          completedAssignmentPuzzleIds: [],
          unlockedPuzzleIds: puzzles.map((puzzle) => puzzle.id),
          latestCompletedPuzzleId: null,
        });
      },
      loadPuzzle: (puzzleId) => {
        const { puzzles, unlockedPuzzleIds } = get();
        const nextPuzzle = puzzles.find((puzzle) => puzzle.id === puzzleId);

        if (nextPuzzle && unlockedPuzzleIds.includes(puzzleId)) {
          gameEngine.loadPuzzle(nextPuzzle);
        }
      },
      addBlock: (template) => {
        gameEngine.appendBlock(template);
      },
      replaceProgram: (templates) => {
        gameEngine.replaceProgram(templates);
      },
      removeBlock: (blockId) => {
        gameEngine.removeBlock(blockId);
      },
      clearProgram: () => {
        gameEngine.clearProgram();
      },
      runProgram: () => {
        const snapshot = gameEngine.run();

        if (snapshot.status === 'success' && snapshot.puzzle) {
          const { sessionMode, completedPuzzleIds, completedAssignmentPuzzleIds } = get();

          if (sessionMode === 'official') {
            const nextCompletedPuzzleIds = completedPuzzleIds.includes(snapshot.puzzle.id)
              ? completedPuzzleIds
              : [...completedPuzzleIds, snapshot.puzzle.id];

            set({
              completedPuzzleIds: nextCompletedPuzzleIds,
              unlockedPuzzleIds: getOfficialUnlockedPuzzleIds(nextCompletedPuzzleIds),
              latestCompletedPuzzleId: snapshot.puzzle.id,
            });
          } else {
            const nextCompletedAssignmentPuzzleIds = completedAssignmentPuzzleIds.includes(snapshot.puzzle.id)
              ? completedAssignmentPuzzleIds
              : [...completedAssignmentPuzzleIds, snapshot.puzzle.id];

            set({
              completedAssignmentPuzzleIds: nextCompletedAssignmentPuzzleIds,
              latestCompletedPuzzleId: snapshot.puzzle.id,
            });
          }
        }

        return snapshot;
      },
      resetPuzzle: () => {
        gameEngine.resetPuzzle();
      },
    }),
    {
      name: 'codecat-game',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activePuzzleId: state.activePuzzleId,
        completedPuzzleIds: state.completedPuzzleIds,
        latestCompletedPuzzleId: state.latestCompletedPuzzleId,
      }),
      merge: (persistedState, currentState) => {
        const typedPersistedState = persistedState as Partial<IGameState> | undefined;
        const completedPuzzleIds = typedPersistedState?.completedPuzzleIds ?? currentState.completedPuzzleIds;
        const unlockedPuzzleIds = getOfficialUnlockedPuzzleIds(completedPuzzleIds);
        const activePuzzleId =
          typedPersistedState?.activePuzzleId && unlockedPuzzleIds.includes(typedPersistedState.activePuzzleId)
            ? typedPersistedState.activePuzzleId
            : getNextOpenOfficialPuzzleId(completedPuzzleIds, unlockedPuzzleIds);

        return {
          ...currentState,
          ...typedPersistedState,
          officialPuzzles: starterPuzzles,
          puzzles: starterPuzzles,
          sessionMode: 'official',
          activeAssignmentId: null,
          activePuzzleId,
          completedPuzzleIds,
          completedAssignmentPuzzleIds: [],
          unlockedPuzzleIds,
        };
      },
    },
  ),
);

gameEngine.subscribe((snapshot) => {
  useGameStore.setState({
    ...snapshot,
    activePuzzleId: snapshot.puzzle?.id ?? null,
  });
});
