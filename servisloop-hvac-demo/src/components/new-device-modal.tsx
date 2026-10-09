'use client';

import { useEffect, useId, useState } from 'react';

import { addMonths, formatInterval, formatLong } from '@/lib/dates';
import { INTERVALS, TYPE_OPTIONS } from '@/lib/device-types';
import { useDemo, type NewDeviceInput } from '@/lib/store';
import type { DeviceKind } from '@/lib/types';

import { Button, Field, Modal, Notice, inputClass } from './ui';

/**
 * Serviser na objektu dodaje uređaj koji nije bio najavljen. Naljepnica je već
 * zalijepljena i skenirana; ovdje je samo nekoliko polja.
 */
export function NewDeviceModal({ labelCode, locationName, onClose, onSave }: { labelCode: string | null; locationName: string; onClose: () => void; onSave: (input: NewDeviceInput) => void }) {
  const { state } = useDemo();
  const uid = useId();
  const [newInstall, setNewInstall] = useState(true);
  const [kind, setKind] = useState<DeviceKind>('klima');
  const [typeLabel, setTypeLabel] = useState(TYPE_OPTIONS.klima[0]!);
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [serial, setSerial] = useState('');
  const [intervalMonths, setIntervalMonths] = useState(12);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!labelCode) return;
    setNewInstall(true);
    setKind('klima');
    setTypeLabel(TYPE_OPTIONS.klima[0]!);
    setName('');
    setModel('');
    setSerial('');
    setIntervalMonths(12);
    setError(null);
  }, [labelCode]);

  function save() {
    if (name.trim().length < 3) {
      setError('Unesite kratak naziv (npr. „Klima — spavaća soba”).');
      document.getElementById(`${uid}-name`)?.focus();
      return;
    }
    onSave({ kind, typeLabel, name: name.trim(), model: model.trim(), serial: serial.trim(), intervalMonths, newInstall });
  }

  return (
    <Modal
      open={Boolean(labelCode)}
      onClose={onClose}
      wide
      title={`Novi uređaj · naljepnica ${labelCode ?? ''}`}
      description={`Objekat: ${locationName}. Naljepnica se veže za ovaj uređaj; prvi servis ulazi u plan automatski.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Odustani
          </Button>
          <Button onClick={save}>Dodaj uređaj i nastavi</Button>
        </>
      }
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Notice tone="ok">Naljepnica {labelCode} je prazna i pripada kompletu firme — može se povezati.</Notice>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Uređaj je</legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: true, l: 'Upravo ugrađen' },
              { v: false, l: 'Postojeći, nije bio u evidenciji' },
            ].map((o) => (
              <label key={o.l} className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-line-2 px-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                <input type="radio" name={`${uid}-ni`} checked={newInstall === o.v} onChange={() => setNewInstall(o.v)} className="size-5 accent-[var(--color-primary)]" />
                <span className="text-sm font-medium">{o.l}</span>
              </label>
            ))}
          </div>
        </fieldset>
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
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tip" htmlFor={`${uid}-type`} required>
            <select id={`${uid}-type`} value={typeLabel} onChange={(e) => setTypeLabel(e.target.value)} className={inputClass()}>
              {TYPE_OPTIONS[kind].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Naziv" htmlFor={`${uid}-name`} required error={error}>
            <input
              id={`${uid}-name`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              className={inputClass(Boolean(error))}
              maxLength={90}
              aria-invalid={Boolean(error)}
            />
          </Field>
          <Field label="Model" htmlFor={`${uid}-model`}>
            <input id={`${uid}-model`} value={model} onChange={(e) => setModel(e.target.value)} className={inputClass()} maxLength={80} />
          </Field>
          <Field label="Serijski broj (s natpisne pločice)" htmlFor={`${uid}-serial`}>
            <input id={`${uid}-serial`} value={serial} onChange={(e) => setSerial(e.target.value)} className={inputClass()} maxLength={60} autoCapitalize="characters" />
          </Field>
          <Field label="Servisni interval (DEMO postavka)" htmlFor={`${uid}-int`} required hint={`Prvi servis u planu: ${formatLong(addMonths(state.anchor, intervalMonths))}`}>
            <select id={`${uid}-int`} value={intervalMonths} onChange={(e) => setIntervalMonths(Number(e.target.value))} className={inputClass()}>
              {INTERVALS.map((m) => (
                <option key={m} value={m}>
                  {formatInterval(m)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <p className="text-[13px] text-ink-3">Kupac i lokacija preuzimaju se s naloga. Vlasnik kasnije može dopuniti podatke.</p>
        <button type="submit" className="sr-only" tabIndex={-1}>
          Dodaj
        </button>
      </form>
    </Modal>
  );
}
