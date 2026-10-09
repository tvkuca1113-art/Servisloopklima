'use client';

import { ArrowLeft, CheckCircle2, ChevronRight, FileText, Lock, MapPin, Play, QrCode, ScanLine, Trash2 } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

import { ANSWER_LABEL, checklistGaps, markAllOk } from '@/lib/checklists';
import { cn } from '@/lib/cn';
import { formatLong } from '@/lib/dates';
import { endTime, lookup } from '@/lib/derive';
import { useDemo } from '@/lib/store';
import type { CheckAnswer, OrderItem, WorkOrder } from '@/lib/types';

import { PhotoPicker } from './photo-picker';
import { ScanDialog } from './scan-dialog';
import { OrderBadge } from './status';
import { DEMO_CHANGE, useToast } from './toast';
import { Badge, Button, ButtonLink, Card, DemoTag, Field, Notice, inputClass } from './ui';

const ANSWERS: CheckAnswer[] = ['uredno', 'paznja', 'np'];
const ANSWER_STYLE: Record<CheckAnswer, string> = {
  uredno: 'peer-checked:border-ok peer-checked:bg-ok-soft peer-checked:text-ok',
  paznja: 'peer-checked:border-warn peer-checked:bg-warn-soft peer-checked:text-warn',
  np: 'peer-checked:border-ink-2 peer-checked:bg-bg peer-checked:text-ink',
};

const RECOMMENDATIONS = [
  'Nastaviti redovni servis prema dogovorenom intervalu.',
  'Preporučena dodatna provjera — firma kupcu šalje prijedlog termina.',
  'Kupcu objašnjeno održavanje između dva servisa.',
];

function timeOf(ts: number | null): string {
  if (!ts) return '';
  return new Intl.DateTimeFormat('bs-BA', { timeZone: 'Europe/Sarajevo', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(ts));
}

export function identificationLabel(item: OrderItem): string {
  if (item.identifiedBy === 'qr') return `QR skeniran u ${timeOf(item.identifiedAt)}`;
  if (item.identifiedBy === 'rucno') return `Ručni unos oznake u ${timeOf(item.identifiedAt)}`;
  return 'Nije identifikovan';
}

export function WorkOrderHeader({ order, compact = false }: { order: WorkOrder; compact?: boolean }) {
  const { state } = useDemo();
  const L = lookup(state);
  const loc = L.location(order.locationId);
  const cust = loc ? L.customer(loc.customerId) : undefined;
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <OrderBadge status={order.status} />
        <DemoTag>Demo nalog</DemoTag>
        <span className="text-sm text-ink-2">{order.id}</span>
      </div>
      <h1 className="mt-2 text-xl leading-snug font-bold">{loc?.name}</h1>
      <p className="flex items-start gap-1.5 text-sm text-ink-2">
        <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          {loc?.address}, {loc?.city} · {cust?.name}
        </span>
      </p>
      <p className="mt-2 text-[15px] font-semibold tabular-nums">
        {formatLong(order.date)} · {order.start}–{endTime(order)} · {order.items.length} {order.items.length === 1 ? 'uređaj' : 'uređaja'}
      </p>
      {compact ? null : (
        <div className="mt-3 rounded-lg bg-bg px-3 py-2 text-sm">
          <span className="font-semibold">Razlog dolaska: </span>
          {order.category} — {order.reason}
        </div>
      )}
    </Card>
  );
}

export function WorkOrderRun({ order }: { order: WorkOrder }) {
  const { state, updateOrder, updateItem, completeOrder } = useDemo();
  const toast = useToast();
  const uid = useId();
  const L = lookup(state);
  const [active, setActive] = useState<string | null>(null);
  const [scanFor, setScanFor] = useState<string | null | undefined>(undefined);
  const [showItemGaps, setShowItemGaps] = useState(false);
  const [showFinishGaps, setShowFinishGaps] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setShowItemGaps(false);
  }, [active]);

  const doneCount = order.items.filter((i) => i.done).length;
  const pending = order.items.filter((i) => !i.done);
  const activeItem = active ? order.items.find((i) => i.deviceId === active) : undefined;

  function identified(deviceId: string, method: 'qr' | 'rucno') {
    const item = order.items.find((i) => i.deviceId === deviceId);
    if (!item?.identifiedBy) updateItem(order.id, deviceId, { identifiedBy: method, identifiedAt: Date.now() });
    setScanFor(undefined);
    setActive(deviceId);
    toast({ title: `Uređaj ${deviceId} identifikovan.`, body: method === 'qr' ? 'QR naljepnica odgovara nalogu — možete unijeti podatke.' : 'Ručna identifikacija — biće označena u izvještaju.' });
  }

  /* --------------------------- otkazan / završen --------------------------- */

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
          <p className="mt-1 text-sm text-ink-2">
            Obrađeno uređaja: {doneCount} od {order.items.length} · trajanje {order.timeSpentMin ?? '—'} min
          </p>
          <ButtonLink href={`/demo/izvjestaji/${order.id}`} size="lg" className="mt-4 w-full sm:w-auto">
            <FileText aria-hidden /> Pogledaj primjer izvještaja
          </ButtonLink>
        </Card>
        <WorkOrderHeader order={order} compact />
        <DeviceList order={order} onOpen={() => undefined} readOnly />
      </div>
    );
  }

  /* -------------------------------- planiran ------------------------------- */

  if (order.status === 'planiran') {
    return (
      <div className="space-y-4 pb-24">
        <WorkOrderHeader order={order} />
        <DeviceList order={order} onOpen={() => undefined} readOnly />
        <Notice tone="info" title="Na objektu: skenirajte svaki uređaj">
          Prije unosa serviser skenira QR naljepnicu na uređaju. Tako se podaci ne mogu upisati na pogrešan uređaj, a izvještaj bilježi kako je uređaj identifikovan.
        </Notice>
        {!order.technicianId ? <Notice tone="warn">Nalogu još nije dodijeljen serviser. U demou ga ipak možete pokrenuti.</Notice> : null}
        <StickyBar>
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              updateOrder(order.id, { status: 'u_radu', startedAt: Date.now() });
              toast({ title: 'Posjeta je pokrenuta.', body: 'Trajanje se bilježi automatski. ' + DEMO_CHANGE });
            }}
          >
            <Play aria-hidden /> Stigao sam — pokreni posjetu
          </Button>
        </StickyBar>
      </div>
    );
  }

  /* ------------------------- u radu: jedan uređaj ------------------------- */

  if (activeItem) {
    const d = L.device(activeItem.deviceId);
    const gaps = checklistGaps(activeItem.checklist, 'x');
    const incomplete = gaps.unanswered.length > 0 || gaps.attentionWithoutNote.length > 0;
    const setEntry = (id: string, patch: { answer?: CheckAnswer; note?: string }) =>
      updateItem(order.id, activeItem.deviceId, { checklist: activeItem.checklist.map((c) => (c.id === id ? { ...c, ...patch } : c)) });

    const save = (force: boolean) => {
      if (incomplete && !force) {
        setShowItemGaps(true);
        setTimeout(() => document.getElementById(`${uid}-itemgaps`)?.focus(), 0);
        return;
      }
      updateItem(order.id, activeItem.deviceId, { done: true });
      const left = order.items.filter((i) => !i.done && i.deviceId !== activeItem.deviceId).length;
      toast({ title: `${activeItem.deviceId} sačuvan.`, body: left ? `Preostalo uređaja: ${left}. Skenirajte sljedeći.` : 'Svi uređaji su obrađeni. Završite posjetu.' });
      setActive(null);
    };

    return (
      <div className="space-y-4 pb-28" data-testid="device-entry">
        <button type="button" onClick={() => setActive(null)} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary">
          <ArrowLeft className="size-4" aria-hidden /> Lista uređaja ({doneCount}/{order.items.length})
        </button>

        <div className={cn('rounded-xl border p-4', activeItem.identifiedBy === 'qr' ? 'border-ok/30 bg-ok-soft' : 'border-warn/30 bg-warn-soft')} role="status">
          <p className={cn('flex items-center gap-2 text-sm font-semibold', activeItem.identifiedBy === 'qr' ? 'text-ok' : 'text-warn')}>
            <CheckCircle2 className="size-[18px]" aria-hidden /> Identifikovan · {identificationLabel(activeItem)}
          </p>
          <h2 className="mt-1 text-xl font-bold">
            {d?.id} · {d?.name}
          </h2>
          <p className="text-sm text-ink-2">
            {d?.typeLabel} · <span className="font-mono">{d?.serial}</span>
          </p>
        </div>

        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">Kontrolna lista</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => updateItem(order.id, activeItem.deviceId, { checklist: markAllOk(activeItem.checklist) })}
              disabled={gaps.unanswered.length === 0}
            >
              <CheckCircle2 aria-hidden /> Sve uredno
            </Button>
          </div>
          <p className="mt-1 text-[13px] text-ink-2">„Sve uredno” označi preostale stavke jednim dodirom — promijenite samo izuzetke. Obrazac u stvarnoj verziji potvrđuje firma.</p>
          <ol className="mt-3 divide-y divide-line">
            {activeItem.checklist.map((item) => (
              <li key={item.id} className="py-3">
                <fieldset>
                  <legend className="text-[15px] font-semibold">{item.label}</legend>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {ANSWERS.map((a) => (
                      <label key={a} className="relative">
                        <input type="radio" name={`${uid}-${activeItem.deviceId}-${item.id}`} className="peer sr-only" checked={item.answer === a} onChange={() => setEntry(item.id, { answer: a })} />
                        <span
                          className={cn(
                            'flex min-h-11 cursor-pointer items-center justify-center rounded-[10px] border border-line-2 px-1 text-center text-[13px] leading-tight font-semibold text-ink-2 peer-focus-visible:outline-2 peer-focus-visible:outline-primary sm:text-sm',
                            ANSWER_STYLE[a],
                          )}
                        >
                          {ANSWER_LABEL[a]}
                        </span>
                      </label>
                    ))}
                  </div>
                  {item.answer === 'paznja' ? (
                    <>
                      <label htmlFor={`${uid}-${item.id}-note`} className="sr-only">
                        Šta treba pažnju: {item.label}
                      </label>
                      <textarea
                        id={`${uid}-${item.id}-note`}
                        rows={2}
                        placeholder="Kratko: šta treba pažnju (obavezno)"
                        value={item.note}
                        onChange={(e) => setEntry(item.id, { note: e.target.value })}
                        className={cn(inputClass(showItemGaps && !item.note.trim()), 'mt-2')}
                        maxLength={300}
                      />
                    </>
                  ) : null}
                </fieldset>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="space-y-3 p-4">
          <Field label="Napomena za ovaj uređaj" htmlFor={`${uid}-note`}>
            <textarea id={`${uid}-note`} rows={2} value={activeItem.note} onChange={(e) => updateItem(order.id, activeItem.deviceId, { note: e.target.value })} className={inputClass()} maxLength={600} />
          </Field>
          {activeItem.photos.map((p, i) => (
            <div key={`${p.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-line-2 bg-bg p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.dataUrl} alt={`Lokalni pregled: ${p.name}`} className="size-14 rounded-lg object-cover" />
              <p className="min-w-0 flex-1 text-sm break-all">{p.name}</p>
              <Button
                variant="danger"
                size="sm"
                onClick={() => updateItem(order.id, activeItem.deviceId, { photos: activeItem.photos.filter((_, j) => j !== i) })}
                aria-label={`Ukloni fotografiju ${p.name}`}
              >
                <Trash2 aria-hidden /> Ukloni
              </Button>
            </div>
          ))}
          {activeItem.photos.length < 3 ? (
            <PhotoPicker
              label={activeItem.photos.length ? 'Još jedna fotografija' : 'Fotografija'}
              photo={null}
              onChange={(p) => p && updateItem(order.id, activeItem.deviceId, { photos: [...activeItem.photos, p] })}
            />
          ) : null}
        </Card>

        {showItemGaps && incomplete ? (
          <div id={`${uid}-itemgaps`} tabIndex={-1} className="rounded-xl border border-warn/30 bg-warn-soft p-4 text-sm" role="alert">
            <p className="font-semibold text-warn">Za {activeItem.deviceId} nedostaje:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {gaps.unanswered.map((l) => (
                <li key={l}>Odgovor za „{l}”</li>
              ))}
              {gaps.attentionWithoutNote.map((l) => (
                <li key={l}>Kratak opis uz „Potrebna pažnja” za „{l}”</li>
              ))}
            </ul>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => save(true)}>
              Ipak sačuvaj u demou
            </Button>
          </div>
        ) : null}

        <StickyBar>
          <Button size="lg" className="w-full" onClick={() => save(false)}>
            <CheckCircle2 aria-hidden /> Sačuvaj {activeItem.deviceId} i nazad na listu
          </Button>
        </StickyBar>
      </div>
    );
  }

  /* ------------------------ u radu: lista + završetak ---------------------- */

  const minutes = order.startedAt ? Math.max(1, Math.round((now - order.startedAt) / 60_000)) : null;
  const finishGaps = { undone: pending.map((i) => i.deviceId), recommendation: !order.recommendation.trim() };
  const finish = (force: boolean) => {
    if ((finishGaps.undone.length || finishGaps.recommendation) && !force) {
      setShowFinishGaps(true);
      setTimeout(() => document.getElementById(`${uid}-finishgaps`)?.focus(), 0);
      return;
    }
    completeOrder(order.id);
    toast({ title: 'Demo nalog je završen u ovom primjeru.', body: DEMO_CHANGE });
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="space-y-4 pb-28">
      <WorkOrderHeader order={order} compact />

      <div className="rounded-xl border border-line bg-surface p-4" aria-live="polite">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>
            Obrađeno: {doneCount} od {order.items.length} uređaja
          </span>
          {minutes ? <span className="font-normal text-ink-2">Na objektu {minutes} min</span> : null}
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" aria-hidden>
          <div className="h-full rounded-full bg-ok transition-all" style={{ width: `${(doneCount / order.items.length) * 100}%` }} />
        </div>
        {pending.length ? <p className="mt-2 text-[13px] text-ink-2">Priđite uređaju i skenirajte njegovu QR naljepnicu. Unos se otvara samo za skenirani uređaj.</p> : null}
      </div>

      <DeviceList order={order} onOpen={(id, identifiedAlready) => (identifiedAlready ? setActive(id) : setScanFor(id))} />

      <Card className="space-y-4 p-4" aria-labelledby={`${uid}-fin`}>
        <h2 id={`${uid}-fin`} className="text-base font-semibold">
          Završetak posjete
        </h2>
        <Field label="Preporuka kupcu" htmlFor={`${uid}-rec`} required error={showFinishGaps && finishGaps.recommendation ? 'Odaberite ili upišite kratku preporuku.' : null}>
          <div className="mb-1 flex flex-wrap gap-1.5">
            {RECOMMENDATIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => updateOrder(order.id, { recommendation: r })}
                className={cn('min-h-9 rounded-full border px-3 text-left text-[13px] font-medium', order.recommendation === r ? 'border-primary bg-primary-soft text-primary-hover' : 'border-line-2 text-ink-2 hover:text-ink')}
              >
                {r}
              </button>
            ))}
          </div>
          <textarea
            id={`${uid}-rec`}
            rows={2}
            value={order.recommendation}
            onChange={(e) => updateOrder(order.id, { recommendation: e.target.value })}
            className={inputClass(showFinishGaps && finishGaps.recommendation)}
            maxLength={600}
          />
        </Field>
        <details className="rounded-xl border border-line px-3 py-2">
          <summary className="min-h-9 cursor-pointer py-1.5 text-sm font-semibold">Dodatno (opcionalno): materijal, bilješka, potvrda kupca</summary>
          <div className="mt-2 space-y-3 pb-2">
            <Field label="Utrošeni materijal" htmlFor={`${uid}-mat`} hint="Primjer stavke, bez cijena.">
              <input id={`${uid}-mat`} value={order.materials} onChange={(e) => updateOrder(order.id, { materials: e.target.value })} className={inputClass()} maxLength={200} />
            </Field>
            <Field label="Bilješka za posjetu" htmlFor={`${uid}-notes`}>
              <textarea id={`${uid}-notes`} rows={3} value={order.notes} onChange={(e) => updateOrder(order.id, { notes: e.target.value })} className={inputClass()} maxLength={2000} />
            </Field>
            <Field label="Potvrda kupca — ilustrativna rubrika" htmlFor={`${uid}-ack`} hint="Ime prisutne osobe. Nije pravni potpis.">
              <input id={`${uid}-ack`} value={order.customerAck} onChange={(e) => updateOrder(order.id, { customerAck: e.target.value })} className={inputClass()} maxLength={80} />
            </Field>
          </div>
        </details>
        <p className="text-[13px] text-ink-3">Trajanje posjete se računa automatski od pokretanja do završetka.</p>
      </Card>

      {showFinishGaps && (finishGaps.undone.length || finishGaps.recommendation) ? (
        <div id={`${uid}-finishgaps`} tabIndex={-1} className="rounded-xl border border-warn/30 bg-warn-soft p-4 text-sm" role="alert">
          <p className="font-semibold text-warn">Prije završetka nedostaje:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {finishGaps.undone.map((id) => (
              <li key={id}>Uređaj {id} nije obrađen (u izvještaju: „nije pregledan u ovoj posjeti”)</li>
            ))}
            {finishGaps.recommendation ? <li>Preporuka kupcu</li> : null}
          </ul>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => finish(true)}>
            Ipak završi demo nalog
          </Button>
        </div>
      ) : null}

      <StickyBar>
        {pending.length ? (
          <div className="flex gap-2">
            <Button size="lg" className="flex-1" onClick={() => setScanFor(null)}>
              <ScanLine aria-hidden /> Skeniraj QR uređaja
            </Button>
            <Button size="lg" variant="secondary" onClick={() => finish(false)} className="shrink-0 px-3" aria-label="Završi posjetu">
              Završi
            </Button>
          </div>
        ) : (
          <Button size="lg" className="w-full" onClick={() => finish(false)}>
            <CheckCircle2 aria-hidden /> Završi demo nalog
          </Button>
        )}
      </StickyBar>

      <ScanDialog open={scanFor !== undefined} onClose={() => setScanFor(undefined)} order={order} expected={scanFor ?? null} onIdentified={identified} />
    </div>
  );
}

function DeviceList({ order, onOpen, readOnly = false }: { order: WorkOrder; onOpen: (deviceId: string, identifiedAlready: boolean) => void; readOnly?: boolean }) {
  const { state } = useDemo();
  const L = lookup(state);
  return (
    <section aria-label="Uređaji na objektu">
      <h2 className="mb-2 text-base font-semibold">Uređaji u ovoj posjeti</h2>
      <ul className="space-y-2">
        {order.items.map((item) => {
          const d = L.device(item.deviceId);
          const attention = item.checklist.filter((c) => c.answer === 'paznja').length;
          return (
            <li key={item.deviceId}>
              <div className={cn('flex flex-wrap items-center gap-3 rounded-xl border bg-surface p-3 sm:flex-nowrap', item.done ? 'border-ok/30' : 'border-line')} data-testid={`item-${item.deviceId}`}>
                <span
                  className={cn('inline-flex size-10 shrink-0 items-center justify-center rounded-lg', item.done ? 'bg-ok-soft text-ok' : item.identifiedBy ? 'bg-primary-soft text-primary' : 'bg-bg text-ink-2')}
                  aria-hidden
                >
                  {item.done ? <CheckCircle2 className="size-5" /> : item.identifiedBy ? <QrCode className="size-5" /> : <Lock className="size-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {d?.id} · {d?.name}
                  </p>
                  <p className="text-[13px] text-ink-2">{d?.typeLabel}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {item.done ? <Badge tone="ok">Obrađen</Badge> : item.identifiedBy ? <Badge tone="info">Identifikovan — unos u toku</Badge> : <Badge tone="neutral">Unos zaključan do skeniranja</Badge>}
                    {item.identifiedBy ? <Badge tone={item.identifiedBy === 'qr' ? 'ok' : 'warn'} icon={false}>{identificationLabel(item)}</Badge> : null}
                    {attention ? <Badge tone="warn">{attention}× potrebna pažnja</Badge> : null}
                  </div>
                </div>
                {readOnly ? null : (
                  <Button
                    size="sm"
                    variant={item.identifiedBy ? 'secondary' : 'primary'}
                    onClick={() => onOpen(item.deviceId, Boolean(item.identifiedBy))}
                    aria-label={item.identifiedBy ? `${item.done ? 'Izmijeni' : 'Nastavi'} unos za ${item.deviceId}` : `Skeniraj QR za ${item.deviceId}`}
                    className="w-full shrink-0 sm:w-auto"
                  >
                    {item.identifiedBy ? (
                      <>
                        {item.done ? 'Izmijeni' : 'Nastavi'} <ChevronRight aria-hidden />
                      </>
                    ) : (
                      <>
                        <ScanLine aria-hidden /> Skeniraj QR
                      </>
                    )}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function StickyBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="no-print fixed inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom))] z-30 border-t border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto max-w-3xl px-4 py-3">{children}</div>
    </div>
  );
}
