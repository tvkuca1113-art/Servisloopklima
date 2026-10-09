'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FileText, Smartphone, UserPlus } from 'lucide-react';
import { useState } from 'react';

import { AssignModal, type AssignTarget } from '@/components/assign-modal';
import { OrderBadge } from '@/components/status';
import { DEMO_CHANGE, useToast } from '@/components/toast';
import { Badge, Button, ButtonLink, Card, CardHeader, DemoTag, EmptyState, Modal, PageHeader } from '@/components/ui';
import { ANSWER_LABEL } from '@/lib/checklists';
import { formatLong } from '@/lib/dates';
import { deviceTitle, endTime, isOpen, lookup } from '@/lib/derive';
import { useDemo } from '@/lib/store';
import { identificationLabel } from '@/components/work-order-run';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { state, updateOrder } = useDemo();
  const toast = useToast();
  const L = lookup(state);
  const order = L.workOrder(decodeURIComponent(id));
  const [assign, setAssign] = useState<AssignTarget | null>(null);
  const [cancelling, setCancelling] = useState(false);

  if (!order) {
    return (
      <Card>
        <EmptyState title="Nalog ne postoji u primjeru" action={<ButtonLink href="/demo/nalozi">Nazad na naloge</ButtonLink>}>
          Možda je napravljen u drugoj probi ili je primjer vraćen na početno stanje.
        </EmptyState>
      </Card>
    );
  }

  const d = L.device(order.deviceId);
  const loc = L.location(order.locationId);
  const cust = loc ? L.customer(loc.customerId) : undefined;
  const tech = L.technician(order.technicianId);
  const request = order.requestId ? L.request(order.requestId) : undefined;

  return (
    <>
      <PageHeader
        back={{ href: '/demo/nalozi', label: 'Radni nalozi' }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {order.id} <OrderBadge status={order.status} /> <DemoTag>Demo nalog</DemoTag>
          </span>
        }
        subtitle={d ? deviceTitle(state, d) : order.deviceId}
        actions={
          <>
            {order.status === 'zavrsen' ? (
              <ButtonLink href={`/demo/izvjestaji/${order.id}`}>
                <FileText aria-hidden /> Pogledaj primjer izvještaja
              </ButtonLink>
            ) : null}
            {isOpen(order) ? (
              <>
                <ButtonLink href={`/demo/serviser/nalog/${order.id}`} variant="secondary">
                  <Smartphone aria-hidden /> Otvori kao serviser
                </ButtonLink>
                <Button onClick={() => setAssign({ mode: 'order', orderId: order.id })}>
                  <UserPlus aria-hidden /> {order.technicianId ? 'Promijeni servisera' : 'Dodijeli servisera'}
                </Button>
              </>
            ) : null}
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
        <Card aria-labelledby="nalog-podaci">
          <CardHeader id="nalog-podaci" title="Podaci naloga" />
          <dl className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5">
            <div>
              <dt className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Termin</dt>
              <dd className="mt-0.5 font-medium">
                {formatLong(order.date)}
                <span className="block text-sm text-ink-2 tabular-nums">
                  {order.start}–{endTime(order)}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Serviser</dt>
              <dd className="mt-0.5 font-medium">{tech ? tech.name : <Badge tone="warn">Bez servisera</Badge>}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Glavni uređaj (iz zahtjeva / plana)</dt>
              <dd className="mt-0.5">
                {d ? (
                  <Link href={`/demo/uredaji/${d.id}`} className="font-medium text-primary hover:underline">
                    {d.id} · {d.name}
                  </Link>
                ) : (
                  order.deviceId
                )}
                <span className="block text-sm text-ink-2">{d?.typeLabel}</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Kupac i lokacija</dt>
              <dd className="mt-0.5 font-medium">
                {cust?.name}
                <span className="block text-sm font-normal text-ink-2">
                  {loc?.address}, {loc?.city}
                </span>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Razlog dolaska</dt>
              <dd className="mt-0.5">
                {order.category} — {order.reason}
              </dd>
            </div>
            {request ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Iz zahtjeva</dt>
                <dd className="mt-0.5">
                  <Link href={`/demo/zahtjevi?istakni=${request.id}`} className="font-medium text-primary hover:underline">
                    {request.id} · {request.name}
                  </Link>
                </dd>
              </div>
            ) : null}
          </dl>
          {isOpen(order) ? (
            <div className="border-t border-line px-4 py-3 sm:px-5">
              <Button variant="danger" size="sm" onClick={() => setCancelling(true)}>
                Otkaži u demou
              </Button>
            </div>
          ) : null}
        </Card>

        <Card aria-labelledby="nalog-lista">
          <CardHeader
            id="nalog-lista"
            title={`Uređaji u posjeti (${order.items.length})`}
            subtitle="Serviser na objektu skenira QR svakog uređaja prije unosa."
            action={isOpen(order) ? <ButtonLink href={`/demo/serviser/nalog/${order.id}`} variant="secondary" size="sm">Otvori kao serviser</ButtonLink> : undefined}
          />
          <ul className="divide-y divide-line">
            {order.items.map((item) => {
              const dev = L.device(item.deviceId);
              const attention = item.checklist.filter((c) => c.answer === 'paznja');
              return (
                <li key={item.deviceId} className="px-4 py-3 sm:px-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/demo/uredaji/${item.deviceId}`} className="font-semibold text-primary hover:underline">
                      {dev?.id} · {dev?.name}
                    </Link>
                    {item.done ? <Badge tone="ok">Obrađen</Badge> : item.identifiedBy ? <Badge tone="info">Unos u toku</Badge> : <Badge>Čeka skeniranje</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-ink-2">
                    {dev?.typeLabel} · {item.identifiedBy ? identificationLabel(item) : 'Još nije identifikovan na objektu'}
                  </p>
                  {attention.map((c) => (
                    <p key={c.id} className="mt-1 text-sm">
                      <Badge tone="warn">{ANSWER_LABEL.paznja}</Badge> {c.label}
                      {c.note ? ` — ${c.note}` : ''}
                    </p>
                  ))}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <AssignModal target={assign} onClose={() => setAssign(null)} onDone={() => undefined} />
      <Modal
        open={cancelling}
        onClose={() => setCancelling(false)}
        title={`Otkazati ${order.id} u demou?`}
        description="Kupac neće biti obaviješten — ovo je samo prikaz statusa."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelling(false)}>
              Odustani
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                updateOrder(order.id, { status: 'otkazan' });
                setCancelling(false);
                toast({ title: DEMO_CHANGE, body: `Nalog ${order.id} je označen kao otkazan.` });
              }}
            >
              Otkaži u demou
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-2">Otkazani nalog ostaje vidljiv u listi sa statusom „Otkazan”.</p>
      </Modal>
    </>
  );
}
