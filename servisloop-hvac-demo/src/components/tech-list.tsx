'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { MapPin } from 'lucide-react';

import { cn } from '@/lib/cn';
import { formatShort, relativeDays } from '@/lib/dates';
import { endTime, lookup } from '@/lib/derive';
import { useDemo } from '@/lib/store';
import type { WorkOrder } from '@/lib/types';

import { OrderBadge } from './status';
import { buttonClass } from './ui';

/** Aktivni serviser u prikazu (demo perspektiva, bez prijave). */
export function useActiveTechnician(): string {
  const { state } = useDemo();
  const params = useSearchParams();
  const fromQuery = params.get('serviser');
  if (fromQuery && state.technicians.some((t) => t.id === fromQuery)) return fromQuery;
  const req = state.guide.requestId ? state.requests.find((r) => r.id === state.guide.requestId) : undefined;
  const guideOrder = req?.workOrderId ? state.workOrders.find((w) => w.id === req.workOrderId) : undefined;
  return guideOrder?.technicianId ?? 't1';
}

export function TechnicianPicker({ active }: { active: string }) {
  const { state } = useDemo();
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div role="radiogroup" aria-label="Prikaz za servisera" className="grid grid-cols-2 gap-2">
      {state.technicians.map((t) => (
        <button
          key={t.id}
          role="radio"
          aria-checked={t.id === active}
          onClick={() => router.replace(`${pathname}?serviser=${t.id}`, { scroll: false })}
          className={cn(
            'flex min-h-12 items-center gap-2 rounded-xl border px-3 text-left text-sm font-semibold',
            t.id === active ? 'border-primary bg-primary-soft text-ink' : 'border-line-2 bg-surface text-ink-2',
          )}
        >
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-nav text-[11px] font-bold text-white" aria-hidden>
            {t.initials}
          </span>
          <span className="min-w-0 truncate">{t.name}</span>
        </button>
      ))}
    </div>
  );
}

export function JobCard({ order, showDate }: { order: WorkOrder; showDate?: boolean }) {
  const { state } = useDemo();
  const L = lookup(state);
  const d = L.device(order.deviceId);
  const loc = d ? L.deviceLocation(d) : undefined;
  return (
    <article className="rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-card)]" data-testid={`job-${order.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xl font-bold tabular-nums">{order.start}</p>
          <p className="text-xs text-ink-3 tabular-nums">
            do {endTime(order)}
            {showDate ? ` · ${formatShort(order.date)} (${relativeDays(order.date, state.anchor)})` : ''}
          </p>
        </div>
        <OrderBadge status={order.status} />
      </div>
      <h3 className="mt-2 font-semibold">
        {order.deviceId} · {loc?.name}
      </h3>
      <p className="text-sm text-ink-2">{d?.typeLabel}</p>
      <p className="mt-1 flex items-start gap-1.5 text-sm text-ink-2">
        <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
        {loc?.address}, {loc?.city}
      </p>
      <p className="mt-2 text-sm">
        <span className="font-semibold">Razlog: </span>
        {order.category}
      </p>
      <Link href={`/demo/serviser/nalog/${order.id}`} className={buttonClass(order.status === 'zavrsen' ? 'secondary' : 'primary', 'md', 'mt-3 w-full')}>
        {order.status === 'zavrsen' ? 'Pogledaj nalog' : 'Otvori nalog'}
      </Link>
    </article>
  );
}
