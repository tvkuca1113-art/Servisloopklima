'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useState } from 'react';

import { addDays, addMonths, formatInterval, formatLong, type CivilDate } from '@/lib/dates';
import { findCollision, suggestFreeSlot } from '@/lib/derive';
import { INTERVALS, TYPE_OPTIONS } from '@/lib/device-types';
import { useDemo } from '@/lib/store';
import type { DeviceKind } from '@/lib/types';

import { DEMO_CHANGE, useToast } from './toast';
import { Button, Field, Modal, Notice, inputClass } from './ui';

const TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];

/**
 * Vlasnik najavljuje ugradnju: uređaj dobija oznaku i QR naljepnicu odmah (ide u paket),
 * a serviser dobija nalog „Ugradnja”. Prvi servis ulazi u plan kada se ugradnja završi.
 */
export function InstallModal({ open, onClose, presetLocationId }: { open: boolean; onClose: () => void; presetLocationId?: string }) {
  const { state, planInstall } = useDemo();
  const toast = useToast();
  const router = useRouter();
  const uid = useId();
  const today = state.anchor;

  const [mode, setMode] = useState<'postojeci' | 'novi'>('postojeci');
  const [locationId, setLocationId] = useState('');
  const [cust, setCust] = useState({ name: '', type: 'Privatni kupac' as 'Privatni kupac' | 'Poslovni kupac', email: '', locationName: '', address: '', city: '' });
  const [kind, setKind] = useState<DeviceKind>('klima');
  const [typeLabel, setTypeLabel] = useState(TYPE_OPTIONS.klima[0]!);
  const [name, setName] = useState('');
  const [model, setModel] = useState('Demo model (demonstracijski)');
  const [intervalMonths, setIntervalMonths] = useState(12);
  const [tech, setTech] = useState('t1');
  const [date, setDate] = useState<CivilDate>(addDays(today, 1));
  const [start, setStart] = useState('09:00');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    if (!open) return;
    setMode('postojeci');
    setLocationId(presetLocationId ?? '');
    setCust({ name: '', type: 'Privatni kupac', email: '', locationName: '', address: '', city: '' });
    setKind('klima');
    setTypeLabel(TYPE_OPTIONS.klima[0]!);
    setName('');
    setModel('Demo model (demonstracijski)');
    setIntervalMonths(12);
    setTech('t1');
    const d = addDays(today, 1);
    setDate(d);
    setStart(suggestFreeSlot(state, 't1', d, 180) ?? '09:00');
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const collision = date ? findCollision(state, tech, date, start, 180) : null;

  function submit() {
    const e: Record<string, string> = {};
    if (mode === 'postojeci' && !locationId) e.location = 'Odaberite objekat.';
    if (mode === 'novi') {
      if (cust.name.trim().length < 2) e.custName = 'Unesite naziv kupca.';
      if (cust.locationName.trim().length < 2) e.locName = 'Unesite naziv objekta (npr. „Kuća Zenica”).';
      if (cust.city.trim().length < 2) e.city = 'Unesite grad.';
    }
    if (name.trim().length < 3) e.name = 'Unesite naziv uređaja (npr. „Klima — dnevni boravak”).';
    if (!date || date < today) e.date = 'Odaberite datum ugradnje (danas ili kasnije).';
    setErrors(e);
    if (Object.keys(e).length || collision) return;
    const { deviceId, orderId } = planInstall({
      locationId: mode === 'postojeci' ? locationId : null,
      newCustomer: mode === 'novi' ? { ...cust, name: cust.name.trim(), email: cust.email.trim(), locationName: cust.locationName.trim(), address: cust.address.trim() || 'adresa nije unesena (demo)', city: cust.city.trim() } : null,
      device: { kind, typeLabel, name: name.trim(), model: model.trim() || 'nije upisan', intervalMonths },
      technicianId: tech,
      date,
      start,
      durationMin: 180,
    });
    toast({ title: `Ugradnja ${deviceId} je planirana.`, body: `${DEMO_CHANGE} Odštampajte QR naljepnicu za paket.` });
    onClose();
    router.push(`/demo/nalozi/${orderId}`);
  }

  const err = (k: string) => errors[k];

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Nova ugradnja uređaja"
      description="Uređaj odmah dobija oznaku i QR naljepnicu koja ide u paket. Serviser je na ugradnji zalijepi i skenira."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Odustani
          </Button>
          <Button onClick={submit} disabled={Boolean(collision)}>
            Planiraj ugradnju
          </Button>
        </>
      }
    >
      <form
        noValidate
        className="space-y-5"
        onSubmit={(ev) => {
          ev.preventDefault();
          submit();
        }}
      >
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Kupac i objekat</legend>
          <div className="grid grid-cols-2 gap-2">
            {(['postojeci', 'novi'] as const).map((m) => (
              <label key={m} className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-line-2 px-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                <input type="radio" name={`${uid}-mode`} checked={mode === m} onChange={() => setMode(m)} className="size-5 accent-[var(--color-primary)]" />
                <span className="text-sm font-medium">{m === 'postojeci' ? 'Postojeći objekat' : 'Novi kupac'}</span>
              </label>
            ))}
          </div>
          {mode === 'postojeci' ? (
            <div className="mt-3">
              <Field label="Objekat" htmlFor={`${uid}-loc`} required error={err('location')}>
                <select id={`${uid}-loc`} value={locationId} onChange={(e) => setLocationId(e.target.value)} className={inputClass(Boolean(err('location')))}>
                  <option value="">Odaberite objekat…</option>
                  {state.locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} — {state.customers.find((c) => c.id === l.customerId)?.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Naziv kupca" htmlFor={`${uid}-cn`} required error={err('custName')}>
                <input id={`${uid}-cn`} value={cust.name} onChange={(e) => setCust({ ...cust, name: e.target.value })} className={inputClass(Boolean(err('custName')))} maxLength={80} />
              </Field>
              <Field label="Vrsta kupca" htmlFor={`${uid}-ct`} required>
                <select id={`${uid}-ct`} value={cust.type} onChange={(e) => setCust({ ...cust, type: e.target.value as typeof cust.type })} className={inputClass()}>
                  <option>Privatni kupac</option>
                  <option>Poslovni kupac</option>
                </select>
              </Field>
              <Field label="Naziv objekta" htmlFor={`${uid}-ln`} required error={err('locName')}>
                <input id={`${uid}-ln`} value={cust.locationName} onChange={(e) => setCust({ ...cust, locationName: e.target.value })} className={inputClass(Boolean(err('locName')))} maxLength={80} />
              </Field>
              <Field label="Grad" htmlFor={`${uid}-city`} required error={err('city')}>
                <input id={`${uid}-city`} value={cust.city} onChange={(e) => setCust({ ...cust, city: e.target.value })} className={inputClass(Boolean(err('city')))} maxLength={40} />
              </Field>
              <Field label="Adresa" htmlFor={`${uid}-addr`}>
                <input id={`${uid}-addr`} value={cust.address} onChange={(e) => setCust({ ...cust, address: e.target.value })} className={inputClass()} maxLength={80} />
              </Field>
              <Field label="E-mail kupca" htmlFor={`${uid}-em`} hint="U demou koristite npr. ime@example.test.">
                <input id={`${uid}-em`} type="email" value={cust.email} onChange={(e) => setCust({ ...cust, email: e.target.value })} className={inputClass()} maxLength={80} />
              </Field>
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Uređaj</legend>
          <div className="grid grid-cols-2 gap-2">
            {(['klima', 'pumpa'] as const).map((k) => (
              <label key={k} className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-line-2 px-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                <input
                  type="radio"
                  name={`${uid}-kind`}
                  checked={kind === k}
                  onChange={() => {
                    setKind(k);
                    setTypeLabel(TYPE_OPTIONS[k][0]!);
                  }}
                  className="size-5 accent-[var(--color-primary)]"
                />
                <span className="text-sm font-medium">{k === 'klima' ? 'Klima uređaj' : 'Toplotna pumpa'}</span>
              </label>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Tip" htmlFor={`${uid}-type`} required>
              <select id={`${uid}-type`} value={typeLabel} onChange={(e) => setTypeLabel(e.target.value)} className={inputClass()}>
                {TYPE_OPTIONS[kind].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Naziv uređaja" htmlFor={`${uid}-name`} required error={err('name')}>
              <input id={`${uid}-name`} value={name} onChange={(e) => setName(e.target.value)} className={inputClass(Boolean(err('name')))} maxLength={90} />
            </Field>
            <Field label="Model" htmlFor={`${uid}-model`} hint="Serijski broj upisuje serviser s natpisne pločice.">
              <input id={`${uid}-model`} value={model} onChange={(e) => setModel(e.target.value)} className={inputClass()} maxLength={80} />
            </Field>
            <Field label="Servisni interval (DEMO postavka)" htmlFor={`${uid}-int`} required hint={date ? `Prvi servis automatski u planu: ${formatLong(addMonths(date, intervalMonths))}` : undefined}>
              <select id={`${uid}-int`} value={intervalMonths} onChange={(e) => setIntervalMonths(Number(e.target.value))} className={inputClass()}>
                {INTERVALS.map((m) => (
                  <option key={m} value={m}>
                    {formatInterval(m)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Ugradnja (3 sata)</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Serviser" htmlFor={`${uid}-tech`} required>
              <select id={`${uid}-tech`} value={tech} onChange={(e) => setTech(e.target.value)} className={inputClass()}>
                {state.technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Datum" htmlFor={`${uid}-date`} required error={err('date')}>
              <input id={`${uid}-date`} type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className={inputClass(Boolean(err('date')))} />
            </Field>
            <Field label="Početak" htmlFor={`${uid}-start`} required>
              <select id={`${uid}-start`} value={start} onChange={(e) => setStart(e.target.value)} className={inputClass()}>
                {TIMES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>
          {collision ? (
            <Notice tone="warn" className="mt-3" title="Demo kolizija termina">
              Serviser u primjeru već ima {collision.order.id} u tom terminu. Odaberite drugo vrijeme ili servisera.
            </Notice>
          ) : null}
        </fieldset>
        <button type="submit" className="sr-only" tabIndex={-1}>
          Planiraj
        </button>
      </form>
    </Modal>
  );
}
