'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Suspense, useState } from 'react';

import { AssignModal, type AssignTarget } from '@/components/assign-modal';
import { OrderBadge } from '@/components/status';
import { Button, Card, PageHeader, inputClass } from '@/components/ui';
import { cn } from '@/lib/cn';
import { addDays, formatDayMonth, formatLong, formatShort, startOfWeek, weekdayName } from '@/lib/dates';
import { endTime, lookup, orderDevicesLabel, sortOrders } from '@/lib/derive';
import { useDemo } from '@/lib/store';
import type { WorkOrder } from '@/lib/types';

function ScheduleInner() {
  const { state } = useDemo();
  const L = lookup(state);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const today = state.anchor;
  const selected = /^\d{4}-\d{2}-\d{2}$/.test(params.get('datum') ?? '') ? params.get('datum')! : today;
  const tech = params.get('serviser') ?? 'svi';
  const showCancelled = params.get('otkazani') === 'da';
  const [assign, setAssign] = useState<AssignTarget | null>(null);

  const setParams = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) p.delete(k);
      else p.set(k, v);
    }
    router.replace(`${pathname}?${p}`, { scroll: false });
  };

  const weekStart = startOfWeek(selected);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const visible = (w: WorkOrder) =>
    (tech === 'svi' || (tech === 'bez' ? !w.technicianId : w.technicianId === tech)) && (showCancelled || w.status !== 'otkazan');
  const ordersOn = (day: string) => state.workOrders.filter((w) => w.date === day && visible(w)).sort(sortOrders);
  const weekCount = days.reduce((n, d) => n + ordersOn(d).length, 0);

  const OrderChip = ({ w }: { w: WorkOrder }) => {
    const d = L.device(w.deviceId);
    const loc = d ? L.deviceLocation(d) : undefined;
    const t = L.technician(w.technicianId);
    return (
      <div className={cn('rounded-lg border bg-surface p-2.5 text-sm', w.technicianId ? 'border-line' : 'border-warn/40 bg-warn-soft')}>
        <Link href={`/demo/nalozi/${w.id}`} className="block hover:text-primary">
          <span className="block font-semibold tabular-nums">
            {w.start}–{endTime(w)}
          </span>
          <span className="block font-medium">{orderDevicesLabel(w)}</span>
          <span className="block text-[13px] text-ink-2">{loc?.name}</span>
          <span className="block text-[13px] text-ink-2">{t ? t.name : 'Bez servisera'}</span>
        </Link>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <OrderBadge status={w.status} />
        </div>
        {!w.technicianId && w.status === 'planiran' ? (
          <Button size="sm" className="mt-2 w-full" onClick={() => setAssign({ mode: 'order', orderId: w.id })}>
            Dodijeli servisera
          </Button>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <PageHeader title="Raspored" subtitle={`Sedmica ${formatShort(weekStart)} – ${formatShort(addDays(weekStart, 6))} · ${weekCount} naloga`} />

      <Card className="mb-4 grid gap-3 p-3 sm:p-4 md:grid-cols-[auto_minmax(0,200px)_minmax(0,220px)_auto] md:items-end">
        <div className="flex items-end gap-2">
          <Button variant="secondary" aria-label="Prethodna sedmica" onClick={() => setParams({ datum: addDays(selected, -7) })} className="w-11 px-0">
            <ChevronLeft aria-hidden />
          </Button>
          <Button variant="secondary" onClick={() => setParams({ datum: today })}>
            Danas
          </Button>
          <Button variant="secondary" aria-label="Sljedeća sedmica" onClick={() => setParams({ datum: addDays(selected, 7) })} className="w-11 px-0">
            <ChevronRight aria-hidden />
          </Button>
        </div>
        <div>
          <label htmlFor="r-datum" className="mb-1 block text-sm font-semibold">
            Datum
          </label>
          <input id="r-datum" type="date" value={selected} onChange={(e) => e.target.value && setParams({ datum: e.target.value })} className={inputClass()} />
        </div>
        <div>
          <label htmlFor="r-serviser" className="mb-1 block text-sm font-semibold">
            Serviser
          </label>
          <select id="r-serviser" value={tech} onChange={(e) => setParams({ serviser: e.target.value === 'svi' ? null : e.target.value })} className={inputClass()}>
            <option value="svi">Svi serviseri</option>
            {state.technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
            <option value="bez">Bez servisera</option>
          </select>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={showCancelled} onChange={(e) => setParams({ otkazani: e.target.checked ? 'da' : null })} className="size-5 accent-[var(--color-primary)]" />
          Prikaži otkazane
        </label>
      </Card>

      {/* Desktop / tablet: sedmica */}
      <div className="hidden gap-2 xl:grid xl:grid-cols-7" data-testid="week-grid">
        {days.map((day) => {
          const list = ordersOn(day);
          const isToday = day === today;
          return (
            <section key={day} aria-label={formatLong(day)} className={cn('min-h-48 rounded-xl border p-2', isToday ? 'border-primary/40 bg-primary-soft' : day === selected ? 'border-line-2 bg-surface' : 'border-line bg-surface/60')}>
              <button type="button" onClick={() => setParams({ datum: day })} className="mb-2 w-full rounded-md px-1 py-1 text-left">
                <span className="block text-xs font-semibold text-ink-2 uppercase">{weekdayName(day, true)}</span>
                <span className={cn('block text-sm font-bold', isToday && 'text-primary')}>
                  {formatDayMonth(day)}
                  {isToday ? ' · danas' : ''}
                </span>
              </button>
              <div className="space-y-2">
                {list.length === 0 ? <p className="px-1 text-xs text-ink-3">Nema naloga</p> : list.map((w) => <OrderChip key={w.id} w={w} />)}
              </div>
            </section>
          );
        })}
      </div>

      {/* Telefon: dnevne kartice */}
      <div className="xl:hidden">
        <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Dan u sedmici">
          {days.map((day) => {
            const active = day === selected;
            return (
              <button
                key={day}
                role="tab"
                aria-selected={active}
                onClick={() => setParams({ datum: day })}
                className={cn('flex min-h-14 min-w-14 shrink-0 flex-col items-center justify-center rounded-xl border px-2 text-sm', active ? 'border-nav bg-nav text-white' : 'border-line-2 bg-surface')}
              >
                <span className="text-[11px] font-semibold uppercase">{weekdayName(day, true)}</span>
                <span className="font-bold">{day.slice(8)}.</span>
                <span className={cn('text-[11px]', active ? 'text-nav-ink' : 'text-ink-3')}>{ordersOn(day).length} nal.</span>
              </button>
            );
          })}
        </div>
        <h2 className="mb-2 font-semibold">
          {weekdayName(selected)}, {formatLong(selected)}
          {selected === today ? ' · danas' : ''}
        </h2>
        <div className="space-y-2">
          {ordersOn(selected).length === 0 ? (
            <Card className="p-5 text-center text-sm text-ink-2">Nema naloga za ovaj dan.</Card>
          ) : (
            ordersOn(selected).map((w) => <OrderChip key={w.id} w={w} />)
          )}
        </div>
      </div>

      <p className="mt-4 text-[13px] text-ink-3">Raspored je primjer. Pravila dostupnosti, odsustva i trajanja poslova dogovaraju se za stvarnu verziju.</p>

      <AssignModal target={assign} onClose={() => setAssign(null)} onDone={() => undefined} />
    </>
  );
}

export default function SchedulePage() {
  return (
    <Suspense>
      <ScheduleInner />
    </Suspense>
  );
}
