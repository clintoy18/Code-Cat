import { useEffect, useMemo, useState } from 'react';
import type { PointerEvent } from 'react';
import type { IPosition } from '@shared/types/teacher';

export interface IRoomLayoutDraft {
  rows: number;
  cols: number;
  start: IPosition;
  door: IPosition;
  key: IPosition | null;
  walls: IPosition[];
  doorRequiresKey: boolean;
}

type RoomLayoutTool = 'start' | 'door' | 'key' | 'wall' | 'erase';

const ROOM_LAYOUT_TOOLS: Array<{
  id: RoomLayoutTool;
  label: string;
  helper: string;
}> = [
  {
    id: 'wall',
    label: 'Paint Walls',
    helper: 'Drag across the board to add blocking tiles.',
  },
  {
    id: 'erase',
    label: 'Erase',
    helper: 'Drag to clear walls or remove the optional key tile.',
  },
  {
    id: 'start',
    label: 'Place Start',
    helper: 'Move the cat start tile to a new position.',
  },
  {
    id: 'door',
    label: 'Place Door',
    helper: 'Set the exit tile that ends the room.',
  },
  {
    id: 'key',
    label: 'Place Key',
    helper: 'Drop an optional key tile for locked-door routes.',
  },
];

const MIN_BOARD_SIZE = 2;

const isSamePosition = (left: IPosition, right: IPosition) =>
  left.row === right.row && left.col === right.col;

const positionKey = (position: IPosition) => `${position.row}:${position.col}`;

const clampBoardSize = (value: number) =>
  Math.max(MIN_BOARD_SIZE, Number.isFinite(value) ? value : MIN_BOARD_SIZE);

const clampPosition = (
  position: IPosition,
  rows: number,
  cols: number,
): IPosition => ({
  row: Math.min(Math.max(position.row, 0), rows - 1),
  col: Math.min(Math.max(position.col, 0), cols - 1),
});

const findFirstAvailablePosition = (
  rows: number,
  cols: number,
  blocked: Set<string>,
  preferred: IPosition,
) => {
  if (!blocked.has(positionKey(preferred))) {
    return preferred;
  }

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const candidate = { row, col };

      if (!blocked.has(positionKey(candidate))) {
        return candidate;
      }
    }
  }

  return preferred;
};

const normalizeLayoutDraft = (draft: IRoomLayoutDraft): IRoomLayoutDraft => {
  const rows = clampBoardSize(draft.rows);
  const cols = clampBoardSize(draft.cols);
  const start = clampPosition(draft.start, rows, cols);
  let door = clampPosition(draft.door, rows, cols);

  if (isSamePosition(start, door)) {
    door = findFirstAvailablePosition(
      rows,
      cols,
      new Set([positionKey(start)]),
      { row: 0, col: cols - 1 },
    );
  }

  let key =
    draft.key === null ? null : clampPosition(draft.key, rows, cols);

  if (key && (isSamePosition(key, start) || isSamePosition(key, door))) {
    key = null;
  }

  const blockedTiles = new Set<string>([
    positionKey(start),
    positionKey(door),
    ...(key ? [positionKey(key)] : []),
  ]);
  const wallMap = new Map<string, IPosition>();

  draft.walls.forEach((wall) => {
    const clampedWall = clampPosition(wall, rows, cols);
    const keyForWall = positionKey(clampedWall);

    if (!blockedTiles.has(keyForWall)) {
      wallMap.set(keyForWall, clampedWall);
    }
  });

  return {
    rows,
    cols,
    start,
    door,
    key,
    walls: Array.from(wallMap.values()),
    doorRequiresKey: draft.doorRequiresKey,
  };
};

const describeCell = (
  cell: IPosition,
  draft: IRoomLayoutDraft,
  wallKeys: Set<string>,
) => {
  if (isSamePosition(draft.start, cell)) {
    return 'start tile';
  }

  if (isSamePosition(draft.door, cell)) {
    return draft.doorRequiresKey ? 'locked door tile' : 'door tile';
  }

  if (draft.key && isSamePosition(draft.key, cell)) {
    return 'key tile';
  }

  if (wallKeys.has(positionKey(cell))) {
    return 'wall tile';
  }

  return 'empty tile';
};

interface IRoomLayoutEditorProps {
  value: IRoomLayoutDraft;
  disabled?: boolean;
  onChange: (value: IRoomLayoutDraft) => void;
}

export const RoomLayoutEditor = ({
  value,
  disabled = false,
  onChange,
}: IRoomLayoutEditorProps) => {
  const normalizedValue = useMemo(() => normalizeLayoutDraft(value), [value]);
  const [activeTool, setActiveTool] = useState<RoomLayoutTool>('wall');
  const [isPainting, setIsPainting] = useState(false);
  const wallKeys = useMemo(
    () => new Set(normalizedValue.walls.map(positionKey)),
    [normalizedValue.walls],
  );

  useEffect(() => {
    const handlePointerUp = () => {
      setIsPainting(false);
    };

    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const applyDraft = (nextDraft: IRoomLayoutDraft) => {
    onChange(normalizeLayoutDraft(nextDraft));
  };

  const updateBoardSize = (
    field: 'rows' | 'cols',
    nextValue: number,
  ) => {
    applyDraft({
      ...normalizedValue,
      [field]: clampBoardSize(nextValue),
    });
  };

  const applyToolToCell = (cell: IPosition) => {
    const isStart = isSamePosition(normalizedValue.start, cell);
    const isDoor = isSamePosition(normalizedValue.door, cell);
    const isKey = normalizedValue.key
      ? isSamePosition(normalizedValue.key, cell)
      : false;
    const nextWalls = normalizedValue.walls.filter(
      (wall) => !isSamePosition(wall, cell),
    );

    switch (activeTool) {
      case 'start':
        if (isDoor) {
          return;
        }

        applyDraft({
          ...normalizedValue,
          start: cell,
          key: isKey ? null : normalizedValue.key,
          walls: nextWalls,
        });
        break;
      case 'door':
        if (isStart) {
          return;
        }

        applyDraft({
          ...normalizedValue,
          door: cell,
          key: isKey ? null : normalizedValue.key,
          walls: nextWalls,
        });
        break;
      case 'key':
        if (isStart || isDoor) {
          return;
        }

        applyDraft({
          ...normalizedValue,
          key: cell,
          walls: nextWalls,
        });
        break;
      case 'wall':
        if (isStart || isDoor || isKey || wallKeys.has(positionKey(cell))) {
          return;
        }

        applyDraft({
          ...normalizedValue,
          walls: [...normalizedValue.walls, cell],
        });
        break;
      case 'erase':
        applyDraft({
          ...normalizedValue,
          key: isKey ? null : normalizedValue.key,
          walls: nextWalls,
        });
        break;
      default:
        break;
    }
  };

  const handleTilePointerDown =
    (cell: IPosition) => (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();

      if (disabled) {
        return;
      }

      if (activeTool === 'wall' || activeTool === 'erase') {
        setIsPainting(true);
      }

      applyToolToCell(cell);
    };

  const handleTilePointerEnter = (cell: IPosition) => {
    if (
      disabled ||
      !isPainting ||
      (activeTool !== 'wall' && activeTool !== 'erase')
    ) {
      return;
    }

    applyToolToCell(cell);
  };

  const activeToolMeta =
    ROOM_LAYOUT_TOOLS.find((tool) => tool.id === activeTool) ??
    ROOM_LAYOUT_TOOLS[0];
  const cells = Array.from({
    length: normalizedValue.rows * normalizedValue.cols,
  }).map((_, index) => ({
    row: Math.floor(index / normalizedValue.cols),
    col: index % normalizedValue.cols,
  }));

  return (
    <section className="teacher-layoutEditor">
      <div className="teacher-layoutEditor__sidebar">
        <div className="teacher-layoutEditor__group">
          <div>
            <p className="teacher-kicker text-sm uppercase tracking-[0.28em]">
              Layout Editor
            </p>
            <h3 className="mt-2 font-display text-2xl font-bold">
              Build the room on the board
            </h3>
            <p className="teacher-copy mt-3 text-sm">
              Paint walls directly on the grid, then place the start, exit, and
              optional key without translating everything into coordinates.
            </p>
          </div>
        </div>

        <div className="teacher-layoutEditor__group">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="teacher-label text-sm font-semibold">Rows</span>
              <input
                type="number"
                min={MIN_BOARD_SIZE}
                value={normalizedValue.rows}
                onChange={(event) =>
                  updateBoardSize('rows', Number(event.target.value))
                }
                className="teacher-field mt-2"
                disabled={disabled}
              />
            </label>
            <label className="block">
              <span className="teacher-label text-sm font-semibold">
                Columns
              </span>
              <input
                type="number"
                min={MIN_BOARD_SIZE}
                value={normalizedValue.cols}
                onChange={(event) =>
                  updateBoardSize('cols', Number(event.target.value))
                }
                className="teacher-field mt-2"
                disabled={disabled}
              />
            </label>
          </div>
          <label className="teacher-surface teacher-copy mt-4 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={normalizedValue.doorRequiresKey}
              onChange={(event) =>
                applyDraft({
                  ...normalizedValue,
                  doorRequiresKey: event.target.checked,
                })
              }
              disabled={disabled}
            />
            Require key before entering the door
          </label>
        </div>

        <div className="teacher-layoutEditor__group">
          <p className="teacher-label text-sm font-semibold">Placement tools</p>
          <div className="mt-3 grid gap-2">
            {ROOM_LAYOUT_TOOLS.map((tool) => (
              <button
                key={tool.id}
                type="button"
                className={`teacher-layoutEditor__tool ${activeTool === tool.id ? 'teacher-layoutEditor__tool--active' : ''}`}
                onClick={() => setActiveTool(tool.id)}
                aria-pressed={activeTool === tool.id}
                disabled={disabled}
              >
                <span className="teacher-layoutEditor__toolLabel">
                  {tool.label}
                </span>
                <span className="teacher-layoutEditor__toolHelper">
                  {tool.helper}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="teacher-button-secondary"
              onClick={() =>
                applyDraft({
                  ...normalizedValue,
                  key: null,
                })
              }
              disabled={disabled || normalizedValue.key === null}
            >
              Remove key
            </button>
            <button
              type="button"
              className="teacher-button-secondary"
              onClick={() =>
                applyDraft({
                  ...normalizedValue,
                  walls: [],
                })
              }
              disabled={disabled || !normalizedValue.walls.length}
            >
              Clear walls
            </button>
          </div>
        </div>

        <div className="teacher-layoutEditor__group">
          <p className="teacher-label text-sm font-semibold">Board summary</p>
          <div className="teacher-layoutEditor__stats mt-3">
            <div className="teacher-layoutEditor__stat">
              <span className="teacher-layoutEditor__statLabel">Start</span>
              <span>{`${normalizedValue.start.row + 1}, ${normalizedValue.start.col + 1}`}</span>
            </div>
            <div className="teacher-layoutEditor__stat">
              <span className="teacher-layoutEditor__statLabel">Door</span>
              <span>{`${normalizedValue.door.row + 1}, ${normalizedValue.door.col + 1}`}</span>
            </div>
            <div className="teacher-layoutEditor__stat">
              <span className="teacher-layoutEditor__statLabel">Key</span>
              <span>
                {normalizedValue.key
                  ? `${normalizedValue.key.row + 1}, ${normalizedValue.key.col + 1}`
                  : 'None'}
              </span>
            </div>
            <div className="teacher-layoutEditor__stat">
              <span className="teacher-layoutEditor__statLabel">Walls</span>
              <span>{normalizedValue.walls.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="teacher-layoutEditor__boardPane">
        <div className="teacher-layoutEditor__boardHeader">
          <div>
            <p className="teacher-kicker text-sm uppercase tracking-[0.28em]">
              Active Tool
            </p>
            <h3 className="mt-2 font-display text-2xl font-bold">
              {activeToolMeta.label}
            </h3>
            <p className="teacher-copy mt-3 text-sm">
              {activeToolMeta.helper}
            </p>
          </div>
          <span className="teacher-chip">
            {normalizedValue.rows} x {normalizedValue.cols}
          </span>
        </div>

        <div className="teacher-layoutEditor__boardFrame">
          <div
            className="teacher-layoutEditor__board"
            style={{
              gridTemplateColumns: `repeat(${normalizedValue.cols}, minmax(0, 1fr))`,
            }}
          >
            {cells.map((cell) => {
              const isStart = isSamePosition(normalizedValue.start, cell);
              const isDoor = isSamePosition(normalizedValue.door, cell);
              const isKey = normalizedValue.key
                ? isSamePosition(normalizedValue.key, cell)
                : false;
              const isWall = wallKeys.has(positionKey(cell));

              return (
                <button
                  key={positionKey(cell)}
                  type="button"
                  className={`teacher-layoutEditor__tile ${isStart ? 'teacher-layoutEditor__tile--start' : ''} ${isDoor ? 'teacher-layoutEditor__tile--door' : ''} ${isKey ? 'teacher-layoutEditor__tile--key' : ''} ${isWall ? 'teacher-layoutEditor__tile--wall' : ''}`}
                  aria-label={`row ${cell.row + 1} column ${cell.col + 1} ${describeCell(cell, normalizedValue, wallKeys)}`}
                  onPointerDown={handleTilePointerDown(cell)}
                  onPointerEnter={() => handleTilePointerEnter(cell)}
                  onClick={() => applyToolToCell(cell)}
                  disabled={disabled}
                >
                  <span className="teacher-layoutEditor__tileCoord">
                    {cell.row + 1},{cell.col + 1}
                  </span>
                  {isStart ? (
                    <span className="teacher-layoutEditor__tileGlyph">S</span>
                  ) : null}
                  {isDoor ? (
                    <span className="teacher-layoutEditor__tileGlyph">
                      {normalizedValue.doorRequiresKey ? 'LD' : 'D'}
                    </span>
                  ) : null}
                  {isKey ? (
                    <span className="teacher-layoutEditor__tileGlyph">K</span>
                  ) : null}
                  {isWall ? (
                    <span className="teacher-layoutEditor__tileGlyph">W</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="teacher-layoutEditor__legend">
          <span>Drag with Wall or Erase to paint across multiple tiles.</span>
          <span>Start and Door stay unique. Key is optional.</span>
        </div>
      </div>
    </section>
  );
};
