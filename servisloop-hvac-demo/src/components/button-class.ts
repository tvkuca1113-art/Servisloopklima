import { cn } from '@/lib/cn';

export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
export type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm',
  secondary: 'bg-surface text-ink border border-line-2 hover:bg-bg shadow-sm',
  ghost: 'text-ink hover:bg-ink/5',
  danger: 'bg-surface text-danger border border-line-2 hover:bg-danger-soft',
  dark: 'bg-nav text-white hover:bg-nav-2',
};

const SIZES: Record<Size, string> = {
  sm: 'min-h-9 px-3 text-sm gap-1.5',
  md: 'min-h-11 px-4 text-[15px] gap-2',
  lg: 'min-h-12 px-5 text-base gap-2',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra?: string) {
  return cn(
    'inline-flex items-center justify-center rounded-[10px] font-semibold leading-tight transition-colors text-center',
    'disabled:opacity-50 disabled:pointer-events-none [&_svg]:size-[18px] [&_svg]:shrink-0',
    VARIANTS[variant],
    SIZES[size],
    extra,
  );
}

