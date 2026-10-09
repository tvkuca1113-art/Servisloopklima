'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { ButtonLink, Card, EmptyState } from '@/components/ui';
import { WorkOrderRun } from '@/components/work-order-run';
import { lookup } from '@/lib/derive';
import { useDemo } from '@/lib/store';

export default function TechOrderPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useDemo();
  const order = lookup(state).workOrder(decodeURIComponent(id));

  return (
    <>
      <Link href={order?.technicianId ? `/demo/serviser?serviser=${order.technicianId}` : '/demo/serviser'} className="mb-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary">
        ← Moji poslovi
      </Link>
      {order ? (
        <WorkOrderRun order={order} />
      ) : (
        <Card>
          <EmptyState title="Nalog ne postoji u primjeru" action={<ButtonLink href="/demo/serviser">Moji poslovi</ButtonLink>}>
            Možda je napravljen u drugoj probi ili je primjer vraćen na početno stanje.
          </EmptyState>
        </Card>
      )}
    </>
  );
}
