'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { Suspense, useMemo, useState } from 'react';

import { DeviceFormModal } from '@/components/device-form';
import { DueBadge } from '@/components/status';
import { Button, Card, EmptyState, PageHeader, inputClass } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatShort, relativeDays } from '@/lib/dates';
import { dueStatus, type DueStatus, lookup } from '@/lib/derive';
import { useDemo } from '@/lib/store';

const STATUS_FILTERS: { id: 'sve' | DueStatus; label: string }[] = [
  { id: 'sve', label: 'Svi statusi' },
  { id: 'zakasnio', label: 'Servis kasni' },
  { id: 'sedam', label: 'Narednih 7 dana' },
  { id: 'uskoro', label: 'Uskoro (do 30 dana)' },
  { id: 'uredu', label: 'U planu' },
];

function DevicesInner() {
  const { state } = useDemo();
  const L = lookup(state);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const today = state.anchor;
  const [q, setQ] = useState(params.get('q') ?? '');
  const kind = (params.get('tip') ?? 'sve') as 'sve' | 'klima' | 'pumpa';
  const status = (params.get('status') ?? 'sve') as 'sve' | DueStatus;
  const [adding, setAdding] = useState(false);

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(params.toString());
    if (value === 'sve' || value === '') p.delete(key);
    else p.set(key, value);
    router.replace(`${pathname}${p.toString() ? `?${p}` : ''}`, { scroll: false });
  };

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return state.devices
      .filter((d) => kind === 'sve' || d.kind === kind)
      .filter((d) => status === 'sve' || dueStatus(d, today) === status)
      .filter((d) => {
        if (!needle) return true;
        const loc = L.deviceLocation(d);
        const cust = L.deviceCustomer(d);
        return [d.id, d.name, d.typeLabel, loc?.name, loc?.city, cust?.name].some((s) => s?.toLowerCase().includes(needle));
      })
      .sort((a, b) => (a.nextServiceOn < b.nextServiceOn ? -1 : a.nextServiceOn > b.nextServiceOn ? 1 : a.id.localeCompare(b.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.devices, q, kind, status, today]);

  const klima = state.devices.filter((d) => d.kind === 'klima').length;
  const pumpe = state.devices.length - klima;

  return (
    <>
      <PageHeader
        title="Uređaji"
        subtitle={`${state.devices.length} uređaja u primjeru · ${klima} klima · ${pumpe} toplotnih pumpi`}
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus aria-hidden /> Dodaj demo uređaj
          </Button>
        }
      />

      <Card className="mb-4 p-3 sm:p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="relative">
            <label htmlFor="pretraga" className="sr-only">
              Pretraga uređaja
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-ink-3" aria-hidden />
            <input
              id="pretraga"
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
              }}
              onBlur={() => setParam('q', q)}
              placeholder="Pretraži po nazivu, tipu, kupcu ili gradu"
              className={cn(inputClass(), 'pl-10')}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-tip" className="sr-only">
              Vrsta uređaja
            </label>
            <select id="filter-tip" value={kind} onChange={(e) => setParam('tip', e.target.value)} className={inputClass()}>
              <option value="sve">Sve vrste</option>
              <option value="klima">Klima uređaji</option>
              <option value="pumpa">Toplotne pumpe</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-status" className="sr-only">
              Status servisa
            </label>
            <select id="filter-status" value={status} onChange={(e) => setParam('status', e.target.value)} className={inputClass()}>
              {STATUS_FILTERS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-2 text-sm text-ink-2" aria-live="polite" data-testid="device-count">
          Prikazano: {list.length} od {state.devices.length}
          {kind !== 'sve' || status !== 'sve' || q ? (
            <button
              type="button"
              className="ml-2 font-semibold text-primary underline underline-offset-2"
              onClick={() => {
                setQ('');
                router.replace(pathname, { scroll: false });
              }}
            >
              Poništi filtere
            </button>
          ) : null}
        </p>
      </Card>

      {list.length === 0 ? (
        <Card>
          <EmptyState title="Nema uređaja za ovaj filter">Promijenite pretragu ili poništite filtere.</EmptyState>
        </Card>
      ) : (
        <>
          {/* Desktop tabela */}
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full table-fixed text-left text-sm">
              <caption className="sr-only">Lista uređaja</caption>
              <thead className="border-b border-line bg-bg text-xs font-semibold tracking-wide text-ink-2 uppercase">
                <tr>
                  <th scope="col" className="w-[34%] px-5 py-3">Uređaj</th>
                  <th scope="col" className="w-[26%] px-3 py-3">Kupac · lokacija</th>
                  <th scope="col" className="w-[18%] px-3 py-3">Sljedeći servis</th>
                  <th scope="col" className="w-[22%] px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.map((d) => {
                  const loc = L.deviceLocation(d);
                  const cust = L.deviceCustomer(d);
                  return (
                    <tr key={d.id} className="relative hover:bg-bg">
                      <td className="px-5 py-3.5 align-top">
                        <Link href={`/demo/uredaji/${d.id}`} className="font-semibold text-ink after:absolute after:inset-0 hover:text-primary">
                          {d.id} · {d.name}
                        </Link>
                        <p className="text-ink-2">{d.typeLabel}</p>
                      </td>
                      <td className="px-3 py-3.5 align-top">
                        <p className="font-medium">{cust?.name}</p>
                        <p className="text-ink-2">
                          {loc?.name}, {loc?.city}
                        </p>
                      </td>
                      <td className="px-3 py-3.5 align-top">
                        <p className="font-medium tabular-nums">{formatShort(d.nextServiceOn)}</p>
                        <p className="text-ink-2">{relativeDays(d.nextServiceOn, today)}</p>
                      </td>
                      <td className="px-3 py-3.5 align-top">
                        <DueBadge device={d} today={today} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {/* Mobilne kartice */}
          <ul className="space-y-3 md:hidden">
            {list.map((d) => {
              const loc = L.deviceLocation(d);
              const cust = L.deviceCustomer(d);
              return (
                <li key={d.id}>
                  <Link href={`/demo/uredaji/${d.id}`} className="block rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-card)] active:bg-bg">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold">
                        {d.id} · {d.name}
                      </p>
                    </div>
                    <p className="text-sm text-ink-2">{d.typeLabel}</p>
                    <p className="mt-1 text-sm text-ink-2">
                      {cust?.name} · {loc?.city}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      <DueBadge device={d} today={today} />
                      <span className="text-ink-2">
                        {formatShort(d.nextServiceOn)} · {relativeDays(d.nextServiceOn, today)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <DeviceFormModal open={adding} onClose={() => setAdding(false)} onSaved={(id) => router.push(`/demo/uredaji/${id}`)} />
    </>
  );
}

export default function DevicesPage() {
  return (
    <Suspense>
      <DevicesInner />
    </Suspense>
  );
}
