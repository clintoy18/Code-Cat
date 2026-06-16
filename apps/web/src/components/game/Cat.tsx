import catSprite from '@/assets/cat-sprite.png';
import type { IPosition } from '@/features/game/engine';

interface ICatProps {
  position: IPosition | null;
  status?: string;
}

export const Cat = ({ position, status = 'ready' }: ICatProps) => (
  <div className="arcade-panel flex items-center gap-4 rounded-[24px] px-4 py-3">
    <div className="cat-avatar" aria-hidden="true">
      <img className="cat-avatar__sprite" src={catSprite} alt="" />
    </div>
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-700">Maze Scout</p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
        {position ? `Tile ${position.row + 1}-${position.col + 1}` : 'Awaiting spawn'}
      </p>
      <p className="text-xs text-slate-600">State: {status}</p>
    </div>
  </div>
);
