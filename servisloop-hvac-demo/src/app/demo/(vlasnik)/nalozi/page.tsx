'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { OrderBadge } from '@/components/status';
import { Card, EmptyState, PageHeader, inputClass } from '@/components/ui';
import { formatShort, relativeDays } from '@/lib/dates';
import { endTime, isOpen, lookup, orderTitle, sortOrders } from '@/lib/derive';
import { useDemo } from '@/lib/store';

const STATUS = [
  { id: 'otvoreni', label: 'Otvoreni (planirani i u radu)' },
  { id: 'planiran', label: 'Planiran' },
  { id: 'u_radu', label: 'U radu' },
  { id: 'zavrsen', label: 'Završen' },
  { id: 'otkazan', label: 'Otkazan' },
  { id: 'svi', label: 'Svi statusi' },
];

function OrdersInner() {
  const { state } = useDemo();
  const L = lookup(state);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const status = params.get('status') ?? 'svi';
  const tech = params.get('serviser') ?? 'svi';
  const today = state.anchor;

  const setParam = (k: string, v: string) => {
    const p = new URLSearchParams(params.toString());
    if (v === 'svi') p.delete(k);
    else p.set(k, v);
    router.replace(`${pathname}${p.toString() ? `?${p}` : ''}`, { scroll: false });
  };

  const list = state.workOrders
    .filter((w) => (status === 'svi' ? true : status === 'otvoreni' ? isOpen(w) : w.status === status))
    .filter((w) => (tech === 'svi' ? true : tech === 'bez' ? !w.technicianId : w.technicianId === tech))
    .sort(sortOrders);

  return (
    <>
      <PageHeader title="Radni nalozi" subtitle="Planirani, aktivni i završeni demo nalozi." />
      <Card className="mb-4 grid gap-3 p-3 sm:grid-cols-2 sm:p-4">
        <div>
          <label htmlFor="f-status" className="mb-1 block text-sm font-semibold">
            Status
          </label>
          <select id="f-status" value={status} onChange={(e) => setParam('status', e.target.value)} className={inputClass()}>
            {STATUS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-tech" className="mb-1 block text-sm font-semibold">
            Serviser
          </label>
          <select id="f-tech" value={tech} onChange={(e) => setParam('serviser', e.target.value)} className={inputClass()}>
            <option value="svi">Svi serviseri</option>
            {state.technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
            <option value="bez">Bez servisera</option>
          </select>
        </div>
        <p className="text-sm text-ink-2 sm:col-span-2" aria-live="polite" data-testid="order-count">
          Prikazano: {list.length} od {state.workOrders.length}
        </p>
      </Card>

      {list.length === 0 ? (
        <Card>
          <EmptyState title="Nema naloga za ovaj filter" />
        </Card>
      ) : (
        <ul className="space-y-2.5">
          {list.map((w) => {
            const t = L.technician(w.technicianId);
            return (
              <li key={w.id}>
                <Link href={`/demo/nalozi/${w.id}`} className="grid gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-card)] hover:border-primary/40 md:grid-cols-[150px_minmax(0,1fr)_200px_130px] md:items-center md:gap-4">
                  <div>
                    <p className="font-semibold tabular-nums">{formatShort(w.date)}</p>
                    <p className="text-sm text-ink-2 tabular-nums">
                      {w.start}–{endTime(w)} · {relativeDays(w.date, today)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {w.id} · {orderTitle(state, w)}
                    </p>
                    <p className="truncate text-sm text-ink-2">{w.category}</p>
                  </div>
                  <p className={t ? 'text-sm' : 'text-sm font-semibold text-warn'}>{t ? t.name : 'Bez servisera'}</p>
                  <div>
                    <OrderBadge status={w.status} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersInner />
    </Suspense>
  );
}
