import { create } from 'zustand';
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
  loadPuzzle: (puzzleId: string) => void;
  addBlock: (template: IBlockTemplate) => void;
  removeBlock: (blockId: string) => void;
  clearProgram: () => void;
  runProgram: () => IGameEngineSnapshot;
  resetPuzzle: () => void;
}

gameEngine.loadPuzzle(starterPuzzles[0]);

const initialSnapshot = gameEngine.getSnapshot();

export const useGameStore = create<IGameState>(() => ({
  ...initialSnapshot,
  puzzles: starterPuzzles,
  activePuzzleId: initialSnapshot.puzzle?.id ?? null,
  loadPuzzle: (puzzleId) => {
    const nextPuzzle = starterPuzzles.find((puzzle) => puzzle.id === puzzleId);

    if (nextPuzzle) {
      gameEngine.loadPuzzle(nextPuzzle);
    }
  },
  addBlock: (template) => {
    gameEngine.appendBlock(template);
  },
  removeBlock: (blockId) => {
    gameEngine.removeBlock(blockId);
  },
  clearProgram: () => {
    gameEngine.clearProgram();
  },
  runProgram: () => {
    return gameEngine.run();
  },
  resetPuzzle: () => {
    gameEngine.resetPuzzle();
  },
}));

gameEngine.subscribe((snapshot) => {
  useGameStore.setState({
    ...snapshot,
    activePuzzleId: snapshot.puzzle?.id ?? null,
  });
});
