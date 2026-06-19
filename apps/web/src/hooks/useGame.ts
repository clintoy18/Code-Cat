import { useGameStore } from '@/store/gameStore';

export const useGame = () =>
  useGameStore((state) => ({
    puzzles: state.puzzles,
    activePuzzleId: state.activePuzzleId,
    completedPuzzleIds: state.completedPuzzleIds,
    unlockedPuzzleIds: state.unlockedPuzzleIds,
    latestCompletedPuzzleId: state.latestCompletedPuzzleId,
    puzzle: state.puzzle,
    program: state.program,
    catPosition: state.catPosition,
    visited: state.visited,
    roomState: state.roomState,
    status: state.status,
    log: state.log,
    stepIndex: state.stepIndex,
    didReachDoor: state.didReachDoor,
    loadPuzzle: state.loadPuzzle,
    addBlock: state.addBlock,
    replaceProgram: state.replaceProgram,
    removeBlock: state.removeBlock,
    clearProgram: state.clearProgram,
    runProgram: state.runProgram,
    resetPuzzle: state.resetPuzzle,
  }));
