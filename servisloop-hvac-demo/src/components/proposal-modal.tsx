'use client';

import Link from 'next/link';
import { ExternalLink, Mail, MessageSquare, RefreshCw } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';

import { cn } from '@/lib/cn';
import { addDays, formatLong, relativeDays } from '@/lib/dates';
import { findCollision, hasOpenOrder, isActive, lookup, suggestSlots } from '@/lib/derive';
import { proposalMessage } from '@/lib/proposal-text';
import { customerPath, siteOrigin } from '@/lib/qr';
import { useDemo } from '@/lib/store';
import type { ProposalSlot } from '@/lib/types';

import { useToast } from './toast';
import { Button, Modal, Notice, buttonClass, inputClass } from './ui';

const TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];

/** Vlasnik šalje kupcu prijedlog termina (e-mail ili SMS) — u demou se ništa ne šalje. */
export function ProposalModal({ deviceId, onClose }: { deviceId: string | null; onClose: () => void }) {
  const { state, sendProposal } = useDemo();
  const toast = useToast();
  const uid = useId();
  const L = lookup(state);
  const device = deviceId ? L.device(deviceId) : undefined;
  const loc = device ? L.deviceLocation(device) : undefined;
  const cust = device ? L.deviceCustomer(device) : undefined;
  const today = state.anchor;

  const candidates = useMemo(
    () =>
      device
        ? state.devices.filter((d) => d.locationId === device.locationId && isActive(d) && (d.id === device.id || (d.nextServiceOn <= addDays(today, 60) && !hasOpenOrder(state, d.id))))
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deviceId],
  );

  const [ids, setIds] = useState<string[]>([]);
  const [channel, setChannel] = useState<'email' | 'sms'>('email');
  const [slots, setSlots] = useState<ProposalSlot[]>([]);
  const [sentId, setSentId] = useState<string | null>(null);

  const duration = Math.min(180, 60 + 30 * Math.max(1, ids.length));

  useEffect(() => {
    if (!device) return;
    const pre = candidates.map((d) => d.id);
    setIds(pre);
    setChannel('email');
    setSentId(null);
    const from = addDays(today, 2);
    setSlots(suggestSlots(state, from, 3, Math.min(180, 60 + 30 * pre.length)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  if (!device || !loc) return <Modal open={false} onClose={onClose} title="">{null}</Modal>;

  const dueOn = ids
    .map((id) => state.devices.find((d) => d.id === id)!.nextServiceOn)
    .sort()[0] ?? device.nextServiceOn;
  const link = sentId ? `${siteOrigin()}${customerPath(device.id)}?prijedlog=${sentId}` : `${siteOrigin()}${customerPath(device.id)}?prijedlog=…`;
  const message = proposalMessage(state, { deviceIds: ids, dueOn, slots, channel, durationMin: duration, locationId: loc.id }, link);
  const clash = slots.map((s) => findCollision(state, s.technicianId, s.date, s.start, duration));

  const setSlot = (i: number, patch: Partial<ProposalSlot>) => setSlots((all) => all.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  function send() {
    const id = sendProposal({ locationId: loc!.id, deviceIds: ids, dueOn, channel, slots, durationMin: duration });
    setSentId(id);
    toast({ title: 'Primjer poruke — nije poslano.', body: `Prijedlog ${id} je zabilježen u ovoj probi.` });
  }

  return (
    <Modal
      open={Boolean(deviceId)}
      onClose={onClose}
      wide
      title={sentId ? 'Prijedlog termina je pripremljen' : 'Pošalji kupcu prijedlog termina'}
      description={`${cust?.name} · ${loc.name}`}
      footer={
        sentId ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              Zatvori
            </Button>
            <Link href={`${customerPath(device.id)}?prijedlog=${sentId}`} className={buttonClass('primary')}>
              <ExternalLink aria-hidden /> Otvori link iz poruke (kako kupac vidi)
            </Link>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Odustani
            </Button>
            <Button onClick={send} disabled={ids.length === 0 || slots.length === 0 || clash.some(Boolean)}>
              Simuliraj slanje prijedloga
            </Button>
          </>
        )
      }
    >
      {sentId ? (
        <div className="space-y-4" data-testid="proposal-sent">
          <Notice tone="ok" title="Primjer poruke — nije poslano.">
            Prijedlog {sentId} je zabilježen u ovoj probi. Kupcu ništa nije poslano. Kako bi kupac odgovorio, pogledajte preko linka iz poruke.
          </Notice>
          <MessagePreview channel={channel} subject={message.subject} body={message.body} to={channel === 'email' ? cust?.email : cust?.phone} />
        </div>
      ) : (
        <div className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Uređaji za ovaj termin</legend>
            <ul className="space-y-1">
              {candidates.map((d) => (
                <li key={d.id}>
                  <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={ids.includes(d.id)}
                      disabled={d.id === device.id}
                      onChange={(e) => setIds((x) => (e.target.checked ? [...x, d.id] : x.filter((y) => y !== d.id)))}
                      className="size-5 accent-[var(--color-primary)]"
                    />
                    <span>
                      <span className="font-semibold">{d.id}</span> · {d.name} <span className="text-ink-3">· rok {formatLong(d.nextServiceOn)} ({relativeDays(d.nextServiceOn, today)})</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Kanal</legend>
            <div className="grid grid-cols-2 gap-2">
              {(['email', 'sms'] as const).map((c) => (
                <label key={c} className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-line-2 px-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                  <input type="radio" name={`${uid}-ch`} checked={channel === c} onChange={() => setChannel(c)} className="size-5 accent-[var(--color-primary)]" />
                  {c === 'email' ? <Mail className="size-[18px] text-ink-2" aria-hidden /> : <MessageSquare className="size-[18px] text-ink-2" aria-hidden />}
                  <span className="min-w-0 text-sm">
                    <span className="block font-medium">{c === 'email' ? 'E-mail' : 'SMS'}</span>
                    <span className="block truncate text-[12px] text-ink-3">{c === 'email' ? cust?.email : cust?.phone}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1 flex w-full items-center justify-between text-sm font-semibold">
              Predloženi termini (slobodni u rasporedu)
            </legend>
            <ul className="space-y-2">
              {slots.map((s, i) => (
                <li key={i} className={cn('rounded-xl border p-2', clash[i] ? 'border-warn/40 bg-warn-soft' : 'border-line')}>
                  <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-2 sm:grid-cols-[minmax(0,1fr)_110px_minmax(0,1fr)] sm:items-center">
                    <label className="sr-only" htmlFor={`${uid}-d${i}`}>
                      Datum termina {i + 1}
                    </label>
                    <input id={`${uid}-d${i}`} type="date" min={today} value={s.date} onChange={(e) => e.target.value && setSlot(i, { date: e.target.value })} className={inputClass()} />
                    <label className="sr-only" htmlFor={`${uid}-t${i}`}>
                      Vrijeme termina {i + 1}
                    </label>
                    <select id={`${uid}-t${i}`} value={s.start} onChange={(e) => setSlot(i, { start: e.target.value })} className={inputClass()}>
                      {TIMES.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                    <p className="col-span-2 text-[13px] text-ink-2 sm:col-span-1">{L.technician(s.technicianId)?.name}</p>
                  </div>
                  {clash[i] ? <p className="mt-1 text-[13px] font-medium text-warn">Zauzeto u primjeru ({clash[i]!.order.id}). Promijenite vrijeme.</p> : null}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-2 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-primary"
              onClick={() => setSlots(suggestSlots(state, addDays(today, 2), 3, duration))}
            >
              <RefreshCw className="size-4" aria-hidden /> Ponovo predloži slobodne termine
            </button>
          </fieldset>

          <div>
            <p className="mb-2 text-sm font-semibold">Pregled poruke</p>
            <MessagePreview channel={channel} subject={message.subject} body={message.body} to={channel === 'email' ? cust?.email : cust?.phone} />
          </div>
          <p className="text-[13px] text-ink-3">
            U stvarnoj verziji sistem može automatski poslati prijedlog npr. 14 dana prije roka (DEMO postavka). Ovdje se poruka samo prikazuje.
          </p>
        </div>
      )}
    </Modal>
  );
}

export function MessagePreview({ channel, subject, body, to }: { channel: 'email' | 'sms'; subject: string; body: string; to?: string }) {
  return (
    <div className="rounded-xl border border-line bg-bg p-3 text-sm" data-testid="message-preview">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] text-ink-2">
          {channel === 'email' ? 'E-mail' : 'SMS'} · Za: {to}
        </span>
        <span className="rounded-md border border-demo/30 bg-demo-soft px-2 py-0.5 text-[11px] font-bold tracking-wide text-demo">PRIMJER — NIJE POSLANO</span>
      </div>
      {subject ? <p className="font-semibold">{subject}</p> : null}
      <p className="mt-1 whitespace-pre-wrap break-words">{body}</p>
    </div>
  );
}
