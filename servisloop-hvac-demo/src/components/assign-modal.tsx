'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useState } from 'react';

import { addDays, formatLong, weekdayName, type CivilDate } from '@/lib/dates';
import { deviceTitle, endTime, findCollision, isOpen, lookup, suggestFreeSlot } from '@/lib/derive';
import { useDemo } from '@/lib/store';

import { DEMO_CHANGE, useToast } from './toast';
import { Button, DemoTag, Field, Modal, Notice, inputClass } from './ui';

export type AssignTarget =
  | { mode: 'request'; requestId: string }
  | { mode: 'order'; orderId: string }
  | { mode: 'device'; deviceId: string };

const TIMES: string[] = [];
for (let m = 8 * 60; m <= 16 * 60; m += 30) {
  TIMES.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
}

function slotStart(slot: string): string {
  if (slot.startsWith('Poslijepodne')) return '13:00';
  return '09:00';
}

export function AssignModal({ target, onClose, onDone }: { target: AssignTarget | null; onClose: () => void; onDone?: (orderId: string) => void }) {
  const { state, confirmRequest, assignOrder, planOrder } = useDemo();
  const toast = useToast();
  const router = useRouter();
  const L = lookup(state);
  const today = state.anchor;
  const uid = useId();

  const ctx = useMemo(() => {
    if (!target) return null;
    if (target.mode === 'request') {
      const r = L.request(target.requestId);
      if (!r) return null;
      return { deviceId: r.deviceId, date: r.preferredDate && r.preferredDate >= today ? r.preferredDate : today, start: slotStart(r.preferredSlot), duration: r.kind === 'kvar' ? 120 : 90, technicianId: 't1', ignore: undefined as string | undefined, title: `Potvrdi zahtjev ${r.id} i dodijeli servisera` };
    }
    if (target.mode === 'order') {
      const w = L.workOrder(target.orderId);
      if (!w) return null;
      return { deviceId: w.deviceId, date: w.date, start: w.start, duration: w.durationMin, technicianId: w.technicianId ?? 't1', ignore: w.id, title: `Dodijeli servisera za ${w.id}` };
    }
    return { deviceId: target.deviceId, date: addDays(today, 1), start: '09:00', duration: 90, technicianId: 't1', ignore: undefined, title: `Planiraj demo servis za ${target.deviceId}` };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const [tech, setTech] = useState('t1');
  const [date, setDate] = useState<CivilDate>(today);
  const [start, setStart] = useState('09:00');
  const [duration, setDuration] = useState(90);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    if (!ctx) return;
    setTech(ctx.technicianId);
    setDate(ctx.date);
    setStart(ctx.start);
    setDuration(ctx.duration);
    setDateError(null);
  }, [ctx]);

  if (!ctx) return <Modal open={false} onClose={onClose} title="">{null}</Modal>;

  const device = L.device(ctx.deviceId);
  const collision = date ? findCollision(state, tech, date, start, duration, ctx.ignore) : null;
  const collisionDevice = collision ? L.device(collision.order.deviceId) : undefined;
  const suggestion = collision ? suggestFreeSlot(state, tech, date, duration, ctx.ignore) : null;
  const other = state.technicians.find((t) => t.id !== tech);
  const otherFree = collision && other ? !findCollision(state, other.id, date, start, duration, ctx.ignore) : false;

  function submit() {
    if (!date || date < today) {
      setDateError(!date ? 'Odaberite datum.' : 'Datum ne može biti u prošlosti primjera.');
      return;
    }
    if (collision || !ctx || !target) return;
    const schedule = { technicianId: tech, date, start, durationMin: duration };
    let orderId: string | null = null;
    if (target.mode === 'request') orderId = confirmRequest(target.requestId, schedule);
    else if (target.mode === 'order') {
      assignOrder(target.orderId, schedule);
      orderId = target.orderId;
    } else orderId = planOrder(target.deviceId, schedule, 'Redovni servis prema intervalu (DEMO interval).');
    toast({ title: DEMO_CHANGE, body: `${L.technician(tech)?.name} · ${formatLong(date)} u ${start}. Kupac nije obaviješten — ovo je simulacija.` });
    onClose();
    if (orderId) {
      if (onDone) onDone(orderId);
      else router.push(`/demo/nalozi/${orderId}`);
    }
  }

  return (
    <Modal
      open={Boolean(target)}
      onClose={onClose}
      title={ctx.title}
      wide
      description={
        <>
          <DemoTag className="mr-1.5" /> {device ? deviceTitle(state, device) : ctx.deviceId} — dodjela se prikazuje samo u ovoj probi.
        </>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Odustani
          </Button>
          <Button onClick={submit} disabled={Boolean(collision)}>
            {target?.mode === 'device' ? 'Planiraj demo nalog' : 'Dodijeli servisera'}
          </Button>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Serviser</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {state.technicians.map((t) => {
              const load = state.workOrders.filter((w) => w.technicianId === t.id && w.date === date && isOpen(w) && w.id !== ctx.ignore).length;
              return (
                <label key={t.id} className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-line-2 px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                  <input type="radio" name={`${uid}-tech`} value={t.id} checked={tech === t.id} onChange={() => setTech(t.id)} className="size-5 accent-[var(--color-primary)]" />
                  <span className="min-w-0">
                    <span className="block font-semibold">{t.name}</span>
                    <span className="block text-[13px] text-ink-2">
                      {t.area} · {load} {load === 1 ? 'nalog' : 'naloga'} tog dana
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-1">
          <Field label="Datum" htmlFor={`${uid}-date`} required error={dateError} hint={date ? weekdayName(date) : undefined}>
            <input
              id={`${uid}-date`}
              type="date"
              min={today}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setDateError(null);
              }}
              className={inputClass(Boolean(dateError))}
              aria-invalid={Boolean(dateError)}
              aria-describedby={dateError ? `${uid}-date-error` : `${uid}-date-hint`}
            />
          </Field>
          </div>
          <Field label="Početak" htmlFor={`${uid}-start`} required>
            <select id={`${uid}-start`} value={start} onChange={(e) => setStart(e.target.value)} className={inputClass()}>
              {TIMES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Trajanje" htmlFor={`${uid}-dur`} required>
            <select id={`${uid}-dur`} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputClass()}>
              <option value={60}>1 sat</option>
              <option value={90}>1 sat i 30 min</option>
              <option value={120}>2 sata</option>
            </select>
          </Field>
        </div>

        {date !== today ? (
          <p className="text-[13px] text-ink-2">
            Savjet za vodič: nalog za današnji dan odmah se vidi u prikazu servisera.{' '}
            <button type="button" className="font-semibold text-primary underline underline-offset-2" onClick={() => setDate(today)}>
              Postavi danas
            </button>
          </p>
        ) : null}

        {collision ? (
          <Notice tone="warn" title="Demo kolizija termina">
            <p>
              {L.technician(tech)?.name} u ovom primjeru već ima nalog {collision.order.id} ({collision.order.start}–{endTime(collision.order)}) za{' '}
              {collisionDevice ? deviceTitle(state, collisionDevice) : collision.order.deviceId}. Odaberite drugi termin ili servisera.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestion ? (
                <Button size="sm" variant="secondary" onClick={() => setStart(suggestion)}>
                  Predloži slobodan termin ({suggestion})
                </Button>
              ) : null}
              {otherFree && other ? (
                <Button size="sm" variant="secondary" onClick={() => setTech(other.id)}>
                  Dodijeli: {other.name}
                </Button>
              ) : null}
            </div>
          </Notice>
        ) : (
          <Notice tone="ok">
            Termin {start}–{endTime({ start, durationMin: duration })} je slobodan u primjeru. Stvarna provjera dostupnosti dio je prilagođene verzije.
          </Notice>
        )}
        <button type="submit" className="sr-only" tabIndex={-1}>
          Potvrdi
        </button>
      </form>
    </Modal>
  );
}
