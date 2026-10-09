'use client';

import { ProposalModal } from '@/components/proposal-modal';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, CalendarClock, ClipboardList, Inbox } from 'lucide-react';
import { useState } from 'react';

import { AssignModal, type AssignTarget } from '@/components/assign-modal';
import { GuideInline } from '@/components/guide';
import { DueBadge, OrderBadge, RequestBadge } from '@/components/status';
import { Badge, ButtonLink, Card, CardHeader, EmptyState, PageHeader, Button, buttonClass } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatDateTime, formatShort, relativeDays } from '@/lib/dates';
import { deviceTitle, endTime, kpis, lookup, orderTitle, sortOrders } from '@/lib/derive';
import { useDemo } from '@/lib/store';

export default function OwnerDashboard() {
  const { state } = useDemo();
  const L = lookup(state);
  const k = kpis(state);
  const today = state.anchor;
  const [assign, setAssign] = useState<AssignTarget | null>(null);
  const [proposalFor, setProposalFor] = useState<string | null>(null);

  const cards = [
    { label: 'Zakasneli servisi', value: k.overdue.length, hint: 'Uređaji kojima je prošao rok', href: '/demo/uredaji?status=zakasnio', icon: AlertTriangle, tone: 'text-danger bg-danger-soft' },
    { label: 'Narednih 7 dana', value: k.next7.length, hint: 'Rok servisa ove sedmice', href: '/demo/uredaji?status=sedam', icon: CalendarClock, tone: 'text-warn bg-warn-soft' },
    { label: 'Novi demo zahtjevi', value: k.newRequests.length, hint: 'Čekaju potvrdu ili odbijanje', href: '/demo/zahtjevi?status=na_cekanju', icon: Inbox, tone: 'text-primary bg-primary-soft' },
    { label: 'Otvoreni demo nalozi', value: k.openOrders.length, hint: 'Planirani i u radu', href: '/demo/nalozi?status=otvoreni', icon: ClipboardList, tone: 'text-ok bg-ok-soft' },
  ];

  const unassigned = state.workOrders.filter((w) => w.status === 'planiran' && !w.technicianId).sort(sortOrders);
  const overdueSorted = [...k.overdue].sort((a, b) => (a.nextServiceOn < b.nextServiceOn ? -1 : 1));
  const todayOrders = state.workOrders.filter((w) => w.date === today && w.status !== 'otkazan').sort(sortOrders);

  return (
    <>
      <PageHeader
        title="Pregled servisa"
        subtitle="Primjer obaveza i rasporeda vaše firme."
        actions={
          <>
            <ButtonLink href="/demo/plan" variant="secondary">
              Plan servisa
            </ButtonLink>
            <ButtonLink href="/demo/uredaji/TP-001">Otvori uređaj TP-001</ButtonLink>
          </>
        }
      />

      <GuideInline />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4" data-testid="kpis">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} href={c.href} className="group rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-colors hover:border-primary/40 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-ink-2">{c.label}</p>
                <span className={cn('inline-flex size-8 shrink-0 items-center justify-center rounded-lg', c.tone)} aria-hidden>
                  <Icon className="size-[18px]" />
                </span>
              </div>
              <p className="mt-2 text-3xl font-bold tracking-tight text-ink">{c.value}</p>
              <p className="mt-1 flex items-center gap-1 text-[13px] text-ink-3">
                <span className="min-w-0">{c.hint}</span>
                <ArrowRight className="ml-auto size-4 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-5 grid gap-5 lg:mt-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card aria-labelledby="paznja">
          <CardHeader id="paznja" title="Potrebna pažnja" subtitle="Novi zahtjevi, nalozi bez servisera i uređaji kojima je prošao rok." />
          <ul className="divide-y divide-line">
            {[...k.newRequests].sort((a, b) => Number(b.urgent) - Number(a.urgent) || b.createdAt - a.createdAt).map((r) => {
              const d = L.device(r.deviceId);
              return (
                <li key={r.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={r.kind === 'kvar' ? 'danger' : 'info'}>{r.kind === 'kvar' ? 'Prijava kvara' : 'Zahtjev za servis'}</Badge>
                      <RequestBadge status={r.status} />
                      {r.urgent ? <Badge tone="danger">Uređaj ne radi</Badge> : null}
                      {r.fromSimulation ? <Badge tone="demo" icon={false}>iz prikaza kupca</Badge> : null}
                    </div>
                    <p className="mt-1.5 font-semibold">
                      {r.id} · {d ? deviceTitle(state, d) : r.deviceId}
                    </p>
                    <p className="text-sm text-ink-2">
                      {r.symptom ? `${r.symptom} · ` : ''}
                      {r.name} · {formatDateTime(r.createdAt)}
                    </p>
                  </div>
                  <ButtonLink href={`/demo/zahtjevi?istakni=${r.id}`} variant="secondary" size="sm" className="self-start sm:self-center">
                    Pogledaj zahtjev
                  </ButtonLink>
                </li>
              );
            })}
            {unassigned.map((w) => {
              return (
                <li key={w.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="warn">Bez servisera</Badge>
                      <OrderBadge status={w.status} />
                    </div>
                    <p className="mt-1.5 font-semibold">
                      {w.id} · {orderTitle(state, w)}
                    </p>
                    <p className="text-sm text-ink-2">
                      {formatShort(w.date)} u {w.start} · {relativeDays(w.date, today)}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => setAssign({ mode: 'order', orderId: w.id })} className="self-start sm:self-center">
                    Dodijeli servisera
                  </Button>
                </li>
              );
            })}
            {overdueSorted.map((d) => {
              const loc = L.deviceLocation(d);
              return (
                <li key={d.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
                  <div className="min-w-0 flex-1">
                    <DueBadge device={d} today={today} />
                    <p className="mt-1.5 font-semibold">{deviceTitle(state, d)}</p>
                    <p className="text-sm text-ink-2">
                      {d.typeLabel} · {loc?.city} · rok bio {formatShort(d.nextServiceOn)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 self-start sm:self-center">
                    <Button size="sm" variant="secondary" onClick={() => setProposalFor(d.id)}>
                      Prijedlog termina
                    </Button>
                    <ButtonLink href={`/demo/uredaji/${d.id}`} variant="secondary" size="sm">
                      Otvori uređaj
                    </ButtonLink>
                  </div>
                </li>
              );
            })}
            {k.newRequests.length + unassigned.length + overdueSorted.length === 0 ? (
              <li>
                <EmptyState title="Ništa ne čeka">U ovom primjeru trenutno nema otvorenih stavki.</EmptyState>
              </li>
            ) : null}
          </ul>
        </Card>

        <div className="space-y-5">
          <Card aria-labelledby="danas">
            <CardHeader id="danas" title="Današnji raspored" subtitle={formatShort(today)} action={<Link href="/demo/raspored" className="text-sm font-semibold text-primary hover:underline">Sedmica</Link>} />
            <div className="divide-y divide-line">
              {state.technicians.map((t) => {
                const orders = todayOrders.filter((w) => w.technicianId === t.id);
                return (
                  <div key={t.id} className="px-4 py-3 sm:px-5">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <span className="inline-flex size-7 items-center justify-center rounded-full bg-nav text-[11px] font-bold text-white" aria-hidden>
                        {t.initials}
                      </span>
                      {t.name}
                    </p>
                    {orders.length === 0 ? (
                      <p className="mt-2 text-sm text-ink-3">Nema naloga danas.</p>
                    ) : (
                      <ul className="mt-2 space-y-1.5">
                        {orders.map((w) => {
                          return (
                            <li key={w.id}>
                              <Link href={`/demo/nalozi/${w.id}`} className="flex items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-bg">
                                <span className="w-[100px] shrink-0 text-sm font-semibold whitespace-nowrap tabular-nums">
                                  {w.start}–{endTime(w)}
                                </span>
                                <span className="min-w-0 flex-1 text-sm">
                                  <span className="block font-medium">{orderTitle(state, w)}</span>
                                  <span className="mt-0.5 block">
                                    <OrderBadge status={w.status} />
                                  </span>
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card aria-labelledby="aktivnosti">
            <CardHeader id="aktivnosti" title="Posljednje aktivnosti" subtitle="Promjene u ovoj probnoj verziji." />
            <ul className="divide-y divide-line">
              {state.activity.slice(0, 6).map((a) => (
                <li key={a.id} className="px-4 py-3 sm:px-5">
                  {a.href ? (
                    <Link href={a.href} className="text-sm font-medium text-ink hover:text-primary hover:underline">
                      {a.text}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium">{a.text}</p>
                  )}
                  <p className="text-xs text-ink-3">{formatDateTime(a.at)}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div className="mt-5">
        <Link href="/demo/poruke" className={buttonClass('ghost', 'sm', 'text-primary')}>
          Pogledaj primjere poruka kupcima →
        </Link>
      </div>

      <AssignModal target={assign} onClose={() => setAssign(null)} />
      <ProposalModal deviceId={proposalFor} onClose={() => setProposalFor(null)} />
    </>
  );
}
