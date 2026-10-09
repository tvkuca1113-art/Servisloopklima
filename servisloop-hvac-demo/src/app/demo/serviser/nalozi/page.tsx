'use client';

import { Suspense } from 'react';

import { JobCard, TechnicianPicker, useActiveTechnician } from '@/components/tech-list';
import { Card, EmptyState } from '@/components/ui';
import { isOpen, sortOrders } from '@/lib/derive';
import { useDemo } from '@/lib/store';

function TechOrdersInner() {
  const { state } = useDemo();
  const tech = useActiveTechnician();
  const mine = state.workOrders.filter((w) => w.technicianId === tech).sort(sortOrders);
  const open = mine.filter(isOpen);
  const done = mine.filter((w) => w.status === 'zavrsen').reverse();

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Moji demo nalozi</h1>
      <div className="mt-4">
        <TechnicianPicker active={tech} />
      </div>
      <h2 className="mt-6 text-lg font-semibold">Otvoreni</h2>
      {open.length === 0 ? (
        <Card className="mt-3">
          <EmptyState title="Nema otvorenih naloga" />
        </Card>
      ) : (
        <ul className="mt-3 space-y-3">
          {open.map((w) => (
            <li key={w.id}>
              <JobCard order={w} showDate />
            </li>
          ))}
        </ul>
      )}
      <h2 className="mt-7 text-lg font-semibold">Završeni primjeri</h2>
      {done.length === 0 ? (
        <p className="mt-2 text-sm text-ink-2">Nema završenih naloga.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {done.map((w) => (
            <li key={w.id}>
              <JobCard order={w} showDate />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function TechOrdersPage() {
  return (
    <Suspense>
      <TechOrdersInner />
    </Suspense>
  );
}
