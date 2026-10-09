'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';

import { Card, EmptyState, PageHeader } from '@/components/ui';
import { formatLong } from '@/lib/dates';
import { deviceTitle, lookup } from '@/lib/derive';
import { useDemo } from '@/lib/store';

export default function ReportsPage() {
  const { state } = useDemo();
  const L = lookup(state);
  const done = state.workOrders
    .filter((w) => w.status === 'zavrsen')
    .sort((a, b) => ((a.completedOn ?? '') < (b.completedOn ?? '') ? 1 : -1));

  return (
    <>
      <PageHeader title="Izvještaji" subtitle="Primjeri servisnih izvještaja za završene demo naloge. Svaki se može odštampati ili sačuvati kao PDF iz preglednika." />
      {done.length === 0 ? (
        <Card>
          <EmptyState title="Još nema završenih naloga" />
        </Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {done.map((w) => {
            const d = L.device(w.deviceId);
            return (
              <li key={w.id}>
                <Link href={`/demo/izvjestaji/${w.id}`} className="flex gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-card)] hover:border-primary/40">
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary" aria-hidden>
                    <FileText className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold">
                      IZV-{w.id.replace('NAL-', '')} · {d ? deviceTitle(state, d) : w.deviceId}
                    </span>
                    <span className="block text-sm text-ink-2">
                      {w.completedOn ? formatLong(w.completedOn) : ''} · {L.technician(w.technicianId)?.name}
                    </span>
                    <span className="mt-1 block text-sm font-semibold text-primary">Pogledaj primjer izvještaja →</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
