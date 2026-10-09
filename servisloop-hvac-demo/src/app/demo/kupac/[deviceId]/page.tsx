'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, CalendarPlus, CheckCircle2, MapPin } from 'lucide-react';
import { Suspense, useEffect, useId, useRef, useState } from 'react';

import { useGuideSteps } from '@/components/guide';
import { PhotoPicker, type LocalPhoto } from '@/components/photo-picker';
import { DemoTag, Button, ButtonLink, Card, Field, Notice, inputClass, buttonClass } from '@/components/ui';
import { brand } from '@/config/brand';
import { GUIDE_DEVICE_ID } from '@/lib/demo-data';
import { formatLong, relativeDays } from '@/lib/dates';
import { dueStatus, lookup } from '@/lib/derive';
import { useDemo } from '@/lib/store';

type View = 'kartica' | 'servis' | 'kvar';

const SLOTS = ['Prijepodne (08–12)', 'Poslijepodne (12–16)', 'Svejedno'];

function validContact(v: string): boolean {
  const s = v.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return true;
  return s.replace(/\D/g, '').length >= 6;
}

function CustomerInner() {
  const { deviceId: raw } = useParams<{ deviceId: string }>();
  const deviceId = decodeURIComponent(raw);
  const params = useSearchParams();
  const router = useRouter();
  const { state, setGuide, createRequest } = useDemo();
  const L = lookup(state);
  const device = L.device(deviceId);
  const today = state.anchor;
  const { steps, current } = useGuideSteps();
  const inGuide = state.guide.visitedDevice && !state.guide.dismissed;

  const formParam = params.get('forma');
  const [view, setView] = useState<View>(formParam === 'servis' || formParam === 'kvar' ? formParam : 'kartica');
  const [done, setDone] = useState<{ id: string; kind: 'servis' | 'kvar' } | null>(null);

  useEffect(() => {
    if (deviceId === GUIDE_DEVICE_ID && !state.guide.visitedCustomer) setGuide({ visitedCustomer: true });
  }, [deviceId, state.guide.visitedCustomer, setGuide]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view, done]);

  if (!device) {
    return (
      <Card className="p-6 text-center">
        <h1 className="text-xl font-bold">Uređaj nije pronađen</h1>
        <p className="mt-2 text-ink-2">Kartica {deviceId} ne postoji u pokaznom primjeru.</p>
        <ButtonLink href={`/demo/kupac/${GUIDE_DEVICE_ID}`} className="mt-4">
          Otvori primjer uređaja TP-001
        </ButtonLink>
      </Card>
    );
  }

  const loc = L.deviceLocation(device);
  const status = dueStatus(device, today);

  const open = (v: View) => {
    setDone(null);
    setView(v);
    router.replace(v === 'kartica' ? `/demo/kupac/${deviceId}` : `/demo/kupac/${deviceId}?forma=${v}`, { scroll: false });
  };

  const header = (
    <div className="mb-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink-2">
          {brand.companyName} <span className="text-ink-3">— demo firma</span>
        </p>
        <DemoTag />
      </div>
    </div>
  );

  if (done) {
    return (
      <>
        {header}
        <Card className="p-5" data-testid="request-confirmation">
          <CheckCircle2 className="size-10 text-ok" aria-hidden />
          <h1 className="mt-3 text-xl font-bold">{done.kind === 'servis' ? 'Primjer zahtjeva je prikazan' : 'Primjer prijave kvara je prikazan'}</h1>
          <p className="mt-2 text-[15px]" role="status">
            {done.kind === 'servis' ? (
              <>
                Prikazan je primjer zahtjeva <strong>{done.id}</strong>. Nije poslan servisnoj firmi.
              </>
            ) : (
              <>
                Ovo je primjer prijave kvara. Stvarna intervencija nije naručena.
                <span className="mt-1 block text-sm text-ink-2">
                  Demo broj prijave: <strong className="text-ink">{done.id}</strong>
                </span>
              </>
            )}
          </p>
          <Notice tone="demo" className="mt-4">
            U ovom browser tabu demo zahtjev se sada vidi i u vlasničkom pregledu. Na drugom uređaju ili u novom tabu ne pojavljuje se — ovo je lokalna simulacija.
          </Notice>
          <div className="mt-5 grid gap-2">
            <ButtonLink href={`/demo/zahtjevi?istakni=${done.id}`} size="lg">
              Pogledaj kako ga vidi vlasnik
            </ButtonLink>
            <Button variant="secondary" size="lg" onClick={() => open('kartica')}>
              Nazad na karticu uređaja
            </Button>
          </div>
        </Card>
      </>
    );
  }

  if (view !== 'kartica') {
    return (
      <>
        {header}
        <button type="button" onClick={() => open('kartica')} className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary">
          <ArrowLeft className="size-4" aria-hidden /> Nazad na karticu uređaja
        </button>
        <RequestForm
          kind={view}
          deviceLabel={`${device.id} · ${loc?.name ?? ''}`}
          minDate={today}
          onSubmit={(input) => {
            const id = createRequest({ ...input, deviceId: device.id, kind: view });
            setDone({ id, kind: view });
          }}
        />
      </>
    );
  }

  return (
    <>
      {header}
      <p className="text-sm font-semibold text-ink-2">Vaš uređaj</p>
      <h1 className="text-[26px] leading-tight font-bold tracking-tight">
        {device.id} · {loc?.name}
      </h1>
      <p className="mt-1 text-ink-2">
        {device.typeLabel} · {device.name}
      </p>

      <Notice tone="demo" className="mt-4">
        Ovo je demo kartica. Možete probati obrazac, ali zahtjev neće biti poslan servisnoj firmi.
      </Notice>

      <Card className="mt-4 p-4">
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Prethodni servis</dt>
            <dd className="mt-0.5 font-medium">{device.lastServiceOn ? formatLong(device.lastServiceOn) : 'Još nije bilo servisa'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Sljedeći servis</dt>
            <dd className="mt-0.5 font-medium">{formatLong(device.nextServiceOn)}</dd>
            <dd className={status === 'zakasnio' ? 'text-sm font-semibold text-danger' : 'text-sm text-ink-2'}>
              {status === 'zakasnio' ? `Rok je prošao (${relativeDays(device.nextServiceOn, today)})` : relativeDays(device.nextServiceOn, today)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 flex items-start gap-2 border-t border-line pt-3 text-sm text-ink-2">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {loc?.name}
            <br />
            {loc?.address}, {loc?.city}
          </span>
        </p>
      </Card>

      <div className="mt-4 grid gap-3">
        <Button size="lg" className="min-h-14 text-[17px]" onClick={() => open('servis')}>
          <CalendarPlus aria-hidden /> Pogledaj primjer zakazivanja
        </Button>
        <Button size="lg" variant="secondary" className="min-h-14 text-[17px]" onClick={() => open('kvar')}>
          <AlertTriangle aria-hidden /> Pogledaj primjer prijave kvara
        </Button>
      </div>

      {inGuide ? (
        <div className="mt-6 rounded-xl border border-primary/20 bg-primary-soft p-4 text-sm">
          <p className="font-semibold">
            Vodič: {current < steps.length ? `korak ${current + 1} od ${steps.length} — ${steps[current]?.title}` : 'završen'}
          </p>
          <p className="mt-1 text-ink-2">Promjene u ovom tabu vide se i u prikazu vlasnika i servisera.</p>
          <Link href="/demo" className={buttonClass('secondary', 'sm', 'mt-3')}>
            Prikaz vlasnika
          </Link>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-line bg-surface p-4 text-sm">
          <p>QR otvara pokaznu karticu uređaja. Za cijeli povezani primjer vratite se na demo vodič.</p>
          <Link href="/demo" className={buttonClass('secondary', 'sm', 'mt-3')}>
            Otvori demo vodič
          </Link>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-ink-3">
        Uređaj u primjeru servisira {brand.companyName} (demo firma). Svi podaci su izmišljeni.
        <br />
        <Link href="/" className="font-semibold text-primary underline underline-offset-2">
          O demou {brand.productName}
        </Link>
      </p>
    </>
  );
}

interface RequestFormValues {
  name: string;
  contact: string;
  preferredDate: string;
  preferredSlot: string;
  note: string;
  errorCode: string;
}

function RequestForm({
  kind,
  deviceLabel,
  minDate,
  onSubmit,
}: {
  kind: 'servis' | 'kvar';
  deviceLabel: string;
  minDate: string;
  onSubmit: (v: { name: string; contact: string; preferredDate: string | null; preferredSlot: string; note: string; errorCode: string; photo: LocalPhoto | null }) => void;
}) {
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [v, setV] = useState<RequestFormValues>({ name: '', contact: '', preferredDate: '', preferredSlot: '', note: '', errorCode: '' });
  const [photo, setPhoto] = useState<LocalPhoto | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof RequestFormValues, string>>>({});

  const set = (k: keyof RequestFormValues, value: string) => {
    setV((p) => ({ ...p, [k]: value }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

  function validate() {
    const e: Partial<Record<keyof RequestFormValues, string>> = {};
    if (v.name.trim().length < 2) e.name = 'Unesite ime i prezime.';
    if (!v.contact.trim()) e.contact = 'Unesite telefon ili e-mail za kontakt.';
    else if (!validContact(v.contact)) e.contact = 'Unesite ispravan e-mail ili broj telefona (najmanje 6 cifara).';
    if (kind === 'servis') {
      if (!v.preferredDate) e.preferredDate = 'Odaberite željeni datum.';
      else if (v.preferredDate < minDate) e.preferredDate = 'Datum ne može biti u prošlosti.';
      if (!v.preferredSlot) e.preferredSlot = 'Odaberite željeni termin.';
    } else if (v.note.trim().length < 10) {
      e.note = 'Opišite problem u nekoliko riječi (najmanje 10 znakova).';
    }
    return e;
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      document.getElementById(`${uid}-${first}`)?.focus();
      return;
    }
    onSubmit({
      name: v.name.trim(),
      contact: v.contact.trim(),
      preferredDate: kind === 'servis' ? v.preferredDate : null,
      preferredSlot: kind === 'servis' ? v.preferredSlot : '',
      note: v.note.trim(),
      errorCode: v.errorCode.trim(),
      photo: kind === 'kvar' ? photo : null,
    });
  }

  const err = (k: keyof RequestFormValues) => ({
    'aria-invalid': Boolean(errors[k]),
    'aria-describedby': errors[k] ? `${uid}-${k}-error` : undefined,
  });

  return (
    <form ref={formRef} noValidate onSubmit={submit} className="pb-24">
      <h1 className="text-[24px] leading-tight font-bold tracking-tight">{kind === 'servis' ? 'Primjer zakazivanja servisa' : 'Primjer prijave kvara'}</h1>
      <p className="mt-1 text-ink-2">{deviceLabel}</p>
      <Notice tone="demo" className="mt-3">
        {kind === 'servis' ? 'Obrazac možete probati, ali zahtjev neće biti poslan servisnoj firmi.' : 'Ovo je pokazni obrazac. Nema automatske dijagnoze niti stvarnog naručivanja intervencije.'}
      </Notice>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          className="min-h-9 text-sm font-semibold text-primary underline underline-offset-2"
          onClick={() => {
            setV((p) => ({
              ...p,
              name: 'Demo Kupac',
              contact: 'kupac@example.test',
              preferredDate: kind === 'servis' ? minDate : p.preferredDate,
              preferredSlot: kind === 'servis' ? SLOTS[0]! : p.preferredSlot,
              note: kind === 'kvar' ? 'Uređaj se ne uključuje nakon nestanka struje (primjer opisa).' : p.note,
            }));
            setErrors({});
          }}
        >
          Popuni primjerom
        </button>
      </div>

      <div className="mt-2 space-y-4">
        <Field label="Ime i prezime" htmlFor={`${uid}-name`} required error={errors.name}>
          <input id={`${uid}-name`} autoComplete="name" value={v.name} onChange={(e) => set('name', e.target.value)} className={inputClass(Boolean(errors.name))} maxLength={80} {...err('name')} />
        </Field>
        <Field label="Telefon ili e-mail" htmlFor={`${uid}-contact`} required error={errors.contact} hint="Samo za primjer — niko vas neće kontaktirati.">
          <input id={`${uid}-contact`} value={v.contact} onChange={(e) => set('contact', e.target.value)} className={inputClass(Boolean(errors.contact))} maxLength={80} {...err('contact')} />
        </Field>

        {kind === 'servis' ? (
          <>
            <Field label="Željeni datum" htmlFor={`${uid}-preferredDate`} required error={errors.preferredDate}>
              <input id={`${uid}-preferredDate`} type="date" min={minDate} value={v.preferredDate} onChange={(e) => set('preferredDate', e.target.value)} className={inputClass(Boolean(errors.preferredDate))} {...err('preferredDate')} />
            </Field>
            <Field label="Željeni termin" htmlFor={`${uid}-preferredSlot`} required error={errors.preferredSlot}>
              <select id={`${uid}-preferredSlot`} value={v.preferredSlot} onChange={(e) => set('preferredSlot', e.target.value)} className={inputClass(Boolean(errors.preferredSlot))} {...err('preferredSlot')}>
                <option value="">Odaberite…</option>
                {SLOTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Napomena" htmlFor={`${uid}-note`}>
              <textarea id={`${uid}-note`} rows={4} value={v.note} onChange={(e) => set('note', e.target.value)} className={inputClass()} maxLength={600} />
            </Field>
          </>
        ) : (
          <>
            <Field label="Opis problema" htmlFor={`${uid}-note`} required error={errors.note} hint="Šta se dešava i od kada.">
              <textarea id={`${uid}-note`} rows={5} value={v.note} onChange={(e) => set('note', e.target.value)} className={inputClass(Boolean(errors.note))} maxLength={1000} {...err('note')} />
            </Field>
            <Field label="Kod greške sa upravljača" htmlFor={`${uid}-errorCode`} hint="Ako ga uređaj prikazuje, prepišite ga tačno.">
              <input id={`${uid}-errorCode`} value={v.errorCode} onChange={(e) => set('errorCode', e.target.value)} className={inputClass()} maxLength={30} />
            </Field>
            <PhotoPicker label="Fotografija" photo={photo} onChange={setPhoto} />
          </>
        )}
      </div>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto max-w-[480px] px-4 py-3">
          <Button type="submit" size="lg" className="w-full">
            {kind === 'servis' ? 'Simuliraj slanje zahtjeva' : 'Simuliraj prijavu kvara'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default function CustomerPage() {
  return (
    <Suspense>
      <CustomerInner />
    </Suspense>
  );
}
