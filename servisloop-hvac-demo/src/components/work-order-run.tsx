'use client';

import Link from 'next/link';
import { CheckCircle2, FileText, MapPin, Play, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';

import { ANSWER_LABEL, checklistGaps, hasGaps } from '@/lib/checklists';
import { cn } from '@/lib/cn';
import { formatLong } from '@/lib/dates';
import { deviceTitle, endTime, lookup } from '@/lib/derive';
import { useDemo } from '@/lib/store';
import type { CheckAnswer, WorkOrder } from '@/lib/types';

import { PhotoPicker } from './photo-picker';
import { OrderBadge } from './status';
import { DEMO_CHANGE, useToast } from './toast';
import { Button, ButtonLink, Card, DemoTag, Field, Notice, inputClass, buttonClass } from './ui';

const ANSWERS: CheckAnswer[] = ['uredno', 'paznja', 'np'];
const ANSWER_STYLE: Record<CheckAnswer, string> = {
  uredno: 'peer-checked:border-ok peer-checked:bg-ok-soft peer-checked:text-ok',
  paznja: 'peer-checked:border-warn peer-checked:bg-warn-soft peer-checked:text-warn',
  np: 'peer-checked:border-ink-2 peer-checked:bg-bg peer-checked:text-ink',
};

export function WorkOrderHeader({ order }: { order: WorkOrder }) {
  const { state } = useDemo();
  const L = lookup(state);
  const d = L.device(order.deviceId);
  const loc = d ? L.deviceLocation(d) : undefined;
  const cust = d ? L.deviceCustomer(d) : undefined;
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <OrderBadge status={order.status} />
        <DemoTag>Demo nalog</DemoTag>
        <span className="text-sm text-ink-2">{order.id}</span>
      </div>
      <h1 className="mt-2 text-xl leading-snug font-bold">{d ? deviceTitle(state, d) : order.deviceId}</h1>
      <p className="text-ink-2">
        {d?.typeLabel} · {d?.name}
      </p>
      <p className="mt-2 text-[15px] font-semibold tabular-nums">
        {formatLong(order.date)} · {order.start}–{endTime(order)}
      </p>
      <p className="mt-2 flex items-start gap-2 text-sm text-ink-2">
        <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          {cust?.name} · {loc?.address}, {loc?.city}
        </span>
      </p>
      <div className="mt-3 rounded-lg bg-bg px-3 py-2 text-sm">
        <span className="font-semibold">Razlog dolaska: </span>
        {order.category} — {order.reason}
      </div>
    </Card>
  );
}

export function WorkOrderRun({ order }: { order: WorkOrder }) {
  const { state, updateOrder, completeOrder } = useDemo();
  const toast = useToast();
  const uid = useId();
  const [showGaps, setShowGaps] = useState(false);
  const L = lookup(state);
  const device = L.device(order.deviceId);

  const gaps = checklistGaps(order.checklist, order.recommendation);
  const incomplete = hasGaps(gaps);

  function setItem(id: string, patch: { answer?: CheckAnswer; note?: string }) {
    updateOrder(order.id, { checklist: order.checklist.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  }

  function finish(force = false) {
    if (incomplete && !force) {
      setShowGaps(true);
      setTimeout(() => document.getElementById(`${uid}-gaps`)?.focus(), 0);
      return;
    }
    completeOrder(order.id);
    toast({ title: 'Demo nalog je završen u ovom primjeru.', body: DEMO_CHANGE });
    window.scrollTo({ top: 0 });
  }

  if (order.status === 'otkazan') {
    return (
      <div className="space-y-4">
        <WorkOrderHeader order={order} />
        <Notice tone="neutral">Ovaj demo nalog je otkazan.</Notice>
      </div>
    );
  }

  if (order.status === 'zavrsen') {
    return (
      <div className="space-y-4">
        <Card className="p-5 text-center" data-testid="order-completed">
          <CheckCircle2 className="mx-auto size-10 text-ok" aria-hidden />
          <p className="mt-2 text-lg font-bold" role="status">
            Demo nalog je završen u ovom primjeru.
          </p>
          <p className="mt-1 text-sm text-ink-2">Sljedeći servis u primjeru: {order.nextServiceOn ? formatLong(order.nextServiceOn) : '—'}</p>
          <ButtonLink href={`/demo/izvjestaji/${order.id}`} size="lg" className="mt-4 w-full sm:w-auto">
            <FileText aria-hidden /> Pogledaj primjer izvještaja
          </ButtonLink>
        </Card>
        <WorkOrderHeader order={order} />
      </div>
    );
  }

  if (order.status === 'planiran') {
    return (
      <div className="space-y-4 pb-24">
        <WorkOrderHeader order={order} />
        <Notice tone="demo">Pokretanjem se otvara kontrolna lista. Ništa se ne bilježi izvan ove probe.</Notice>
        {!order.technicianId ? <Notice tone="warn">Nalogu još nije dodijeljen serviser. U demou ga ipak možete pokrenuti.</Notice> : null}
        <StickyBar>
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              updateOrder(order.id, { status: 'u_radu' });
              toast({ title: 'Demo nalog je pokrenut.', body: DEMO_CHANGE });
            }}
          >
            <Play aria-hidden /> Pokreni demo nalog
          </Button>
        </StickyBar>
      </div>
    );
  }

  // u_radu
  return (
    <div className="space-y-4 pb-28">
      <WorkOrderHeader order={order} />

      <Card className="p-4">
        <h2 className="text-base font-semibold">Kontrolna lista — {device?.kind === 'pumpa' ? 'toplotna pumpa' : 'klima'}</h2>
        <p className="mt-1 text-sm text-ink-2">Servisni obrazac i intervale u stvarnoj verziji potvrđuje firma.</p>
        <ol className="mt-4 space-y-4">
          {order.checklist.map((item, idx) => (
            <li key={item.id} className="rounded-xl border border-line p-3">
              <fieldset>
                <legend className="text-[15px] font-semibold">
                  {idx + 1}. {item.label}
                </legend>
                <p className="text-[13px] text-ink-2">{item.hint}</p>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {ANSWERS.map((a) => (
                    <label key={a} className="relative">
                      <input
                        type="radio"
                        name={`${uid}-${item.id}`}
                        className="peer sr-only"
                        checked={item.answer === a}
                        onChange={() => setItem(item.id, { answer: a })}
                      />
                      <span
                        className={cn(
                          'flex min-h-12 cursor-pointer items-center justify-center rounded-[10px] border border-line-2 px-1 text-center text-[13px] leading-tight font-semibold text-ink-2 peer-focus-visible:outline-2 peer-focus-visible:outline-primary sm:text-sm',
                          ANSWER_STYLE[a],
                        )}
                      >
                        {ANSWER_LABEL[a]}
                      </span>
                    </label>
                  ))}
                </div>
                <label htmlFor={`${uid}-${item.id}-note`} className="sr-only">
                  Napomena za {item.label}
                </label>
                <textarea
                  id={`${uid}-${item.id}-note`}
                  rows={item.answer === 'paznja' ? 2 : 1}
                  placeholder={item.answer === 'paznja' ? 'Opišite šta treba pažnju (obavezno)' : 'Napomena (opcionalno)'}
                  value={item.note}
                  onChange={(e) => setItem(item.id, { note: e.target.value })}
                  className={cn(inputClass(item.answer === 'paznja' && !item.note.trim() && showGaps), 'mt-2 min-h-11')}
                  maxLength={500}
                />
              </fieldset>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="space-y-4 p-4">
        <h2 className="text-base font-semibold">Bilješke i rad</h2>
        <Field label="Bilješka servisera" htmlFor={`${uid}-notes`}>
          <textarea id={`${uid}-notes`} rows={4} value={order.notes} onChange={(e) => updateOrder(order.id, { notes: e.target.value })} className={inputClass()} maxLength={2000} />
        </Field>
        <div className="space-y-2">
          {order.photos.map((p, i) => (
            <div key={`${p.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-line-2 bg-bg p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.dataUrl} alt={`Lokalni pregled: ${p.name}`} className="size-16 rounded-lg object-cover" />
              <p className="min-w-0 flex-1 text-sm break-all">{p.name}</p>
              <Button variant="danger" size="sm" onClick={() => updateOrder(order.id, { photos: order.photos.filter((_, j) => j !== i) })} aria-label={`Ukloni fotografiju ${p.name}`}>
                <Trash2 aria-hidden /> Ukloni
              </Button>
            </div>
          ))}
          {order.photos.length < 3 ? (
            <PhotoPicker label={order.photos.length ? 'Još jedna fotografija' : 'Fotografija'} photo={null} onChange={(p) => p && updateOrder(order.id, { photos: [...order.photos, p] })} />
          ) : (
            <p className="text-[13px] text-ink-3">U demou su dovoljne tri fotografije po nalogu.</p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Utrošeno vrijeme (minuta)" htmlFor={`${uid}-time`} hint="Primjer evidentiranja.">
            <input
              id={`${uid}-time`}
              type="number"
              inputMode="numeric"
              min={0}
              max={600}
              value={order.timeSpentMin ?? ''}
              onChange={(e) => updateOrder(order.id, { timeSpentMin: e.target.value === '' ? null : Math.max(0, Math.min(600, Number(e.target.value))) })}
              className={inputClass()}
            />
          </Field>
          <Field label="Utrošeni materijal" htmlFor={`${uid}-mat`} hint="Primjer stavke, bez cijena.">
            <input id={`${uid}-mat`} value={order.materials} onChange={(e) => updateOrder(order.id, { materials: e.target.value })} className={inputClass()} maxLength={200} />
          </Field>
        </div>
        <Field label="Preporuka kupcu" htmlFor={`${uid}-rec`} required error={showGaps && gaps.missingRecommendation ? 'Upišite kratku preporuku za izvještaj.' : null}>
          <textarea
            id={`${uid}-rec`}
            rows={3}
            value={order.recommendation}
            onChange={(e) => updateOrder(order.id, { recommendation: e.target.value })}
            className={inputClass(showGaps && gaps.missingRecommendation)}
            maxLength={600}
          />
        </Field>
        <Field label="Potvrda kupca — ilustrativna rubrika" htmlFor={`${uid}-ack`} hint="Primjer: ime osobe koja je bila prisutna. Nije pravni potpis.">
          <input id={`${uid}-ack`} value={order.customerAck} onChange={(e) => updateOrder(order.id, { customerAck: e.target.value })} className={inputClass()} maxLength={80} />
        </Field>
      </Card>

      {showGaps && incomplete ? (
        <div id={`${uid}-gaps`} tabIndex={-1} className="rounded-xl border border-warn/30 bg-warn-soft p-4 text-sm" role="alert">
          <p className="font-semibold text-warn">U demo obrascu nedostaje:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {gaps.unanswered.map((l) => (
              <li key={l}>Odgovor za „{l}”</li>
            ))}
            {gaps.attentionWithoutNote.map((l) => (
              <li key={l}>Napomena uz „Potrebna pažnja” za „{l}”</li>
            ))}
            {gaps.missingRecommendation ? <li>Preporuka kupcu</li> : null}
          </ul>
          <p className="mt-2 text-ink-2">U stvarnoj verziji firma određuje koje stavke su obavezne. U demou možete nastaviti.</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => finish(true)}>
            Ipak završi demo nalog
          </Button>
        </div>
      ) : null}

      <StickyBar>
        <Button size="lg" className="w-full" onClick={() => finish(false)}>
          <CheckCircle2 aria-hidden /> Završi demo nalog
        </Button>
      </StickyBar>
    </div>
  );
}

function StickyBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="no-print fixed inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom))] z-30 border-t border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto max-w-3xl px-4 py-3">{children}</div>
    </div>
  );
}

export function OpenAsTechnicianLink({ orderId }: { orderId: string }) {
  return (
    <Link href={`/demo/serviser/nalog/${orderId}`} className={buttonClass('secondary')}>
      Otvori kao serviser
    </Link>
  );
}
