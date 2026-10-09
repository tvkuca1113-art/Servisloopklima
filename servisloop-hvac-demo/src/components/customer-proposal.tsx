'use client';

import { ArrowLeft, CalendarCheck, CheckCircle2, Info } from 'lucide-react';
import { useId, useState } from 'react';

import { cn } from '@/lib/cn';
import { lookup } from '@/lib/derive';
import { DECLINE_INFO, DECLINE_REASONS, dueSentence, slotLabel } from '@/lib/proposal-text';
import { useDemo } from '@/lib/store';

import { Button, ButtonLink, Notice, inputClass } from './ui';

type Step = 'izbor' | 'odbijanje' | 'prihvaceno' | 'odbijeno';

/** Kupac otvara link iz poruke: bira termin, traži drugi ili odbija uz jasno objašnjenje. */
export function CustomerProposal({ proposalId, onBack, onOther }: { proposalId: string; onBack: () => void; onOther: () => void }) {
  const { state, acceptProposal, declineProposal } = useDemo();
  const L = lookup(state);
  const uid = useId();
  const p = state.proposals.find((x) => x.id === proposalId);
  const [step, setStep] = useState<Step>(p?.status === 'prihvacen' ? 'prihvaceno' : p?.status === 'odbijen' || p?.status === 'odgoden' ? 'odbijeno' : 'izbor');
  const [choice, setChoice] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [other, setOther] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!p) {
    return (
      <div className="px-4 py-6">
        <Notice tone="warn">Ovaj prijedlog termina ne postoji u ovoj probi. Link iz poruke radi samo u tabu u kojem je prijedlog napravljen.</Notice>
        <Button variant="secondary" className="mt-4" onClick={onBack}>
          Nazad na karticu uređaja
        </Button>
      </div>
    );
  }

  const devices = p.deviceIds.map((id) => L.device(id)).filter(Boolean);
  const order = p.workOrderId ? L.workOrder(p.workOrderId) : undefined;

  if (step === 'prihvaceno') {
    const slot = p.chosen !== null ? p.slots[p.chosen] : undefined;
    return (
      <div className="px-4 py-5" data-testid="proposal-accepted">
        <CheckCircle2 className="size-11 text-ok" aria-hidden />
        <h2 className="mt-2 text-[22px] leading-tight font-bold">Termin je odabran</h2>
        <p className="mt-2 text-[15px]" role="status">
          Prikazan je primjer potvrde termina. Nije poslano servisnoj firmi.
        </p>
        {slot ? (
          <div className="mt-4 rounded-2xl border border-line bg-surface p-4">
            <p className="flex items-center gap-2 font-semibold">
              <CalendarCheck className="size-5 text-primary" aria-hidden /> {slotLabel(slot, p.durationMin)}
            </p>
            <p className="mt-1 text-sm text-ink-2">
              Serviser: {L.technician(slot.technicianId)?.name} · {devices.map((d) => d!.id).join(', ')}
            </p>
          </div>
        ) : null}
        <Notice tone="demo" className="mt-4">
          U ovom tabu termin je odmah postao radni nalog{order ? ` ${order.id}` : ''} kod vlasnika i servisera.
        </Notice>
        <div className="mt-5 grid gap-2">
          {order ? (
            <ButtonLink href={`/demo/nalozi/${order.id}`} size="lg">
              Pogledaj kako to vidi vlasnik
            </ButtonLink>
          ) : null}
          <Button variant="secondary" size="lg" onClick={onBack}>
            Nazad na karticu uređaja
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'odbijeno') {
    const later = p.status === 'odgoden';
    return (
      <div className="px-4 py-5" data-testid="proposal-declined">
        <CheckCircle2 className="size-11 text-ink-2" aria-hidden />
        <h2 className="mt-2 text-[22px] leading-tight font-bold">{later ? 'Podsjetićemo vas kasnije' : 'Vaša odluka je zabilježena'}</h2>
        <p className="mt-2 text-[15px]" role="status">
          Prikazan je primjer odgovora. Nije poslano servisnoj firmi.
        </p>
        <p className="mt-2 text-sm text-ink-2">{DECLINE_INFO.outro}</p>
        <div className="mt-5 grid gap-2">
          <ButtonLink href="/demo/plan" size="lg">
            Pogledaj kako to vidi vlasnik
          </ButtonLink>
          <Button variant="secondary" size="lg" onClick={onBack}>
            Nazad na karticu uređaja
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'odbijanje') {
    const submit = () => {
      if (!reason) return setError('Odaberite razlog.');
      if (reason === 'drugo' && other.trim().length < 3) return setError('Ukratko navedite razlog.');
      if (!understood) return setError('Potvrdite da ste pročitali informaciju iznad.');
      const r = DECLINE_REASONS.find((x) => x.id === reason);
      declineProposal(p.id, r?.status ?? 'odbijen', r ? r.label : other.trim());
      setStep('odbijeno');
    };
    return (
      <div className="space-y-4 px-4 pt-3 pb-6" data-testid="proposal-decline-form">
        <button type="button" onClick={() => setStep('izbor')} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary">
          <ArrowLeft className="size-4" aria-hidden /> Nazad na termine
        </button>
        <h2 className="text-[22px] leading-tight font-bold">Ne želite servis sada?</h2>
        <section className="rounded-2xl border border-line bg-surface p-4 text-sm" aria-labelledby={`${uid}-info`}>
          <p id={`${uid}-info`} className="flex items-center gap-2 font-semibold">
            <Info className="size-[18px] text-primary" aria-hidden /> Prije odluke
          </p>
          <p className="mt-2">{DECLINE_INFO.intro}</p>
          <p className="mt-2 font-medium">Ako se servis odgodi:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {DECLINE_INFO.points.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="mt-2 text-ink-2">{DECLINE_INFO.outro}</p>
        </section>
        <fieldset>
          <legend className="mb-2 text-[15px] font-semibold">Razlog</legend>
          <div className="space-y-2">
            {[...DECLINE_REASONS.map((r) => ({ id: r.id, label: r.label })), { id: 'drugo', label: 'Drugo' }].map((r) => (
              <label key={r.id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-line-2 bg-surface px-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                <input
                  type="radio"
                  name={`${uid}-reason`}
                  checked={reason === r.id}
                  onChange={() => {
                    setReason(r.id);
                    setError(null);
                  }}
                  className="size-5 accent-[var(--color-primary)]"
                />
                <span className="text-sm font-medium">{r.label}</span>
              </label>
            ))}
          </div>
          {reason === 'drugo' ? (
            <>
              <label htmlFor={`${uid}-other`} className="sr-only">
                Razlog
              </label>
              <input id={`${uid}-other`} value={other} onChange={(e) => setOther(e.target.value)} className={cn(inputClass(), 'mt-2')} maxLength={160} placeholder="Ukratko" />
            </>
          ) : null}
        </fieldset>
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--color-primary)]" />
          <span>Pročitao/la sam informaciju o mogućim posljedicama odgađanja servisa.</span>
        </label>
        {error ? (
          <p className="text-[13px] font-medium text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <div className="pb-safe sticky bottom-0 z-10 -mx-4 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur">
          <Button size="lg" variant="danger" className="w-full" onClick={submit}>
            Simuliraj odgovor: ne sada
          </Button>
        </div>
      </div>
    );
  }

  // izbor termina
  const loc = L.location(p.locationId);
  return (
    <div className="space-y-4 px-4 pt-3 pb-6" data-testid="proposal-choose">
      <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary">
        <ArrowLeft className="size-4" aria-hidden /> Kartica uređaja
      </button>
      <div>
        <p className="text-[13px] font-semibold text-ink-2">Prijedlog termina · {p.id}</p>
        <h2 className="text-[22px] leading-tight font-bold">Vrijeme je za redovni servis</h2>
        <p className="mt-1 text-sm text-ink-2">
          {devices.map((d) => `${d!.name} (${d!.id})`).join(', ')} · {loc?.name}. {dueSentence(p.dueOn, state.anchor)}
        </p>
      </div>
      <fieldset>
        <legend className="mb-2 text-[15px] font-semibold">Odaberite termin</legend>
        <div className="space-y-2">
          {p.slots.map((s, i) => (
            <label key={i} className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-line-2 bg-surface px-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
              <input
                type="radio"
                name={`${uid}-slot`}
                checked={choice === i}
                onChange={() => {
                  setChoice(i);
                  setError(null);
                }}
                className="size-5 accent-[var(--color-primary)]"
              />
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold">{slotLabel(s, p.durationMin)}</span>
                <span className="block text-[13px] text-ink-2">Serviser: {L.technician(s.technicianId)?.name}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {error ? (
        <p className="text-[13px] font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div className="grid gap-2">
        <button type="button" onClick={onOther} className="min-h-11 rounded-xl border border-line-2 bg-surface px-3 text-sm font-semibold hover:bg-bg">
          Nijedan ne odgovara — predložiću drugi termin
        </button>
        <button type="button" onClick={() => setStep('odbijanje')} className="min-h-11 text-sm font-semibold text-ink-2 underline underline-offset-2">
          Ne želim servis sada
        </button>
      </div>
      <div className="pb-safe sticky bottom-0 z-10 -mx-4 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur">
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            if (choice === null) return setError('Odaberite jedan od termina.');
            acceptProposal(p.id, choice);
            setStep('prihvaceno');
          }}
        >
          Simuliraj potvrdu termina
        </Button>
        <p className="mt-1 text-center text-xs text-ink-3">Demo: ništa se ne šalje servisnoj firmi.</p>
      </div>
    </div>
  );
}
