import catSprite from '@/assets/cat-sprite.png';
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
        <p className="game-stage__caption">
          {puzzle.rows} x {puzzle.cols} board
        </p>
      </div>
      <div className="game-stage__chips">
        <span className="game-chip">Goal: Door</span>
        <span className={`game-chip ${status === 'success' ? 'game-chip--success' : ''}`}>
          Status: {status}
        </span>
      </div>
    </div>
    <div
      className="game-board"
      style={{
        ['--board-cols' as '--board-cols']: String(puzzle.cols),
        ['--board-rows' as '--board-rows']: String(puzzle.rows),
        gridTemplateColumns: `repeat(${puzzle.cols}, var(--tile-size))`,
        gridAutoRows: 'var(--tile-size)',
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
            className={`board-tile ${isWall ? 'board-tile--wall' : ''} ${isDoor ? 'board-tile--door' : ''} ${isCat ? 'board-tile--cat' : ''} ${wasVisited ? 'board-tile--visited' : ''}`}
            aria-label={`row ${row + 1} column ${col + 1}${isWall ? ' wall' : ''}${isDoor ? ' door' : ''}${isCat ? ' cat' : ''}`}
          >
            <div className="board-tile__snow" />
            {isDoor ? <span className="board-tile__marker">Exit</span> : null}
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
              <img className="board-cat" src={catSprite} alt="" aria-hidden="true" />
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
