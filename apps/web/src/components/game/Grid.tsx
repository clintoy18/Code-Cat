import type { IPosition, IPuzzleDefinition } from '@/features/game/engine';

interface IGridProps {
  puzzle: IPuzzleDefinition;
  catPosition: IPosition | null;
  visited: IPosition[];
  status?: string;
}

const isMatch = (left: IPosition, right: IPosition) => left.row === right.row && left.col === right.col;

export const Grid = ({ puzzle, catPosition, visited, status = 'ready' }: IGridProps) => (
  <div className="game-stage">
    <div className="game-stage__hud">
      <div>
        <p className="game-stage__eyebrow">Snowfield Map</p>
        <h2 className="game-stage__title">{puzzle.title}</h2>
      </div>
      <div className="game-stage__chips">
        <span className="game-chip">Goal: Door</span>
        <span className="game-chip">Lesson: {puzzle.lesson}</span>
        <span className={`game-chip ${status === 'success' ? 'game-chip--success' : ''}`}>
          Status: {status}
        </span>
      </div>
    </div>
    <div
      className="game-board"
      style={{
        gridTemplateColumns: `repeat(${puzzle.cols}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: puzzle.rows * puzzle.cols }).map((_, index) => {
        const row = Math.floor(index / puzzle.cols);
        const col = index % puzzle.cols;
        const cell = { row, col };
        const isWall = puzzle.walls.some((wall) => isMatch(wall, cell));
        const isDoor = isMatch(puzzle.door, cell);
        const isCat = catPosition ? isMatch(catPosition, cell) : false;
        const wasVisited = visited.some((step) => isMatch(step, cell));

        return (
          <div
            key={`${row}-${col}`}
            className={`board-tile ${isWall ? 'board-tile--wall' : ''} ${isDoor ? 'board-tile--door' : ''} ${wasVisited ? 'board-tile--visited' : ''}`}
            aria-label={`row ${row + 1} column ${col + 1}${isWall ? ' wall' : ''}${isDoor ? ' door' : ''}${isCat ? ' cat' : ''}`}
          >
            <div className="board-tile__snow" />
            {wasVisited && !isWall && !isDoor ? (
              <div className="board-track" aria-hidden="true">
                <span />
                <span />
              </div>
            ) : null}
            {isWall ? (
              <div className="ice-block" aria-hidden="true">
                <span className="ice-block__shine" />
              </div>
            ) : null}
            {isDoor ? (
              <div className="goal-door" aria-hidden="true">
                <span className="goal-door__arch" />
                <span className="goal-door__light" />
              </div>
            ) : null}
            {isCat ? (
              <div className="board-cat" aria-hidden="true">
                <span className="board-cat__ear board-cat__ear--left" />
                <span className="board-cat__ear board-cat__ear--right" />
                <span className="board-cat__face">
                  <span className="board-cat__eye" />
                  <span className="board-cat__eye" />
                </span>
                <span className="board-cat__tail" />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
    <div className="game-stage__legend">
      <span><i className="legend-dot legend-dot--cat" /> Scout cat</span>
      <span><i className="legend-dot legend-dot--door" /> Exit door</span>
      <span><i className="legend-dot legend-dot--wall" /> Ice wall</span>
      <span><i className="legend-dot legend-dot--trail" /> Travel path</span>
    </div>
  </div>
);
