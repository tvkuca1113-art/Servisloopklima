'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Bell, CalendarPlus, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';

import { AssignModal, type AssignTarget } from '@/components/assign-modal';
import { DeviceFormModal } from '@/components/device-form';
import { QrPanel } from '@/components/qr-panel';
import { DueBadge, OrderBadge, RequestBadge } from '@/components/status';
import { Button, ButtonLink, Card, CardHeader, EmptyState, PageHeader, buttonClass } from '@/components/ui';
import { GUIDE_DEVICE_ID } from '@/lib/demo-data';
import { formatInterval, formatLong, formatShort, relativeDays } from '@/lib/dates';
import { deviceTitle, isOpen, lookup, sortOrders } from '@/lib/derive';
import { useDemo } from '@/lib/store';

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold tracking-wide text-ink-3 uppercase">{label}</dt>
      <dd className="mt-0.5 text-[15px] text-ink">{children}</dd>
    </div>
  );
}

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const deviceId = decodeURIComponent(id);
  const { state, setGuide } = useDemo();
  const L = lookup(state);
  const device = L.device(deviceId);
  const [editing, setEditing] = useState(false);
  const [assign, setAssign] = useState<AssignTarget | null>(null);
  const today = state.anchor;

  useEffect(() => {
    if (deviceId === GUIDE_DEVICE_ID && !state.guide.visitedDevice) setGuide({ visitedDevice: true });
  }, [deviceId, state.guide.visitedDevice, setGuide]);

  if (!device) {
    return (
      <Card>
        <EmptyState title={`Uređaj ${deviceId} ne postoji u primjeru`} action={<ButtonLink href="/demo/uredaji">Nazad na uređaje</ButtonLink>}>
          Možda je dodan u drugoj probi ili je primjer vraćen na početno stanje.
        </EmptyState>
      </Card>
    );
  }

  const loc = L.deviceLocation(device);
  const cust = L.deviceCustomer(device);
  const orders = state.workOrders.filter((w) => w.deviceId === device.id).sort(sortOrders);
  const open = orders.filter(isOpen);
  const requests = state.requests.filter((r) => r.deviceId === device.id && r.status === 'na_cekanju');
  const title = deviceTitle(state, device);
  const siblings = state.devices.filter((x) => x.locationId === device.locationId && x.id !== device.id);

  return (
    <>
      <PageHeader
        back={{ href: '/demo/uredaji', label: 'Uređaji' }}
        title={title}
        subtitle={`${device.name} · ${device.typeLabel}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil aria-hidden /> Uredi
            </Button>
            <Button onClick={() => setAssign({ mode: 'device', deviceId: device.id })}>
              <CalendarPlus aria-hidden /> Planiraj demo servis
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <Card className="lg:col-start-1" aria-labelledby="rok">
          <CardHeader id="rok" title="Servis" action={<DueBadge device={device} today={today} />} />
          <dl className="grid gap-4 px-4 py-4 sm:grid-cols-3 sm:px-5">
            <Info label="Prethodni servis">{device.lastServiceOn ? formatLong(device.lastServiceOn) : 'Još nije servisiran'}</Info>
            <Info label="Sljedeći servis">
              {formatLong(device.nextServiceOn)}
              <span className="block text-sm text-ink-2">{relativeDays(device.nextServiceOn, today)}</span>
            </Info>
            <Info label="Interval (DEMO postavka)">{formatInterval(device.intervalMonths)}</Info>
          </dl>
          <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3 sm:px-5">
            <Link href={`/demo/poruke?primjer=podsjetnik&uredjaj=${device.id}`} className={buttonClass('secondary', 'sm')}>
              <Bell aria-hidden /> Pogledaj primjer podsjetnika
            </Link>
          </div>
        </Card>

        <div className="lg:col-start-2 lg:row-span-4 lg:row-start-1">
          <QrPanel deviceId={device.id} title={title} />
        </div>

        <Card className="lg:col-start-1" aria-labelledby="podaci">
          <CardHeader id="podaci" title="Podaci o uređaju" subtitle="Izmišljeni podaci za demo." />
          <dl className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5">
            <Info label="Kupac">
              {cust?.name}
              <span className="block text-sm text-ink-2">{cust?.type}</span>
            </Info>
            <Info label="Lokacija">
              {loc?.name}
              <span className="block text-sm text-ink-2">
                {loc?.address}, {loc?.city}
              </span>
            </Info>
            <Info label="Kontakt (demo)">
              <span className="break-all">{cust?.email}</span>
              <span className="block text-sm text-ink-2">{cust?.phone}</span>
            </Info>
            <Info label="Ugrađen">{formatLong(device.installedOn)}</Info>
            <Info label="Model">{device.model}</Info>
            <Info label="Serijski broj">
              <span className="font-mono text-sm">{device.serial}</span>
            </Info>
            {siblings.length ? (
              <div className="sm:col-span-2">
                <Info label="Na istom objektu">
                  <span className="flex flex-wrap gap-x-4 gap-y-1">
                    {siblings.map((x) => (
                      <Link key={x.id} href={`/demo/uredaji/${x.id}`} className="inline-flex min-h-9 items-center font-medium text-primary hover:underline">
                        {x.id} · {x.name}
                      </Link>
                    ))}
                  </span>
                </Info>
              </div>
            ) : null}
            {device.note ? (
              <div className="sm:col-span-2">
                <Info label="Napomena">{device.note}</Info>
              </div>
            ) : null}
          </dl>
        </Card>

        <Card className="lg:col-start-1" aria-labelledby="otvoreno">
          <CardHeader id="otvoreno" title="Otvoreni nalozi i zahtjevi" />
          {open.length + requests.length === 0 ? (
            <EmptyState title="Nema otvorenih naloga">Servis možete planirati dugmetom „Planiraj demo servis”.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {requests.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
                  <div>
                    <p className="font-semibold">
                      {r.id} · {r.kind === 'kvar' ? 'Prijava kvara' : 'Zahtjev za servis'}
                    </p>
                    <RequestBadge status={r.status} />
                  </div>
                  <ButtonLink href={`/demo/zahtjevi?istakni=${r.id}`} size="sm" variant="secondary">
                    Pogledaj zahtjev
                  </ButtonLink>
                </li>
              ))}
              {open.map((w) => (
                <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
                  <div>
                    <p className="font-semibold">
                      {w.id} · {formatShort(w.date)} u {w.start}
                    </p>
                    <p className="text-sm text-ink-2">{L.technician(w.technicianId)?.name ?? 'Bez servisera'}</p>
                    <OrderBadge status={w.status} />
                  </div>
                  <ButtonLink href={`/demo/nalozi/${w.id}`} size="sm" variant="secondary">
                    Otvori nalog
                  </ButtonLink>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-start-1" aria-labelledby="historija">
          <CardHeader id="historija" title="Servisna historija" subtitle="Primjeri zapisa." />
          <ol className="space-y-0 px-4 py-4 sm:px-5">
            {device.history.map((h, i) => (
              <li key={`${h.date}-${i}`} className="relative border-l-2 border-line pb-5 pl-5 last:pb-0">
                <span className="absolute top-1 -left-[7px] size-3 rounded-full border-2 border-surface bg-primary" aria-hidden />
                <p className="text-sm font-semibold">
                  {formatLong(h.date)} · {h.title}
                </p>
                <p className="text-sm text-ink-2">{L.technician(h.technicianId)?.name}</p>
                <p className="mt-1 text-sm">{h.summary}</p>
                {h.workOrderId ? (
                  <Link href={`/demo/izvjestaji/${h.workOrderId}`} className="mt-1 inline-flex min-h-9 items-center text-sm font-semibold text-primary hover:underline">
                    Pogledaj primjer izvještaja ({h.workOrderId})
                  </Link>
                ) : null}
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <DeviceFormModal open={editing} onClose={() => setEditing(false)} device={device} />
      <AssignModal target={assign} onClose={() => setAssign(null)} />
    </>
  );
}
