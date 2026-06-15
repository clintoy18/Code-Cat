import { useGameStore } from '@/store/gameStore';

export const useGame = () =>
  useGameStore((state) => ({
    puzzles: state.puzzles,
    activePuzzleId: state.activePuzzleId,
    puzzle: state.puzzle,
    program: state.program,
    catPosition: state.catPosition,
    visited: state.visited,
    status: state.status,
    log: state.log,
    stepIndex: state.stepIndex,
    didReachDoor: state.didReachDoor,
    loadPuzzle: state.loadPuzzle,
    addBlock: state.addBlock,
    removeBlock: state.removeBlock,
    clearProgram: state.clearProgram,
    runProgram: state.runProgram,
    resetPuzzle: state.resetPuzzle,
  }));
