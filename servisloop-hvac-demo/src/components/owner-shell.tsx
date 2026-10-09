'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  ClipboardList,
  FileText,
  Inbox,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  QrCode,
  Smartphone,
  Thermometer,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { brand } from '@/config/brand';
import { cn } from '@/lib/cn';
import { formatLong } from '@/lib/dates';
import { GUIDE_DEVICE_ID } from '@/lib/demo-data';
import { useDemo } from '@/lib/store';

import { DemoBar, Logo, PerspectiveSwitch, ResetButton } from './chrome';
import { GuidePanel, ShowGuideButton } from './guide';
import { LoadingScreen, Modal } from './ui';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match: (p: string) => boolean;
  count?: number;
}

function useNav(): NavItem[] {
  const { state } = useDemo();
  const pending = state.requests.filter((r) => r.status === 'na_cekanju').length;
  return [
    { href: '/demo', label: 'Pregled', icon: LayoutDashboard, match: (p) => p === '/demo' },
    { href: '/demo/uredaji', label: 'Uređaji', icon: Thermometer, match: (p) => p.startsWith('/demo/uredaji') },
    { href: '/demo/raspored', label: 'Raspored', icon: CalendarDays, match: (p) => p.startsWith('/demo/raspored') },
    { href: '/demo/zahtjevi', label: 'Zahtjevi', icon: Inbox, match: (p) => p.startsWith('/demo/zahtjevi'), count: pending },
    { href: '/demo/nalozi', label: 'Radni nalozi', icon: ClipboardList, match: (p) => p.startsWith('/demo/nalozi') },
    { href: '/demo/izvjestaji', label: 'Izvještaji', icon: FileText, match: (p) => p.startsWith('/demo/izvjestaji') },
    { href: '/demo/poruke', label: 'Primjeri poruka', icon: MessageSquareText, match: (p) => p.startsWith('/demo/poruke') },
  ];
}

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] font-medium transition-colors',
        active ? 'bg-white/10 text-white' : 'text-nav-ink hover:bg-white/5 hover:text-white',
      )}
    >
      <Icon className="size-[18px] shrink-0" aria-hidden />
      <span className="flex-1">{item.label}</span>
      {item.count ? (
        <span className="rounded-full bg-[#fdb022] px-2 py-0.5 text-xs font-bold text-nav" aria-label={`${item.count} na čekanju`}>
          {item.count}
        </span>
      ) : null}
    </Link>
  );
}

export function OwnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const { state, ready } = useDemo();
  const nav = useNav();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => setMoreOpen(false), [pathname]);

  const bottom = [nav[0]!, nav[1]!, nav[4]!];
  const moreActive = !bottom.some((b) => b.match(pathname));

  return (
    <div className="min-h-dvh lg:pl-[232px]">
      {/* Sidebar (desktop) */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col bg-nav lg:flex" aria-label="Glavna navigacija">
        <div className="px-4 pt-5 pb-4">
          <Link href="/" className="inline-flex rounded-lg" aria-label={`${brand.productName} — početna`}>
            <Logo dark />
          </Link>
          <p className="mt-3 text-[13px] leading-snug text-nav-muted">
            {brand.companyName}
            <br />
            <span className="text-[#bdb4fe]">demo firma</span>
          </p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label="Vlasnički pregled">
          {nav.map((item) => (
            <NavLink key={item.href} item={item} active={item.match(pathname)} />
          ))}
          <p className="px-3 pt-5 pb-1 text-[11px] font-bold tracking-wide text-nav-muted uppercase">Druge perspektive</p>
          <NavLink item={{ href: '/demo/serviser', label: 'Serviser (telefon)', icon: Smartphone, match: () => false }} active={false} />
          <NavLink item={{ href: `/demo/kupac/${GUIDE_DEVICE_ID}`, label: 'Kupac (QR kartica)', icon: QrCode, match: () => false }} active={false} />
        </nav>
        <div className="space-y-2 border-t border-white/10 p-3">
          <ResetButton variant="dark" className="w-full justify-start border border-white/15" />
          <p className="px-1 text-xs text-nav-muted">Primjer se ne čuva trajno.</p>
        </div>
      </aside>

      {/* Header */}
      <header className="no-print sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
        <DemoBar />
        <div className="flex min-h-14 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="lg:hidden" aria-label={`${brand.productName} — početna`}>
              <Logo compact />
            </Link>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{brand.companyName}</p>
              <p className="truncate text-xs text-ink-3">{ready ? `Danas · ${formatLong(state.anchor)}` : 'demo firma'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ShowGuideButton className="hidden sm:inline-flex" />
            <PerspectiveSwitch className="hidden md:flex" />
          </div>
        </div>
        <div className="border-t border-line px-4 py-2 md:hidden">
          <PerspectiveSwitch />
        </div>
      </header>

      <main id="sadrzaj" className="mx-auto w-full max-w-[1240px] px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:pt-7 lg:pb-16">
        {ready ? children : <LoadingScreen />}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="no-print pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface lg:hidden" aria-label="Glavna navigacija">
        <ul className="grid grid-cols-4">
          {bottom.map((item) => {
            const Icon = item.icon;
            const active = item.match(pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn('flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-xs font-semibold', active ? 'text-primary' : 'text-ink-2')}
                >
                  <Icon className="size-5" aria-hidden />
                  {item.label === 'Radni nalozi' ? 'Nalozi' : item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn('flex min-h-[60px] w-full flex-col items-center justify-center gap-0.5 text-xs font-semibold', moreActive ? 'text-primary' : 'text-ink-2')}
              aria-haspopup="dialog"
            >
              <Menu className="size-5" aria-hidden />
              Više
            </button>
          </li>
        </ul>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="Više">
        <ul className="space-y-1">
          {nav.slice(2).filter((n) => n.href !== '/demo/nalozi').map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link href={item.href} onClick={() => setMoreOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl px-3 font-medium hover:bg-bg" aria-current={item.match(pathname) ? 'page' : undefined}>
                  <Icon className="size-5 text-ink-2" aria-hidden />
                  <span className="flex-1">{item.label}</span>
                  {item.count ? <span className="rounded-full bg-warn-soft px-2 py-0.5 text-xs font-bold text-warn">{item.count}</span> : null}
                </Link>
              </li>
            );
          })}
          <li className="pt-2">
            <p className="px-3 pb-1 text-xs font-bold tracking-wide text-ink-3 uppercase">Druge perspektive</p>
          </li>
          <li>
            <Link href="/demo/serviser" className="flex min-h-12 items-center gap-3 rounded-xl px-3 font-medium hover:bg-bg">
              <Smartphone className="size-5 text-ink-2" aria-hidden /> Serviser (telefon)
            </Link>
          </li>
          <li>
            <Link href={`/demo/kupac/${GUIDE_DEVICE_ID}`} className="flex min-h-12 items-center gap-3 rounded-xl px-3 font-medium hover:bg-bg">
              <QrCode className="size-5 text-ink-2" aria-hidden /> Kupac (QR kartica)
            </Link>
          </li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          <ResetButton />
          <ShowGuideButton />
        </div>
      </Modal>

      <GuidePanel />
    </div>
  );
}
