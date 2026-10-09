'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { AssignModal, type AssignTarget } from '@/components/assign-modal';
import { REQUEST_LABEL, RequestBadge } from '@/components/status';
import { DEMO_CHANGE, useToast } from '@/components/toast';
import { Badge, Button, ButtonLink, Card, EmptyState, Modal, PageHeader } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatDateTime, formatLong } from '@/lib/dates';
import { deviceTitle, lookup } from '@/lib/derive';
import { useDemo } from '@/lib/store';
import type { RequestStatus } from '@/lib/types';

const TABS: { id: 'svi' | RequestStatus; label: string }[] = [
  { id: 'na_cekanju', label: REQUEST_LABEL.na_cekanju },
  { id: 'potvrdjen', label: REQUEST_LABEL.potvrdjen },
  { id: 'odbijen', label: REQUEST_LABEL.odbijen },
  { id: 'svi', label: 'Svi' },
];

function RequestsInner() {
  const { state, rejectRequest } = useDemo();
  const L = lookup(state);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const highlight = params.get('istakni');
  const highlighted = highlight ? L.request(highlight) : undefined;
  const status = (params.get('status') ?? (highlighted ? 'svi' : 'na_cekanju')) as 'svi' | RequestStatus;
  const [assign, setAssign] = useState<AssignTarget | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);

  useEffect(() => {
    if (highlight) document.getElementById(`zahtjev-${highlight}`)?.scrollIntoView({ block: 'center' });
  }, [highlight]);

  const list = state.requests.filter((r) => status === 'svi' || r.status === status).sort((a, b) => b.createdAt - a.createdAt);
  const count = (s: 'svi' | RequestStatus) => state.requests.filter((r) => s === 'svi' || r.status === s).length;

  return (
    <>
      <PageHeader title="Zahtjevi" subtitle="Zahtjevi za servis i prijave kvara iz primjera i iz prikaza kupca u ovoj probi." />

      <div role="tablist" aria-label="Status zahtjeva" className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const active = t.id === status;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => router.replace(`${pathname}?status=${t.id}`, { scroll: false })}
              className={cn(
                'inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold',
                active ? 'border-nav bg-nav text-white' : 'border-line-2 bg-surface text-ink-2 hover:text-ink',
              )}
            >
              {t.label}
              <span className={cn('rounded-full px-1.5 text-xs', active ? 'bg-white/20' : 'bg-bg')}>{count(t.id)}</span>
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <Card>
          <EmptyState title="Nema zahtjeva u ovoj grupi" action={<ButtonLink href="/demo/kupac/TP-001?forma=servis" variant="secondary">Simuliraj zahtjev kao kupac</ButtonLink>}>
            Novi zahtjev možete napraviti iz prikaza kupca (QR kartica).
          </EmptyState>
        </Card>
      ) : (
        <ul className="space-y-3">
          {list.map((r) => {
            const d = L.device(r.deviceId);
            const order = r.workOrderId ? L.workOrder(r.workOrderId) : undefined;
            return (
              <li key={r.id} id={`zahtjev-${r.id}`}>
                <Card className={cn('p-4 sm:p-5', r.id === highlight && 'ring-2 ring-primary')}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={r.kind === 'kvar' ? 'danger' : 'info'}>{r.kind === 'kvar' ? 'Prijava kvara' : 'Zahtjev za servis'}</Badge>
                        <RequestBadge status={r.status} />
                        {r.fromSimulation ? <Badge tone="demo" icon={false}>Simulirano u prikazu kupca</Badge> : null}
                      </div>
                      <h2 className="mt-2 text-base font-semibold">
                        {r.id} ·{' '}
                        {d ? (
                          <Link href={`/demo/uredaji/${d.id}`} className="text-primary hover:underline">
                            {deviceTitle(state, d)}
                          </Link>
                        ) : (
                          r.deviceId
                        )}
                      </h2>
                      <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="inline text-ink-3">Podnosilac: </dt>
                          <dd className="inline">{r.name}</dd>
                        </div>
                        <div>
                          <dt className="inline text-ink-3">Kontakt: </dt>
                          <dd className="inline break-all">{r.contact}</dd>
                        </div>
                        <div>
                          <dt className="inline text-ink-3">Primljeno u primjeru: </dt>
                          <dd className="inline">{formatDateTime(r.createdAt)}</dd>
                        </div>
                        {r.preferredDate ? (
                          <div>
                            <dt className="inline text-ink-3">Željeni termin: </dt>
                            <dd className="inline">
                              {formatLong(r.preferredDate)} · {r.preferredSlot}
                            </dd>
                          </div>
                        ) : null}
                        {r.errorCode ? (
                          <div>
                            <dt className="inline text-ink-3">Kod greške: </dt>
                            <dd className="inline font-mono">{r.errorCode}</dd>
                          </div>
                        ) : null}
                      </dl>
                      {r.note ? <p className="mt-2 rounded-lg bg-bg px-3 py-2 text-sm">{r.note}</p> : null}
                      {r.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.photo.dataUrl} alt={`Fotografija uz ${r.id} (lokalni pregled)`} className="mt-2 size-28 rounded-lg border border-line object-cover" />
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-2 md:w-56">
                      {r.status === 'na_cekanju' ? (
                        <>
                          <Button onClick={() => setAssign({ mode: 'request', requestId: r.id })}>Potvrdi i dodijeli servisera</Button>
                          <Button variant="danger" onClick={() => setRejecting(r.id)}>
                            Odbij u demou
                          </Button>
                        </>
                      ) : order ? (
                        <ButtonLink href={`/demo/nalozi/${order.id}`} variant="secondary">
                          Otvori nalog {order.id}
                        </ButtonLink>
                      ) : null}
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <AssignModal target={assign} onClose={() => setAssign(null)} />
      <Modal
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        title={`Odbiti zahtjev ${rejecting ?? ''} u demou?`}
        description="Kupac neće dobiti nikakvu poruku — ovo je samo prikaz statusa."
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejecting(null)}>
              Odustani
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (rejecting) rejectRequest(rejecting);
                setRejecting(null);
                toast({ title: DEMO_CHANGE, body: 'Zahtjev je označen kao „Odbijen u demou”.' });
              }}
            >
              Odbij u demou
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-2">U stvarnoj verziji firma bi ovdje mogla upisati razlog i predložiti drugi termin.</p>
      </Modal>
    </>
  );
}

export default function RequestsPage() {
  return (
    <Suspense>
      <RequestsInner />
    </Suspense>
  );
}
