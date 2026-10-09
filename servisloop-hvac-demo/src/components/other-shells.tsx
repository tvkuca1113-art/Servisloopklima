'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, CalendarCheck, ClipboardList, LayoutDashboard } from 'lucide-react';

import { brand } from '@/config/brand';
import { cn } from '@/lib/cn';
import { formatLong } from '@/lib/dates';
import { useDemo } from '@/lib/store';

import { DemoBar, Logo, PerspectiveSwitch } from './chrome';
import { GuidePanel } from './guide';
import { LoadingScreen } from './ui';

/** Serviser: telefon-first prikaz, bez internog sidebara firme. */
export function TechShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const { state, ready } = useDemo();
  const items = [
    { href: '/demo/serviser', label: 'Danas', icon: CalendarCheck, active: pathname === '/demo/serviser' },
    { href: '/demo/serviser/nalozi', label: 'Moji nalozi', icon: ClipboardList, active: pathname.startsWith('/demo/serviser/nalo') },
    { href: '/demo', label: 'Vlasnik', icon: LayoutDashboard, active: false },
  ];
  return (
    <div className="min-h-dvh bg-bg">
      <header className="no-print sticky top-0 z-20 bg-nav text-white">
        <DemoBar dark />
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" aria-label={`${brand.productName} — početna`}>
              <Logo compact />
            </Link>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Serviser · {brand.companyName}</p>
              <p className="truncate text-xs text-nav-muted">{ready ? formatLong(state.anchor) : 'demo'}</p>
            </div>
          </div>
          <PerspectiveSwitch dark className="hidden sm:flex" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 pt-4 pb-32">{ready ? children : <LoadingScreen />}</main>
      <nav className="no-print pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface" aria-label="Navigacija servisera">
        <ul className="mx-auto grid max-w-3xl grid-cols-3">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  aria-current={it.active ? 'page' : undefined}
                  className={cn('flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-xs font-semibold', it.active ? 'text-primary' : 'text-ink-2')}
                >
                  <Icon className="size-5" aria-hidden />
                  {it.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <GuidePanel />
    </div>
  );
}

/** Kupac preko QR-a: demo traka s povratkom, zatim stranica koju kupac vidi. */
export function CustomerShell({ children }: { children: React.ReactNode }) {
  const { ready } = useDemo();
  return (
    <div className="min-h-dvh bg-[#eef1f6]">
      <header className="no-print bg-nav text-white" data-testid="customer-demo-header">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-2 px-3 py-2 sm:px-6">
          <Link href="/" className="flex min-h-11 min-w-0 items-center gap-2 rounded-lg pr-2" aria-label={`${brand.productName} — početna stranica`}>
            <Logo dark compact />
            <span className="hidden truncate text-sm font-semibold sm:inline">{brand.productName}</span>
            <span className="truncate text-sm text-nav-muted">· Prikaz kupca</span>
          </Link>
          <Link href="/demo" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-[10px] border border-white/20 px-3 text-sm font-semibold hover:bg-white/10">
            <ArrowLeft className="size-4" aria-hidden /> Nazad na demo
          </Link>
        </div>
        <DemoBar dark />
      </header>
      <main id="sadrzaj" className="mx-auto w-full max-w-[1200px] px-0 pb-10 sm:px-6 lg:pt-6">
        {ready ? children : <LoadingScreen />}
      </main>
    </div>
  );
}

/** Dokumenti (izvještaj, naljepnica): bez navigacije, štampa samo sadržaj. */
export function DocumentShell({ children }: { children: React.ReactNode }) {
  const { ready } = useDemo();
  return (
    <div className="min-h-dvh bg-[#eef1f6] print:bg-white">
      <DemoBar />
      <main className="mx-auto w-full max-w-[860px] px-3 pt-4 pb-16 sm:px-6 print:p-0">{ready ? children : <LoadingScreen />}</main>
    </div>
  );
}
