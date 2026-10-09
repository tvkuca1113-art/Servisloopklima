'use client';

import Link from 'next/link';
import { AlertTriangle, CalendarClock, ClipboardList, Inbox } from 'lucide-react';

import { brand } from '@/config/brand';
import { formatLong, formatShort, relativeDays } from '@/lib/dates';
import { GUIDE_DEVICE_ID } from '@/lib/demo-data';
import { deviceTitle, endTime, kpis, lookup, orderDevicesLabel, sortOrders } from '@/lib/derive';
import { useDemo } from '@/lib/store';

import { DueBadge } from './status';
import { Skeleton } from './ui';

/** Živi, umanjeni prikaz stvarnog vlasničkog pregleda iz demo podataka. */
export function LandingPreview() {
  const { state, ready } = useDemo();
  if (!ready) return <Skeleton className="h-[420px] w-full rounded-2xl" />;

  const L = lookup(state);
  const k = kpis(state);
  const today = state.anchor;
  const todayOrders = state.workOrders.filter((w) => w.date === today && w.status !== 'otkazan').sort(sortOrders).slice(0, 4);
  const attention = [...k.overdue].sort((a, b) => (a.nextServiceOn < b.nextServiceOn ? -1 : 1)).slice(0, 3);
  const guide = L.device(GUIDE_DEVICE_ID);
  const guideLoc = guide ? L.deviceLocation(guide) : undefined;

  const stats = [
    { label: 'Zakasneli servisi', value: k.overdue.length, icon: AlertTriangle, cls: 'text-danger bg-danger-soft' },
    { label: 'Narednih 7 dana', value: k.next7.length, icon: CalendarClock, cls: 'text-warn bg-warn-soft' },
    { label: 'Novi demo zahtjevi', value: k.newRequests.length, icon: Inbox, cls: 'text-primary bg-primary-soft' },
    { label: 'Otvoreni demo nalozi', value: k.openOrders.length, icon: ClipboardList, cls: 'text-ok bg-ok-soft' },
  ];

  return (
    <div className="relative">
      <Link href="/demo" className="group block overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-20px_rgb(16_24_40/0.35)]" aria-label="Otvori vlasnički pregled demoa">
        <div className="flex items-center gap-2 border-b border-line bg-bg px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-line-2" />
            <span className="size-2.5 rounded-full bg-line-2" />
            <span className="size-2.5 rounded-full bg-line-2" />
          </span>
          <span className="ml-2 truncate text-xs font-medium text-ink-2">Pregled servisa · {brand.companyName}</span>
          <span className="ml-auto shrink-0 rounded bg-demo px-1.5 py-0.5 text-[10px] font-bold text-white">DEMO</span>
        </div>
        <div className="flex">
          <div className="hidden w-28 shrink-0 space-y-1.5 bg-nav p-3 sm:block" aria-hidden>
            {['Pregled', 'Uređaji', 'Raspored', 'Zahtjevi', 'Nalozi', 'Izvještaji'].map((n, i) => (
              <div key={n} className={`rounded px-2 py-1 text-[11px] ${i === 0 ? 'bg-white/10 text-white' : 'text-nav-muted'}`}>
                {n}
              </div>
            ))}
          </div>
          <div className="min-w-0 flex-1 p-3 sm:p-4">
            <p className="text-sm font-bold">Pregled servisa</p>
            <p className="text-[11px] text-ink-3">Danas · {formatLong(today)}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="rounded-lg border border-line p-2">
                    <span className={`inline-flex size-5 items-center justify-center rounded ${s.cls}`} aria-hidden>
                      <Icon className="size-3" />
                    </span>
                    <p className="mt-1 text-lg leading-none font-bold">{s.value}</p>
                    <p className="mt-0.5 text-[10px] leading-tight text-ink-2">{s.label}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1.3fr_1fr]">
              <div className="rounded-lg border border-line">
                <p className="border-b border-line px-2.5 py-1.5 text-[11px] font-semibold">Potrebna pažnja</p>
                <ul className="divide-y divide-line">
                  {attention.map((d) => (
                    <li key={d.id} className="px-2.5 py-1.5">
                      <p className="truncate text-[11px] font-semibold">{deviceTitle(state, d)}</p>
                      <div className="mt-0.5 origin-left scale-90">
                        <DueBadge device={d} today={today} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-line">
                <p className="border-b border-line px-2.5 py-1.5 text-[11px] font-semibold">Današnji raspored</p>
                <ul className="divide-y divide-line">
                  {todayOrders.map((w) => (
                    <li key={w.id} className="px-2.5 py-1.5 text-[11px]">
                      <p className="font-semibold tabular-nums">
                        {w.start}–{endTime(w)} · {orderDevicesLabel(w)}
                      </p>
                      <p className="truncate text-ink-2">{L.technician(w.technicianId)?.name ?? 'Bez servisera'}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {guide ? (
        <Link
          href={`/demo/kupac/${guide.id}`}
          className="absolute -bottom-8 -left-4 hidden w-52 rounded-[22px] border-4 border-nav bg-surface p-3 shadow-[var(--shadow-pop)] lg:block"
          aria-label="Otvori prikaz kupca za TP-001"
        >
          <p className="text-[10px] text-ink-3">{brand.companyName}</p>
          <p className="text-[10px] font-semibold text-ink-2">Vaš uređaj</p>
          <p className="text-[13px] leading-tight font-bold">
            {guide.id} · {guideLoc?.name}
          </p>
          <p className="mt-1 text-[10px] text-ink-2">
            Sljedeći servis: {formatShort(guide.nextServiceOn)} ({relativeDays(guide.nextServiceOn, today)})
          </p>
          <span className="mt-2 block rounded-lg bg-primary py-1.5 text-center text-[11px] font-semibold text-white">Pogledaj primjer zakazivanja</span>
          <span className="mt-1 block rounded-lg border border-line-2 py-1.5 text-center text-[11px] font-semibold">Primjer prijave kvara</span>
        </Link>
      ) : null}
      <p className="mt-3 text-center text-xs text-ink-3 lg:mt-4 lg:pl-52 lg:text-right">Živi prikaz demoa iz izmišljenih podataka.</p>
    </div>
  );
}
