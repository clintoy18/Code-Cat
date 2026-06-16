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

gameEngine.loadPuzzle(starterPuzzles[0]);

const initialSnapshot = gameEngine.getSnapshot();
const initialUnlockedPuzzleId = starterPuzzles[0]?.id;

export const useGameStore = create<IGameState>()(
  persist(
    (set, get) => ({
      ...initialSnapshot,
      puzzles: starterPuzzles,
      activePuzzleId: initialSnapshot.puzzle?.id ?? null,
      completedPuzzleIds: [],
      unlockedPuzzleIds: initialUnlockedPuzzleId ? [initialUnlockedPuzzleId] : [],
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
          const currentIndex = starterPuzzles.findIndex((puzzle) => puzzle.id === snapshot.puzzle?.id);
          const nextPuzzleId = currentIndex >= 0 ? starterPuzzles[currentIndex + 1]?.id ?? null : null;
          const { completedPuzzleIds, unlockedPuzzleIds } = get();

          set({
            completedPuzzleIds: completedPuzzleIds.includes(snapshot.puzzle.id)
              ? completedPuzzleIds
              : [...completedPuzzleIds, snapshot.puzzle.id],
            unlockedPuzzleIds: nextPuzzleId
              ? Array.from(new Set([...unlockedPuzzleIds, snapshot.puzzle.id, nextPuzzleId]))
              : Array.from(new Set([...unlockedPuzzleIds, snapshot.puzzle.id])),
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
        completedPuzzleIds: state.completedPuzzleIds,
        unlockedPuzzleIds: state.unlockedPuzzleIds,
        latestCompletedPuzzleId: state.latestCompletedPuzzleId,
      }),
    },
  ),
);

gameEngine.subscribe((snapshot) => {
  useGameStore.setState({
    ...snapshot,
    activePuzzleId: snapshot.puzzle?.id ?? null,
  });
});
