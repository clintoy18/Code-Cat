import type { ReactNode } from 'react';

interface IEmptyStateProps {
  title?: string;
  description: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({
  title = 'Nothing to show yet',
  description,
  eyebrow,
  action,
  className = '',
}: IEmptyStateProps) => (
  <div
    className={`rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-5 ${className}`.trim()}
  >
    {eyebrow ? (
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-2)]">
        {eyebrow}
      </p>
    ) : null}
    <h3 className="mt-2 font-display text-xl font-bold text-[var(--text-0)]">
      {title}
    </h3>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-1)]">
      {description}
    </p>
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);
