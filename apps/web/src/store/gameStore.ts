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
  puzzles: IPuzzleDefinition[];
  activePuzzleId: string | null;
  completedPuzzleIds: string[];
  unlockedPuzzleIds: string[];
  latestCompletedPuzzleId: string | null;
  loadPuzzle: (puzzleId: string) => void;
  addBlock: (template: IBlockTemplate) => void;
  replaceProgram: (templates: IBlockTemplate[]) => void;
  removeBlock: (blockId: string) => void;
  clearProgram: () => void;
  runProgram: () => IGameEngineSnapshot;
  resetPuzzle: () => void;
}

const getUnlockedPuzzleIds = (completedPuzzleIds: string[]) => {
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

const getNextOpenPuzzleId = (completedPuzzleIds: string[], unlockedPuzzleIds: string[]) =>
  starterPuzzles.find((puzzle) => unlockedPuzzleIds.includes(puzzle.id) && !completedPuzzleIds.includes(puzzle.id))?.id ??
  starterPuzzles.find((puzzle) => unlockedPuzzleIds.includes(puzzle.id))?.id ??
  starterPuzzles[0]?.id ??
  null;

gameEngine.loadPuzzle(starterPuzzles[0]);

const initialSnapshot = gameEngine.getSnapshot();
const initialUnlockedPuzzleIds = getUnlockedPuzzleIds([]);

export const useGameStore = create<IGameState>()(
  persist(
    (set, get) => ({
      ...initialSnapshot,
      puzzles: starterPuzzles,
      activePuzzleId: initialSnapshot.puzzle?.id ?? null,
      completedPuzzleIds: [],
      unlockedPuzzleIds: initialUnlockedPuzzleIds,
      latestCompletedPuzzleId: null,
      loadPuzzle: (puzzleId) => {
        const nextPuzzle = starterPuzzles.find((puzzle) => puzzle.id === puzzleId);
        const { unlockedPuzzleIds } = get();

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
          const { completedPuzzleIds } = get();
          const nextCompletedPuzzleIds = completedPuzzleIds.includes(snapshot.puzzle.id)
            ? completedPuzzleIds
            : [...completedPuzzleIds, snapshot.puzzle.id];

          set({
            completedPuzzleIds: nextCompletedPuzzleIds,
            unlockedPuzzleIds: getUnlockedPuzzleIds(nextCompletedPuzzleIds),
            latestCompletedPuzzleId: snapshot.puzzle.id,
          });
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
        const unlockedPuzzleIds = getUnlockedPuzzleIds(completedPuzzleIds);
        const activePuzzleId =
          typedPersistedState?.activePuzzleId && unlockedPuzzleIds.includes(typedPersistedState.activePuzzleId)
            ? typedPersistedState.activePuzzleId
            : getNextOpenPuzzleId(completedPuzzleIds, unlockedPuzzleIds);

        return {
          ...currentState,
          ...typedPersistedState,
          activePuzzleId,
          completedPuzzleIds,
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
