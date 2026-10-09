'use client';

import { useEffect, useId, useState } from 'react';

import { addMonths, formatLong, formatInterval } from '@/lib/dates';
import { useDemo } from '@/lib/store';
import type { Device, DeviceKind } from '@/lib/types';

import { DEMO_CHANGE, useToast } from './toast';
import { Button, Field, Modal, inputClass } from './ui';

const TYPE_OPTIONS: Record<DeviceKind, string[]> = {
  klima: ['Split klima uređaj', 'Multi-split klima uređaj', 'Kasetna klima', 'Kanalna klima'],
  pumpa: ['Toplotna pumpa zrak–voda', 'Toplotna pumpa zemlja–voda'],
};

interface FormState {
  kind: DeviceKind;
  typeLabel: string;
  name: string;
  locationId: string;
  model: string;
  installedOn: string;
  intervalMonths: number;
  note: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

export function DeviceFormModal({ open, onClose, device, onSaved }: { open: boolean; onClose: () => void; device?: Device; onSaved?: (id: string) => void }) {
  const { state, addDevice, updateDevice } = useDemo();
  const toast = useToast();
  const uid = useId();
  const today = state.anchor;

  const initial = (): FormState =>
    device
      ? { kind: device.kind, typeLabel: device.typeLabel, name: device.name, locationId: device.locationId, model: device.model, installedOn: device.installedOn, intervalMonths: device.intervalMonths, note: device.note }
      : { kind: 'klima', typeLabel: TYPE_OPTIONS.klima[0]!, name: '', locationId: '', model: 'Demo model (demonstracijski)', installedOn: today, intervalMonths: 12, note: '' };

  const [f, setF] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (open) {
      setF(initial());
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, device?.id]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setF((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const baseDate = device?.lastServiceOn ?? f.installedOn;
  const nextPreview = baseDate ? addMonths(baseDate, f.intervalMonths) : null;

  function validate(): Errors {
    const e: Errors = {};
    if (f.name.trim().length < 3) e.name = 'Unesite naziv uređaja (najmanje 3 znaka).';
    if (!f.locationId) e.locationId = 'Odaberite lokaciju iz primjera.';
    if (!f.installedOn) e.installedOn = 'Unesite datum ugradnje.';
    else if (f.installedOn > today) e.installedOn = 'Datum ugradnje ne može biti u budućnosti.';
    return e;
  }

  function submit() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      const first = Object.keys(e)[0];
      document.getElementById(`${uid}-${first}`)?.focus();
      return;
    }
    const next = addMonths(baseDate, f.intervalMonths);
    if (device) {
      updateDevice(device.id, { ...f, name: f.name.trim(), nextServiceOn: next });
      toast({ title: DEMO_CHANGE, body: `Uređaj ${device.id} je izmijenjen u ovom primjeru.` });
      onSaved?.(device.id);
    } else {
      const id = addDevice({ ...f, name: f.name.trim(), nextServiceOn: next, serial: `DEMO-SN-NOVI-${Date.now().toString().slice(-4)}`, status: 'aktivan', label: null, idPrefix: f.kind === 'pumpa' ? 'TP' : 'KL' });
      toast({ title: DEMO_CHANGE, body: `Demo uređaj ${id} je dodan samo u ovaj primjer.` });
      onSaved?.(id);
    }
    onClose();
  }

  const describedBy = (k: keyof FormState) => (errors[k] ? `${uid}-${k}-error` : undefined);

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={device ? `Uredi demo uređaj ${device.id}` : 'Dodaj demo uređaj'}
      description="Promjena se prikazuje samo u ovoj probi i ne šalje se nigdje."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Odustani
          </Button>
          <Button onClick={submit}>{device ? 'Sačuvaj u primjeru' : 'Dodaj u primjer'}</Button>
        </>
      }
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <fieldset disabled={Boolean(device)}>
          <legend className="mb-2 text-sm font-semibold">Vrsta uređaja</legend>
          <div className="grid grid-cols-2 gap-2">
            {(['klima', 'pumpa'] as const).map((k) => (
              <label key={k} className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-line-2 px-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:disabled]:cursor-default">
                <input
                  type="radio"
                  name={`${uid}-kind`}
                  checked={f.kind === k}
                  onChange={() => {
                    set('kind', k);
                    set('typeLabel', TYPE_OPTIONS[k][0]!);
                  }}
                  className="size-5 accent-[var(--color-primary)]"
                />
                <span className="font-medium">{k === 'klima' ? 'Klima uređaj' : 'Toplotna pumpa'}</span>
              </label>
            ))}
          </div>
          {device ? <p className="mt-1 text-[13px] text-ink-3">Vrsta postojećeg uređaja se ne mijenja.</p> : null}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tip" htmlFor={`${uid}-typeLabel`} required>
            <select id={`${uid}-typeLabel`} value={f.typeLabel} onChange={(e) => set('typeLabel', e.target.value)} className={inputClass()}>
              {TYPE_OPTIONS[f.kind].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Naziv uređaja" htmlFor={`${uid}-name`} required error={errors.name} hint="Npr. „Klima — kancelarija”.">
            <input id={`${uid}-name`} value={f.name} onChange={(e) => set('name', e.target.value)} className={inputClass(Boolean(errors.name))} aria-invalid={Boolean(errors.name)} aria-describedby={describedBy('name')} maxLength={90} />
          </Field>
          <Field label="Lokacija i kupac" htmlFor={`${uid}-locationId`} required error={errors.locationId}>
            <select id={`${uid}-locationId`} value={f.locationId} onChange={(e) => set('locationId', e.target.value)} className={inputClass(Boolean(errors.locationId))} aria-invalid={Boolean(errors.locationId)} aria-describedby={describedBy('locationId')}>
              <option value="">Odaberite lokaciju…</option>
              {state.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} — {state.customers.find((c) => c.id === l.customerId)?.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Model" htmlFor={`${uid}-model`} hint="U demou modeli su demonstracijski.">
            <input id={`${uid}-model`} value={f.model} onChange={(e) => set('model', e.target.value)} className={inputClass()} maxLength={80} />
          </Field>
          <Field label="Datum ugradnje" htmlFor={`${uid}-installedOn`} required error={errors.installedOn}>
            <input id={`${uid}-installedOn`} type="date" max={today} value={f.installedOn} onChange={(e) => set('installedOn', e.target.value)} className={inputClass(Boolean(errors.installedOn))} aria-invalid={Boolean(errors.installedOn)} aria-describedby={describedBy('installedOn')} />
          </Field>
          <Field label="Servisni interval (DEMO postavka)" htmlFor={`${uid}-interval`} required hint={nextPreview ? `Prvi/sljedeći servis automatski u planu: ${formatLong(nextPreview)}` : undefined}>
            <select id={`${uid}-interval`} value={f.intervalMonths} onChange={(e) => set('intervalMonths', Number(e.target.value))} className={inputClass()}>
              {[6, 12, 24].map((m) => (
                <option key={m} value={m}>
                  {formatInterval(m)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Napomena" htmlFor={`${uid}-note`}>
          <textarea id={`${uid}-note`} rows={3} value={f.note} onChange={(e) => set('note', e.target.value)} className={inputClass()} maxLength={400} />
        </Field>
        <p className="text-[13px] text-ink-3">Stvarne intervale servisa potvrđuje firma prema uređaju i proizvođaču.</p>
        <button type="submit" className="sr-only" tabIndex={-1}>
          Sačuvaj
        </button>
      </form>
    </Modal>
  );
}
