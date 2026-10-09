'use client';

import Link from 'next/link';
import { CalendarClock, ExternalLink, PackagePlus, Printer, Send } from 'lucide-react';
import { useState } from 'react';

import { InstallModal } from '@/components/install-modal';
import { ProposalModal } from '@/components/proposal-modal';
import { DueBadge, OrderBadge } from '@/components/status';
import { Badge, Button, Card, CardHeader, EmptyState, PageHeader, buttonClass, type Tone } from '@/components/ui';
import { formatDateTime, formatLong, formatShort, relativeDays } from '@/lib/dates';
import { dueSoon, hasOpenOrder, lookup } from '@/lib/derive';
import { slotLabel } from '@/lib/proposal-text';
import { customerPath } from '@/lib/qr';
import { useDemo } from '@/lib/store';
import type { Proposal } from '@/lib/types';

const PROPOSAL_LABEL: Record<Proposal['status'], { text: string; tone: Tone }> = {
  poslan: { text: 'Čeka odgovor kupca', tone: 'warn' },
  prihvacen: { text: 'Kupac je odabrao termin', tone: 'ok' },
  odbijen: { text: 'Kupac je odbio termin', tone: 'danger' },
  odgoden: { text: 'Kupac traži kasniji podsjetnik', tone: 'neutral' },
};

export default function PlanPage() {
  const { state } = useDemo();
  const L = lookup(state);
  const today = state.anchor;
  const [proposalFor, setProposalFor] = useState<string | null>(null);
  const [installOpen, setInstallOpen] = useState(false);

  const latestProposal = (deviceId: string) => state.proposals.filter((p) => p.deviceIds.includes(deviceId)).sort((a, b) => b.sentAt - a.sentAt)[0];
  const due = dueSoon(state, 30);
  const toArrange = due.filter((d) => !hasOpenOrder(state, d.id));
  const arranged = due.filter((d) => hasOpenOrder(state, d.id));
  const installs = state.devices.filter((d) => d.status === 'ugradnja');

  return (
    <>
      <PageHeader
        title="Plan servisa"
        subtitle="Rokovi se računaju automatski iz datuma ugradnje ili posljednjeg servisa i intervala uređaja."
        actions={
          <Button onClick={() => setInstallOpen(true)}>
            <PackagePlus aria-hidden /> Nova ugradnja
          </Button>
        }
      />

      <Card className="mb-5" aria-labelledby="ugovoriti">
        <CardHeader
          id="ugovoriti"
          title={`Za ugovaranje (${toArrange.length})`}
          subtitle="Rok je prošao ili ističe u narednih 30 dana, a termin još nije dogovoren."
        />
        {toArrange.length === 0 ? (
          <EmptyState title="Svi bliski rokovi su ugovoreni" />
        ) : (
          <ul className="divide-y divide-line">
            {toArrange.map((d) => {
              const loc = L.deviceLocation(d);
              const cust = L.deviceCustomer(d);
              const p = latestProposal(d.id);
              return (
                <li key={d.id} className="flex flex-col gap-3 px-4 py-3.5 sm:px-5 md:flex-row md:items-center" data-testid={`plan-${d.id}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <DueBadge device={d} today={today} />
                      {p ? <Badge tone={PROPOSAL_LABEL[p.status].tone}>{PROPOSAL_LABEL[p.status].text}</Badge> : <Badge tone="neutral">Prijedlog nije poslan</Badge>}
                    </div>
                    <p className="mt-1.5 font-semibold">
                      <Link href={`/demo/uredaji/${d.id}`} className="hover:text-primary hover:underline">
                        {d.id} · {d.name}
                      </Link>
                    </p>
                    <p className="text-sm text-ink-2">
                      {cust?.name} · {loc?.name} · rok {formatShort(d.nextServiceOn)} ({relativeDays(d.nextServiceOn, today)})
                    </p>
                    {p && p.status !== 'prihvacen' ? (
                      <p className="mt-1 text-[13px] text-ink-2">
                        {p.id} · {p.channel === 'email' ? 'e-mail' : 'SMS'} · {formatDateTime(p.sentAt)}
                        {p.reason ? ` · razlog: „${p.reason}”` : ''}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {p?.status === 'poslan' ? (
                      <Link href={`${customerPath(d.id)}?prijedlog=${p.id}`} className={buttonClass('secondary', 'sm')}>
                        <ExternalLink aria-hidden /> Link iz poruke
                      </Link>
                    ) : null}
                    <Button size="sm" variant={p?.status === 'poslan' ? 'secondary' : 'primary'} onClick={() => setProposalFor(d.id)}>
                      <Send aria-hidden /> {p ? 'Pošalji novi prijedlog' : 'Pošalji prijedlog termina'}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card aria-labelledby="odgovori">
          <CardHeader id="odgovori" title="Odgovori kupaca" subtitle="Prijedlozi termina poslani u ovoj probi i u primjeru." />
          {state.proposals.length === 0 ? (
            <EmptyState title="Nema prijedloga" />
          ) : (
            <ul className="divide-y divide-line">
              {[...state.proposals]
                .sort((a, b) => (b.respondedAt ?? b.sentAt) - (a.respondedAt ?? a.sentAt))
                .map((p) => {
                  const loc = L.location(p.locationId);
                  const order = p.workOrderId ? L.workOrder(p.workOrderId) : undefined;
                  return (
                    <li key={p.id} className="px-4 py-3 sm:px-5" data-testid={`proposal-${p.id}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={PROPOSAL_LABEL[p.status].tone}>{PROPOSAL_LABEL[p.status].text}</Badge>
                        <span className="text-sm text-ink-2">{p.id}</span>
                      </div>
                      <p className="mt-1 font-semibold">
                        {p.deviceIds.join(', ')} · {loc?.name}
                      </p>
                      {p.status === 'prihvacen' && p.chosen !== null && p.slots[p.chosen] ? (
                        <p className="text-sm">
                          {slotLabel(p.slots[p.chosen]!, p.durationMin)}
                          {order ? (
                            <>
                              {' · '}
                              <Link href={`/demo/nalozi/${order.id}`} className="font-semibold text-primary hover:underline">
                                {order.id}
                              </Link>
                            </>
                          ) : null}
                        </p>
                      ) : p.status === 'poslan' ? (
                        <p className="text-sm text-ink-2">Ponuđeno {p.slots.length} termina · rok {formatShort(p.dueOn)}</p>
                      ) : (
                        <p className="text-sm text-ink-2">Razlog: {p.reason || 'nije naveden'}</p>
                      )}
                    </li>
                  );
                })}
            </ul>
          )}
        </Card>

        <div className="space-y-5">
          <Card aria-labelledby="ugovoreno">
            <CardHeader id="ugovoreno" title={`Ugovoreno (${arranged.length})`} subtitle="Bliski rokovi koji već imaju nalog." />
            {arranged.length === 0 ? (
              <EmptyState title="Nema ugovorenih" />
            ) : (
              <ul className="divide-y divide-line">
                {arranged.map((d) => {
                  const w = hasOpenOrder(state, d.id)!;
                  return (
                    <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
                      <div>
                        <p className="font-semibold">
                          {d.id} · {L.deviceLocation(d)?.name}
                        </p>
                        <p className="text-sm text-ink-2">
                          {formatShort(w.date)} u {w.start} · {L.technician(w.technicianId)?.name ?? 'bez servisera'}
                        </p>
                      </div>
                      <Link href={`/demo/nalozi/${w.id}`} className="inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-primary">
                        {w.id} <OrderBadge status={w.status} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card aria-labelledby="ugradnje">
            <CardHeader
              id="ugradnje"
              title={`Planirane ugradnje (${installs.length})`}
              subtitle="Naljepnica ide u paket; prvi servis ulazi u plan kada serviser završi ugradnju."
              action={
                <Link href="/demo/naljepnice" className={buttonClass('secondary', 'sm')}>
                  <Printer aria-hidden /> Prazne naljepnice
                </Link>
              }
            />
            {installs.length === 0 ? (
              <EmptyState title="Nema planiranih ugradnji" action={<Button size="sm" onClick={() => setInstallOpen(true)}>Nova ugradnja</Button>} />
            ) : (
              <ul className="divide-y divide-line">
                {installs.map((d) => {
                  const w = hasOpenOrder(state, d.id);
                  return (
                    <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
                      <div>
                        <p className="font-semibold">
                          {d.id} · {d.name}
                        </p>
                        <p className="text-sm text-ink-2">
                          {L.deviceLocation(d)?.name} · {w ? `${formatLong(w.date)} u ${w.start}` : 'termin nije zakazan'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/demo/naljepnica/${d.id}`} className={buttonClass('secondary', 'sm')}>
                          <Printer aria-hidden /> Naljepnica
                        </Link>
                        {w ? (
                          <Link href={`/demo/nalozi/${w.id}`} className={buttonClass('ghost', 'sm')}>
                            {w.id}
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <div className="flex gap-3 rounded-xl border border-line bg-surface p-4 text-sm text-ink-2">
            <CalendarClock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <p>
              U stvarnoj verziji sistem može sam poslati prijedlog termina prije roka (npr. 14 dana — DEMO postavka) i podsjetnik ako kupac ne odgovori. Ovdje se prijedlozi šalju ručno i ništa se stvarno ne
              šalje.
            </p>
          </div>
        </div>
      </div>

      <ProposalModal deviceId={proposalFor} onClose={() => setProposalFor(null)} />
      <InstallModal open={installOpen} onClose={() => setInstallOpen(false)} />
    </>
  );
}
