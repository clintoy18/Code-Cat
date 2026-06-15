import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-500 text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600 focus-visible:outline-brand-500',
  secondary:
    'bg-[var(--color-mint)] text-[var(--color-ink)] hover:bg-[#82c8ae] focus-visible:outline-[var(--color-mint)]',
  ghost:
    'bg-transparent text-[var(--color-ink)] ring-1 ring-[var(--color-line)] hover:bg-white/60 focus-visible:outline-[var(--color-ink)]',
  danger:
    'bg-[var(--color-coral)] text-white hover:bg-[#e17057] focus-visible:outline-[var(--color-coral)]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
};

export const Button = ({
  children,
  className = '',
  isLoading = false,
  size = 'md',
  variant = 'primary',
  disabled,
  ...props
}: PropsWithChildren<IButtonProps>) => (
  <button
    type="button"
    className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    disabled={disabled || isLoading}
    {...props}
  >
    {isLoading ? 'Loading...' : children}
  </button>
);
