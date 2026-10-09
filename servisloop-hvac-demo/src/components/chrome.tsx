'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { useState } from 'react';

import { brand } from '@/config/brand';
import { cn } from '@/lib/cn';
import { GUIDE_DEVICE_ID } from '@/lib/demo-data';
import { useDemo } from '@/lib/store';

import { useToast } from './toast';
import { Button, Modal } from './ui';

export function Logo({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold text-white"
        style={{ background: brand.colors.primary }}
        aria-hidden
      >
        {brand.logoInitials}
      </span>
      {compact ? null : (
        <span className={cn('text-[15px] font-bold tracking-tight', dark ? 'text-white' : 'text-ink')}>{brand.productName}</span>
      )}
    </span>
  );
}

/** Stalna, diskretna oznaka da je riječ o pokaznom primjeru. */
export function DemoBar({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={cn(
        'no-print flex items-center gap-2 px-4 py-1.5 text-[13px] leading-snug',
        dark ? 'bg-nav-2 text-nav-ink' : 'border-b border-demo/15 bg-demo-soft text-ink',
      )}
      data-testid="demo-bar"
    >
      <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold tracking-wide', dark ? 'bg-white text-demo' : 'bg-demo text-white')}>
        DEMO PROTOTIP
      </span>
      <span className="min-w-0">Podaci su izmišljeni. Zahtjevi, termini i poruke su simulacija.</span>
    </div>
  );
}

export type Perspective = 'vlasnik' | 'serviser' | 'kupac';

export function perspectiveOf(pathname: string): Perspective {
  if (pathname.startsWith('/demo/serviser')) return 'serviser';
  if (pathname.startsWith('/demo/kupac')) return 'kupac';
  return 'vlasnik';
}

export function PerspectiveSwitch({ dark = false, className }: { dark?: boolean; className?: string }) {
  const pathname = usePathname() ?? '';
  const current = perspectiveOf(pathname);
  const items: { id: Perspective; label: string; href: string }[] = [
    { id: 'vlasnik', label: 'Vlasnik', href: '/demo' },
    { id: 'serviser', label: 'Serviser', href: '/demo/serviser' },
    { id: 'kupac', label: 'Kupac', href: `/demo/kupac/${GUIDE_DEVICE_ID}` },
  ];
  return (
    <nav aria-label="Demo perspektiva" className={cn('flex items-center gap-2', className)}>
      <span className={cn('hidden text-xs font-medium xl:inline', dark ? 'text-nav-muted' : 'text-ink-3')}>Prikaz kao:</span>
      <div className={cn('inline-flex rounded-[10px] border p-0.5', dark ? 'border-white/15 bg-white/5' : 'border-line-2 bg-bg')}>
        {items.map((it) => {
          const active = it.id === current;
          return (
            <Link
              key={it.id}
              href={it.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-semibold transition-colors',
                active
                  ? dark
                    ? 'bg-white text-nav'
                    : 'bg-surface text-ink shadow-sm'
                  : dark
                    ? 'text-nav-ink hover:bg-white/10'
                    : 'text-ink-2 hover:text-ink',
              )}
            >
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function ResetButton({ className, variant = 'secondary', label = 'Vrati početni primjer' }: { className?: string; variant?: 'secondary' | 'ghost' | 'dark'; label?: string }) {
  const { reset } = useDemo();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size="sm" className={className} onClick={() => setOpen(true)}>
        <RotateCcw aria-hidden /> {label}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Vratiti početni primjer?"
        description="Sve promjene napravljene u ovoj probi (zahtjevi, dodjele, završeni nalozi, dodani uređaji) biće uklonjene."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Odustani
            </Button>
            <Button
              onClick={() => {
                reset();
                setOpen(false);
                toast({ title: 'Početni primjer je vraćen.', body: 'Datumi su ponovo računati od današnjeg dana.' });
              }}
            >
              Vrati početni primjer
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-2">Demo se ne čuva trajno. Početni primjer se vraća i kada zatvorite ovaj tab.</p>
      </Modal>
    </>
  );
}
