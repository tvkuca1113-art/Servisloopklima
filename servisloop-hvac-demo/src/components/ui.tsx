'use client';

import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Circle, Clock, Info, Loader2, MinusCircle, X, XCircle } from 'lucide-react';
import { forwardRef, useEffect, useId, useRef } from 'react';

import { cn } from '@/lib/cn';

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

import { buttonClass, type Size, type Variant } from './button-class';

export { buttonClass };

export const Button = forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> & { variant?: Variant; size?: Size; loading?: boolean }
>(function Button({ variant = 'primary', size = 'md', className, loading, children, type = 'button', ...props }, ref) {
  return (
    <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...props}>
      {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
});

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Card, headings                                                      */
/* ------------------------------------------------------------------ */

export function Card({ className, children, ...rest }: React.ComponentProps<'section'>) {
  return (
    <section className={cn('rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]', className)} {...rest}>
      {children}
    </section>
  );
}

export function CardHeader({ title, subtitle, action, id }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; id?: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
      <div className="min-w-0">
        <h2 id={id} className="text-base font-semibold text-ink">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-sm text-ink-2">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, back }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {back ? (
          <Link href={back.href} className="mb-2 inline-flex min-h-9 items-center gap-1 text-sm font-medium text-primary hover:underline">
            ← {back.label}
          </Link>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">{title}</h1>
        {subtitle ? <p className="mt-1 text-[15px] text-ink-2">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

export type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral' | 'demo';

const TONES: Record<Tone, string> = {
  ok: 'bg-ok-soft text-ok border-ok/25',
  warn: 'bg-warn-soft text-warn border-warn/25',
  danger: 'bg-danger-soft text-danger border-danger/25',
  info: 'bg-primary-soft text-primary-hover border-primary/20',
  neutral: 'bg-bg text-ink-2 border-line-2',
  demo: 'bg-demo-soft text-demo border-demo/25',
};

const TONE_ICON: Record<Tone, React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  ok: CheckCircle2,
  warn: Clock,
  danger: AlertTriangle,
  info: Circle,
  neutral: MinusCircle,
  demo: Circle,
};

export function Badge({ tone = 'neutral', children, icon = true, className }: { tone?: Tone; children: React.ReactNode; icon?: boolean; className?: string }) {
  const Icon = TONE_ICON[tone];
  return (
    <span className={cn('inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap', TONES[tone], className)}>
      {icon ? <Icon className="size-3.5 shrink-0" aria-hidden /> : null}
      <span className="truncate">{children}</span>
    </span>
  );
}

export function DemoTag({ children = 'DEMO', className }: { children?: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-md border border-demo/30 bg-demo-soft px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-demo uppercase', className)}>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Form fields                                                         */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  hint,
  error,
  required,
  children,
  htmlFor,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string | null;
  required?: boolean;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
        {label}
        {required ? <span className="text-danger"> *</span> : <span className="font-normal text-ink-3"> (opcionalno)</span>}
      </label>
      {children}
      {hint && !error ? <p id={`${htmlFor}-hint`} className="text-[13px] text-ink-3">{hint}</p> : null}
      {error ? (
        <p id={`${htmlFor}-error`} className="flex items-start gap-1 text-[13px] font-medium text-danger" role="alert">
          <XCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass = (invalid?: boolean) =>
  cn(
    'w-full min-h-11 rounded-[10px] border bg-surface px-3 py-2 text-ink placeholder:text-ink-3 shadow-sm',
    'focus:outline-2 focus:outline-primary focus:outline-offset-0',
    invalid ? 'border-danger' : 'border-line-2',
  );

/* ------------------------------------------------------------------ */
/* Modal (native <dialog>: fokus ostaje u modalu, Esc zatvara)          */
/* ------------------------------------------------------------------ */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const restore = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      restore.current = document.activeElement as HTMLElement | null;
      d.showModal();
    } else if (!open && d.open) {
      d.close();
      restore.current?.focus?.();
    }
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    return () => {
      if (d?.open) d.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        'm-auto max-h-[calc(100dvh-24px)] w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-line bg-surface p-0 text-ink shadow-[var(--shadow-pop)]',
        wide ? 'max-w-2xl' : 'max-w-lg',
      )}
    >
      {open ? (
        <div className="flex max-h-[calc(100dvh-24px)] flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
              {description ? <div id={descId} className="mt-1 text-sm text-ink-2">{description}</div> : null}
            </div>
            <button type="button" onClick={onClose} className="-mr-2 -mt-1 inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-ink-2 hover:bg-ink/5" aria-label="Zatvori">
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer ? <div className="flex flex-col-reverse gap-2 border-t border-line bg-bg px-5 py-3 sm:flex-row sm:justify-end">{footer}</div> : null}
        </div>
      ) : null}
    </dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

export function EmptyState({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {children ? <p className="max-w-sm text-sm text-ink-2">{children}</p> : null}
      {action}
    </div>
  );
}

export function Notice({ tone = 'info', title, children, className }: { tone?: Tone; title?: string; children: React.ReactNode; className?: string }) {
  const Icon = tone === 'ok' ? CheckCircle2 : tone === 'danger' ? AlertTriangle : tone === 'warn' ? AlertTriangle : Info;
  return (
    <div className={cn('flex gap-3 rounded-xl border px-4 py-3 text-sm', TONES[tone], className)} role={tone === 'ok' ? 'status' : undefined}>
      <Icon className="mt-0.5 size-[18px] shrink-0" aria-hidden />
      <div className="min-w-0 text-ink">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={title ? 'mt-0.5 text-ink-2' : ''}>{children}</div>
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-line', className)} aria-hidden />;
}

export function LoadingScreen() {
  return (
    <div className="space-y-4 p-4 sm:p-8" aria-busy="true" aria-label="Učitavanje primjera">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
