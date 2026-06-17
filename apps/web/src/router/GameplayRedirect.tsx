import { Navigate } from 'react-router-dom';
import { useGame } from '@/hooks/useGame';

export const GameplayRedirect = () => {
  const { puzzles, activePuzzleId, unlockedPuzzleIds, completedPuzzleIds } = useGame();

  const targetPuzzleId =
    (activePuzzleId && unlockedPuzzleIds.includes(activePuzzleId) ? activePuzzleId : null) ??
    puzzles.find((puzzle) => unlockedPuzzleIds.includes(puzzle.id) && !completedPuzzleIds.includes(puzzle.id))?.id ??
    puzzles.find((puzzle) => unlockedPuzzleIds.includes(puzzle.id))?.id ??
    puzzles[0]?.id;

  if (!targetPuzzleId) {
    return <Navigate to="/levels" replace />;
  }

  return <Navigate to={`/gameplay/${targetPuzzleId}`} replace />;
};
