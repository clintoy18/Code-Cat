import type { IProgramBlock } from '@/features/game/engine';

interface ICodeBlockProps {
  block: IProgramBlock;
  index?: number;
  onRemove?: (blockId: string) => void;
}

export const CodeBlock = ({ block, index = 0, onRemove }: ICodeBlockProps) => (
  <div className="command-card flex items-center justify-between gap-3 rounded-[24px] px-4 py-3">
    <div className="flex items-center gap-3">
      <div className="command-card__index">{index + 1}</div>
      <div>
        <span className="text-sm font-semibold text-[var(--color-ink)]">{block.label}</span>
        <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-brand-700">{block.kind}</p>
      </div>
    </div>
    {onRemove ? (
      <button
        type="button"
        onClick={() => onRemove(block.id)}
        className="command-card__remove"
      >
        Remove
      </button>
    ) : null}
  </div>
);
