'use client';

import { Suspense } from 'react';

import { JobCard, TechnicianPicker, useActiveTechnician } from '@/components/tech-list';
import { Card, EmptyState } from '@/components/ui';
import { addDays, formatLong } from '@/lib/dates';
import { isOpen, sortOrders } from '@/lib/derive';
import { useDemo } from '@/lib/store';

function TechTodayInner() {
  const { state } = useDemo();
  const tech = useActiveTechnician();
  const today = state.anchor;
  const mine = state.workOrders.filter((w) => w.technicianId === tech && w.status !== 'otkazan').sort(sortOrders);
  const todays = mine.filter((w) => w.date === today);
  const upcoming = mine.filter((w) => w.date > today && w.date <= addDays(today, 7) && isOpen(w));

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Moji demo poslovi danas</h1>
      <p className="mt-1 text-ink-2">{formatLong(today)} · prikaz za servisera bez prijave (demo perspektiva)</p>
      <div className="mt-4">
        <TechnicianPicker active={tech} />
      </div>

      <section className="mt-5" aria-labelledby="danas-naslov">
        <h2 id="danas-naslov" className="sr-only">
          Danas
        </h2>
        {todays.length === 0 ? (
          <Card>
            <EmptyState title="Danas nema demo poslova">Vlasnik može dodijeliti nalog za današnji dan u pregledu zahtjeva.</EmptyState>
          </Card>
        ) : (
          <ul className="space-y-3">
            {todays.map((w) => (
              <li key={w.id}>
                <JobCard order={w} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-7" aria-labelledby="naredni-naslov">
        <h2 id="naredni-naslov" className="text-lg font-semibold">
          Narednih 7 dana
        </h2>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-sm text-ink-2">Nema planiranih poslova.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {upcoming.map((w) => (
              <li key={w.id}>
                <JobCard order={w} showDate />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default function TechTodayPage() {
  return (
    <Suspense>
      <TechTodayInner />
    </Suspense>
  );
}
