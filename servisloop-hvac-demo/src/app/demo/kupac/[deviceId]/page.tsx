'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, CalendarPlus, Check, CheckCircle2, ChevronRight, MapPin, Pencil, Smartphone, Thermometer } from 'lucide-react';
import { Suspense, useEffect, useId, useState } from 'react';

import { CustomerProposal } from '@/components/customer-proposal';
import { useGuideSteps } from '@/components/guide';
import { PhotoPicker, type LocalPhoto } from '@/components/photo-picker';
import { useQr } from '@/components/qr-panel';
import { Button, ButtonLink, Card, DemoTag, Field, Notice, Skeleton, buttonClass, inputClass } from '@/components/ui';
import { brand } from '@/config/brand';
import { cn } from '@/lib/cn';
import { GUIDE_DEVICE_ID } from '@/lib/demo-data';
import { formatLong, formatShort, relativeDays } from '@/lib/dates';
import { dueStatus, endTime, lookup, resolveCode } from '@/lib/derive';
import { useDemo } from '@/lib/store';
import type { ServiceRequest } from '@/lib/types';

type View = 'kartica' | 'servis' | 'kvar' | 'poslano' | 'prijedlog';

const SYMPTOMS = ['Ne grije', 'Ne hladi', 'Ne uključuje se', 'Curi voda', 'Čudan zvuk ili miris', 'Greška na ekranu', 'Drugo'];
const SLOTS = ['Prijepodne (08–12)', 'Poslijepodne (12–16)', 'Svejedno'];

function validContact(v: string): boolean {
  const s = v.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return true;
  return s.replace(/\D/g, '').length >= 6;
}

/* ------------------------------------------------------------------ */
/* Stranica                                                            */
/* ------------------------------------------------------------------ */

function CustomerInner() {
  const { deviceId: raw } = useParams<{ deviceId: string }>();
  const code = decodeURIComponent(raw);
  const params = useSearchParams();
  const router = useRouter();
  const { state, setGuide } = useDemo();
  // QR s prazne naljepnice (N-0001) vodi na uređaj s kojim je naljepnica povezana.
  const resolved = resolveCode(state, code.toUpperCase());
  const deviceId = resolved.kind === 'label' ? (resolved.deviceId ?? code) : code;
  const device = lookup(state).device(deviceId);

  const formParam = params.get('forma');
  const proposalParam = params.get('prijedlog');
  const [view, setView] = useState<View>(proposalParam ? 'prijedlog' : formParam === 'servis' || formParam === 'kvar' ? formParam : 'kartica');
  const [sentId, setSentId] = useState<string | null>(null);
  const [proposalId, setProposalId] = useState<string | null>(proposalParam);

  useEffect(() => {
    if (deviceId === GUIDE_DEVICE_ID && !state.guide.visitedCustomer) setGuide({ visitedCustomer: true });
  }, [deviceId, state.guide.visitedCustomer, setGuide]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.getElementById('kupac-ekran')?.scrollTo({ top: 0 });
  }, [view]);

  const go = (v: View, id?: string) => {
    if (v === 'prijedlog' && id) setProposalId(id);
    else if (id) setSentId(id);
    setView(v);
    if (v === 'prijedlog') router.replace(`/demo/kupac/${code}?prijedlog=${id ?? proposalId}`, { scroll: false });
    else if (v !== 'poslano') router.replace(v === 'kartica' ? `/demo/kupac/${code}` : `/demo/kupac/${code}?forma=${v}`, { scroll: false });
  };

  if (resolved.kind === 'label' && !resolved.deviceId && state.labels.some((l) => l.code === code.toUpperCase())) {
    return (
      <Card className="mx-4 mt-6 p-6 sm:mx-auto sm:max-w-md" data-testid="unlinked-label">
        <p className="text-sm font-semibold text-ink-2">{brand.companyName}</p>
        <h1 className="mt-1 text-xl font-bold">Naljepnica {code.toUpperCase()} još nije povezana s uređajem</h1>
        <p className="mt-2 text-ink-2">
          Ova naljepnica je iz kompleta servisne firme. Serviser je povezuje s uređajem pri ugradnji ili servisu — nakon toga ovdje se otvara stranica uređaja.
        </p>
        <p className="mt-2 text-sm text-ink-2">Serviser: u nalogu odaberite „Novi uređaj na objektu” i skenirajte ovu naljepnicu.</p>
        <ButtonLink href="/demo/naljepnice" variant="secondary" className="mt-4">
          Komplet praznih naljepnica (demo)
        </ButtonLink>
      </Card>
    );
  }

  if (!device) {
    return (
      <Card className="mx-4 mt-6 p-6 text-center sm:mx-auto sm:max-w-md">
        <h1 className="text-xl font-bold">Uređaj nije pronađen</h1>
        <p className="mt-2 text-ink-2">Kartica {deviceId} ne postoji u pokaznom primjeru.</p>
        <ButtonLink href={`/demo/kupac/${GUIDE_DEVICE_ID}`} className="mt-4">
          Otvori primjer uređaja TP-001
        </ButtonLink>
      </Card>
    );
  }

  const step = view === 'kartica' ? 3 : view === 'poslano' ? 5 : 4;
  const proposalStatus = view === 'prijedlog' && proposalId ? state.proposals.find((p) => p.id === proposalId)?.status : undefined;
  const proposalStep = proposalStatus && proposalStatus !== 'poslan' ? 5 : 4;

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start lg:gap-10">
      <Explainer deviceId={device.id} step={view === 'prijedlog' ? proposalStep : step} sentId={sentId} proposal={view === 'prijedlog'} />
      <PhoneFrame deviceId={device.id}>
        <CustomerApp deviceId={device.id} view={view} sentId={sentId} proposalId={proposalId} go={go} />
      </PhoneFrame>
    </div>
  );
}

export default function CustomerPage() {
  return (
    <Suspense>
      <CustomerInner />
    </Suspense>
  );
}

/* ------------------------------------------------------------------ */
/* Objašnjenje demoa (desktop: lijevo; telefon: sklopivo na vrhu)      */
/* ------------------------------------------------------------------ */

const PROPOSAL_STEPS = [
  { title: 'Rok servisa se približava', text: 'Plan servisa ga računa automatski iz intervala.' },
  { title: 'Firma šalje prijedlog termina', text: 'E-mail ili SMS s linkom i 2–3 slobodna termina.' },
  { title: 'Kupac otvara link iz poruke', text: 'Ista stranica uređaja, bez prijave.' },
  { title: 'Kupac bira termin ili odbija', text: 'Uz jasno objašnjenje šta znači odgađanje.' },
  { title: 'Odgovor stiže vlasniku', text: 'Odabrani termin odmah postaje radni nalog.' },
];

const STEPS = [
  { title: 'Na uređaju je QR naljepnica', text: 'Firma je zalijepi pri ugradnji ili servisu.' },
  { title: 'Kupac je skenira kamerom telefona', text: 'Bez aplikacije, registracije i lozinke.' },
  { title: 'Otvara se stranica uređaja', text: 'Tačno ono što kupac vidi na telefonu.' },
  { title: 'Kupac prijavi kvar ili zakaže servis', text: 'Izbor problema i jedno dugme.' },
  { title: 'Zahtjev stiže vlasniku firme', text: 'Pojavi se u „Zahtjevi” i u pregledu vlasnika.' },
];

function StepList({ step, proposal = false }: { step: number; proposal?: boolean }) {
  return (
    <ol className="space-y-1">
      {(proposal ? PROPOSAL_STEPS : STEPS).map((s, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <li key={s.title} className={cn('flex gap-3 rounded-xl px-2 py-2', active && 'bg-primary-soft')} aria-current={active ? 'step' : undefined}>
            <span
              className={cn(
                'mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                done ? 'bg-ok text-white' : active ? 'bg-primary text-white' : 'border border-line-2 bg-surface text-ink-2',
              )}
              aria-hidden
            >
              {done ? <Check className="size-3.5" /> : n}
            </span>
            <span className="min-w-0">
              <span className={cn('block text-sm font-semibold', active ? 'text-ink' : done ? 'text-ink-2' : 'text-ink')}>{s.title}</span>
              <span className="block text-[13px] text-ink-2">{s.text}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Explainer({ deviceId, step, sentId, proposal }: { deviceId: string; step: number; sentId: string | null; proposal: boolean }) {
  const { state } = useDemo();
  const { url, png } = useQr(deviceId, 300);
  const guide = useGuideSteps();
  const others = state.devices.filter((d) => ['TP-001', 'KL-002', 'KL-012'].includes(d.id) && d.id !== deviceId);
  const guideActive = state.guide.visitedDevice && !state.guide.dismissed && guide.current < guide.steps.length;

  const ownerLink = sentId ? `/demo/zahtjevi?istakni=${sentId}` : '/demo/zahtjevi';

  return (
    <>
      {/* Telefon: kratko objašnjenje koje se otvara na dodir */}
      <details className="no-print group mx-3 my-3 rounded-xl border border-line bg-surface lg:hidden" data-testid="customer-explainer-mobile">
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 text-sm font-semibold">
          <Smartphone className="size-[18px] text-primary" aria-hidden />
          <span className="flex-1">
            Demo: ovo je stranica koju kupac dobije {proposal ? 'iz poruke s prijedlogom termina' : 'skeniranjem QR koda'} (korak {step} od 5)
          </span>
          <ChevronRight className="size-4 shrink-0 transition-transform group-open:rotate-90" aria-hidden />
        </summary>
        <div className="border-t border-line px-2 py-2">
          <StepList step={step} proposal={proposal} />
          {sentId ? (
            <Link href={ownerLink} className={buttonClass('primary', 'sm', 'm-2')}>
              Pogledaj kako zahtjev stiže vlasniku
            </Link>
          ) : null}
          <p className="px-2 pb-2 text-[13px] text-ink-3">Na drugom telefonu ili u novom tabu demo počinje od početnog primjera — ništa se ne sinhronizuje.</p>
        </div>
      </details>

      {/* Desktop: objašnjenje lijevo */}
      <aside className="no-print hidden lg:block" aria-label="Kako radi prikaz kupca" data-testid="customer-explainer">
        <p className="text-sm font-semibold text-primary">Prikaz kupca</p>
        <h1 className="mt-1 text-[28px] leading-tight font-bold tracking-tight">
          {proposal ? 'Ovo kupac vidi kada otvori link iz poruke s prijedlogom termina' : 'Ovo kupac vidi kada skenira QR kod na uređaju'}
        </h1>
        <p className="mt-2 text-ink-2">Desno je stranica u telefonu kupca. Probajte prijavu kvara ili zakazivanje — u istom tabu zahtjev zatim vidite kod vlasnika.</p>

        <div className="mt-5 rounded-2xl border border-line bg-surface p-3">
          <StepList step={step} proposal={proposal} />
        </div>

        <div className="mt-5 flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
          <div className="shrink-0 rounded-lg border border-line bg-white p-1">
            {png ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={png} alt={`QR kod za ${deviceId}`} className="size-28" />
            ) : (
              <Skeleton className="size-28" />
            )}
          </div>
          <div className="min-w-0 text-sm">
            <p className="font-semibold">Probajte svojim telefonom</p>
            <p className="mt-1 text-ink-2">Skenirajte kod kamerom telefona — otvoriće se ista stranica uređaja {deviceId}.</p>
            <p className="mt-1 font-mono text-[11px] break-all text-ink-3">{url}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={ownerLink} className={buttonClass(sentId ? 'primary' : 'secondary', 'sm')}>
            {sentId ? 'Pogledaj kako zahtjev stiže vlasniku' : 'Zahtjevi kod vlasnika'}
          </Link>
          {others.map((d) => (
            <Link key={d.id} href={`/demo/kupac/${d.id}`} className={buttonClass('ghost', 'sm')}>
              Kartica {d.id}
            </Link>
          ))}
        </div>
        {guideActive ? (
          <p className="mt-4 text-sm text-ink-2">
            Vodič kroz demo: korak {guide.current + 1} od 5 — {guide.steps[guide.current]?.title}.
          </p>
        ) : null}
      </aside>
    </>
  );
}

function PhoneFrame({ deviceId, children }: { deviceId: string; children: React.ReactNode }) {
  const [host, setHost] = useState('');
  useEffect(() => setHost(window.location.host), []);
  return (
    <div className="lg:sticky lg:top-6">
      <div className="lg:overflow-hidden lg:rounded-[44px] lg:border-[10px] lg:border-nav lg:bg-nav lg:shadow-[0_30px_60px_-20px_rgb(16_24_40/0.45)]">
        <div className="hidden items-center gap-2 bg-nav px-4 pt-1 pb-2 lg:flex" aria-hidden>
          <span className="flex-1 truncate rounded-full bg-white/10 px-3 py-1 text-center text-[11px] text-nav-ink">
            {host}/demo/kupac/{deviceId}
          </span>
        </div>
        <div id="kupac-ekran" className="relative bg-bg lg:h-[min(780px,calc(100dvh-170px))] lg:overflow-y-auto lg:rounded-[30px]" data-testid="customer-screen">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ono što kupac vidi                                                  */
/* ------------------------------------------------------------------ */

function CustomerApp({
  deviceId,
  view,
  sentId,
  proposalId,
  go,
}: {
  deviceId: string;
  view: View;
  sentId: string | null;
  proposalId: string | null;
  go: (v: View, id?: string) => void;
}) {
  const { state, createRequest } = useDemo();
  const L = lookup(state);
  const device = L.device(deviceId)!;
  const loc = L.deviceLocation(device);
  const cust = L.deviceCustomer(device);
  const today = state.anchor;
  const status = dueStatus(device, today);
  const latest = state.requests.find((r) => r.deviceId === deviceId && r.fromSimulation);
  const pending = state.proposals.find((p) => p.deviceIds.includes(deviceId) && p.status === 'poslan');

  const companyBar = (
    <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold text-white" style={{ background: brand.colors.primary }} aria-hidden>
        {brand.logoInitials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold">{brand.companyName}</p>
        <p className="truncate text-xs text-ink-2">Servis klima i toplotnih pumpi · demo firma</p>
      </div>
      <DemoTag />
    </div>
  );

  if (view === 'poslano' && sentId) {
    const r = L.request(sentId);
    return (
      <>
        {companyBar}
        <div className="px-4 py-5" data-testid="request-confirmation">
          <CheckCircle2 className="size-11 text-ok" aria-hidden />
          <h2 className="mt-2 text-[22px] leading-tight font-bold">{r?.kind === 'kvar' ? 'Prijava kvara je zabilježena' : 'Zahtjev za servis je zabilježen'}</h2>
          <p className="mt-2 text-[15px]" role="status">
            {r?.kind === 'kvar' ? (
              <>
                Ovo je primjer prijave kvara. Stvarna intervencija nije naručena.
                <span className="mt-1 block text-sm text-ink-2">
                  Demo broj prijave: <strong className="text-ink">{sentId}</strong>
                </span>
              </>
            ) : (
              <>
                Prikazan je primjer zahtjeva <strong>{sentId}</strong>. Nije poslan servisnoj firmi.
              </>
            )}
          </p>
          {r ? <RequestStatus request={r} /> : null}
          <Notice tone="demo" className="mt-4">
            U ovom tabu prijava se odmah pojavljuje kod vlasnika firme. Na drugom uređaju ne — ovo je lokalna simulacija.
          </Notice>
          <div className="mt-5 grid gap-2">
            <ButtonLink href={`/demo/zahtjevi?istakni=${sentId}`} size="lg">
              Pogledaj kako ga vidi vlasnik
            </ButtonLink>
            <Button variant="secondary" size="lg" onClick={() => go('kartica')}>
              Nazad na karticu uređaja
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (view === 'prijedlog' && proposalId) {
    return (
      <>
        {companyBar}
        <CustomerProposal proposalId={proposalId} onBack={() => go('kartica')} onOther={() => go('servis')} />
      </>
    );
  }

  if (view === 'servis' || view === 'kvar') {
    return (
      <>
        {companyBar}
        <RequestForm
          kind={view}
          deviceLabel={`${device.id} · ${device.name}`}
          minDate={today}
          known={cust ? { name: cust.name, contact: cust.email } : null}
          onBack={() => go('kartica')}
          onSubmit={(input) => {
            const id = createRequest({ ...input, deviceId: device.id, kind: view });
            go('poslano', id);
          }}
        />
      </>
    );
  }

  return (
    <>
      {companyBar}
      <div className="space-y-4 px-4 py-4">
        <section className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-card)]" aria-labelledby="vas-uredaj">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary" aria-hidden>
              <Thermometer className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-ink-2">Vaš uređaj</p>
              <h2 id="vas-uredaj" className="text-xl leading-tight font-bold">
                {device.name}
              </h2>
              <p className="text-sm text-ink-2">
                {device.typeLabel} · {device.id}
              </p>
            </div>
          </div>
          <p className="mt-3 flex items-start gap-2 text-sm text-ink-2">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
            {loc?.name}, {loc?.address}, {loc?.city}
          </p>
          {device.status === 'ugradnja' ? (
            <div className="mt-3 rounded-xl bg-primary-soft px-3 py-2.5 text-sm text-primary-hover">
              <p className="font-semibold">Uređaj je najavljen za ugradnju: {formatShort(device.installedOn)}</p>
              <p className="text-ink-2">Nakon ugradnje ovdje će biti rok prvog servisa.</p>
            </div>
          ) : (
            <div
              className={cn(
                'mt-3 rounded-xl px-3 py-2.5 text-sm',
                status === 'zakasnio' ? 'bg-danger-soft text-danger' : status === 'uredu' ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn',
              )}
            >
              <p className="font-semibold">
                {status === 'zakasnio' ? 'Redovni servis je zakasnio' : 'Sljedeći redovni servis'}: {formatShort(device.nextServiceOn)} ({relativeDays(device.nextServiceOn, today)})
              </p>
              <p className="text-ink-2">Posljednji servis: {device.lastServiceOn ? formatLong(device.lastServiceOn) : 'još nije bilo'}</p>
            </div>
          )}
        </section>

        {pending ? (
          <section className="rounded-2xl border-2 border-primary/40 bg-surface p-4 shadow-[var(--shadow-card)]" aria-labelledby="prijedlog-kartica" data-testid="pending-proposal">
            <p className="text-[13px] font-semibold text-primary">Prijedlog termina od servisa</p>
            <h2 id="prijedlog-kartica" className="text-lg font-bold">
              Odaberite termin za redovni servis
            </h2>
            <p className="mt-1 text-sm text-ink-2">
              Ponuđeno {pending.slots.length} termina · rok {formatShort(pending.dueOn)} ({relativeDays(pending.dueOn, today)})
            </p>
            <Button className="mt-3 w-full" onClick={() => go('prijedlog', pending.id)}>
              Odaberi termin
            </Button>
          </section>
        ) : null}

        {latest ? <RequestStatus request={latest} compact /> : null}

        <section aria-labelledby="pomoc">
          <h2 id="pomoc" className="mb-2 text-base font-bold">
            Kako vam možemo pomoći?
          </h2>
          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => go('kvar')}
              className="flex min-h-[76px] items-center gap-3 rounded-2xl border border-danger/25 bg-surface p-4 text-left shadow-[var(--shadow-card)] hover:border-danger/50"
            >
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger" aria-hidden>
                <AlertTriangle className="size-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-bold">Prijavi kvar</span>
                <span className="block text-sm text-ink-2">Uređaj ne radi kako treba</span>
              </span>
              <ChevronRight className="size-5 text-ink-3" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go('servis')}
              className="flex min-h-[76px] items-center gap-3 rounded-2xl border border-primary/25 bg-surface p-4 text-left shadow-[var(--shadow-card)] hover:border-primary/50"
            >
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary" aria-hidden>
                <CalendarPlus className="size-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-bold">Zakaži servis</span>
                <span className="block text-sm text-ink-2">Redovno održavanje uređaja</span>
              </span>
              <ChevronRight className="size-5 text-ink-3" aria-hidden />
            </button>
          </div>
          <p className="mt-2 text-[13px] text-ink-2">Ovo je demo kartica. Možete probati obrazac, ali zahtjev neće biti poslan servisnoj firmi.</p>
        </section>

        {device.history.length ? (
          <section className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-card)]" aria-labelledby="historija-kupac">
            <h2 id="historija-kupac" className="text-base font-bold">
              Servisna historija
            </h2>
            <ul className="mt-2 divide-y divide-line">
              {device.history.slice(0, 3).map((h, i) => (
                <li key={`${h.date}-${i}`} className="py-2 text-sm">
                  <span className="font-semibold">{formatShort(h.date)}</span> · {h.title}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="pb-2 text-center text-xs text-ink-3">
          {brand.companyName} (demo firma) · svi podaci su izmišljeni
        </p>
      </div>
    </>
  );
}

/** Status prijave kako ga kupac prati (prikaz u istom tabu). */
function RequestStatus({ request, compact = false }: { request: ServiceRequest; compact?: boolean }) {
  const { state } = useDemo();
  const L = lookup(state);
  const order = request.workOrderId ? L.workOrder(request.workOrderId) : undefined;
  const tech = order ? L.technician(order.technicianId) : undefined;
  const steps = [
    { label: 'Prijava zabilježena (demo)', done: true },
    {
      label: request.status === 'odbijen' ? 'Firma je odbila termin (demo)' : request.status === 'potvrdjen' ? 'Firma je potvrdila' : 'Firma pregleda prijavu',
      done: request.status !== 'na_cekanju',
    },
    {
      label: order ? `Termin: ${formatShort(order.date)} u ${order.start}–${endTime(order)}${tech ? ` · ${tech.name}` : ''}` : 'Dobijate termin',
      done: Boolean(order),
    },
    { label: order?.status === 'zavrsen' ? 'Servis obavljen' : 'Serviser dolazi', done: order?.status === 'zavrsen' },
  ];
  return (
    <section className={cn('rounded-2xl bg-surface p-4', compact ? 'shadow-[var(--shadow-card)]' : 'mt-4 border border-line')} aria-label="Status prijave" data-testid="request-status">
      <p className="text-sm font-bold">
        Vaša prijava {request.id} · {request.kind === 'kvar' ? request.symptom || 'kvar' : 'servis'}
      </p>
      <ol className="mt-2 space-y-1.5">
        {steps.map((s, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span className={cn('inline-flex size-5 shrink-0 items-center justify-center rounded-full', s.done ? 'bg-ok text-white' : 'border border-line-2')} aria-hidden>
              {s.done ? <Check className="size-3" /> : null}
            </span>
            <span className={s.done ? 'text-ink' : 'text-ink-2'}>{s.label}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Obrasci                                                             */
/* ------------------------------------------------------------------ */

interface Submit {
  name: string;
  contact: string;
  preferredDate: string | null;
  preferredSlot: string;
  note: string;
  errorCode: string;
  photo: LocalPhoto | null;
  symptom: string;
  urgent: boolean;
}

function RequestForm({
  kind,
  deviceLabel,
  minDate,
  known,
  onBack,
  onSubmit,
}: {
  kind: 'servis' | 'kvar';
  deviceLabel: string;
  minDate: string;
  known: { name: string; contact: string } | null;
  onBack: () => void;
  onSubmit: (v: Submit) => void;
}) {
  const uid = useId();
  const [name, setName] = useState(known?.name ?? '');
  const [contact, setContact] = useState(known?.contact ?? '');
  const [editContact, setEditContact] = useState(!known);
  const [symptom, setSymptom] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [note, setNote] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [photo, setPhoto] = useState<LocalPhoto | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const clear = (k: string) => setErrors((e) => ({ ...e, [k]: undefined }));

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = 'Unesite ime i prezime.';
    if (!contact.trim()) e.contact = 'Unesite telefon ili e-mail za kontakt.';
    else if (!validContact(contact)) e.contact = 'Unesite ispravan e-mail ili broj telefona (najmanje 6 cifara).';
    if (kind === 'kvar') {
      if (!symptom) e.symptom = 'Odaberite šta se dešava s uređajem.';
      if (symptom === 'Drugo' && note.trim().length < 5) e.note = 'Ukratko opišite problem.';
    } else {
      if (!date) e.date = 'Odaberite željeni datum.';
      else if (date < minDate) e.date = 'Datum ne može biti u prošlosti.';
      if (!slot) e.slot = 'Odaberite željeni termin.';
    }
    setErrors(e);
    if (e.name || e.contact) setEditContact(true);
    const first = Object.keys(e)[0];
    if (first) {
      setTimeout(() => document.getElementById(`${uid}-${first}`)?.focus(), 0);
      return;
    }
    onSubmit({
      name: name.trim(),
      contact: contact.trim(),
      preferredDate: kind === 'servis' ? date : null,
      preferredSlot: kind === 'servis' ? slot : '',
      note: note.trim(),
      errorCode: errorCode.trim(),
      photo: kind === 'kvar' ? photo : null,
      symptom: kind === 'kvar' ? symptom : '',
      urgent: kind === 'kvar' ? urgent : false,
    });
  }

  const describe = (k: string) => ({ 'aria-invalid': Boolean(errors[k]), 'aria-describedby': errors[k] ? `${uid}-${k}-error` : undefined });

  return (
    <form noValidate onSubmit={submit}>
      <div className="space-y-5 px-4 pt-3 pb-6">
        <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary">
          <ArrowLeft className="size-4" aria-hidden /> Nazad
        </button>
        <div>
          <h2 className="text-[22px] leading-tight font-bold">{kind === 'kvar' ? 'Prijava kvara' : 'Zakazivanje servisa'}</h2>
          <p className="text-sm text-ink-2">{deviceLabel}</p>
        </div>

        {kind === 'kvar' ? (
          <>
            <fieldset aria-describedby={errors.symptom ? `${uid}-symptom-error` : undefined}>
              <legend className="mb-2 text-[15px] font-semibold">
                Šta se dešava? <span className="text-danger">*</span>
              </legend>
              <div className="grid grid-cols-2 gap-2" id={`${uid}-symptom`} tabIndex={-1}>
                {SYMPTOMS.map((s) => (
                  <label key={s} className={cn('relative', s === 'Drugo' && 'col-span-2')}>
                    <input
                      type="radio"
                      name={`${uid}-sym`}
                      value={s}
                      checked={symptom === s}
                      onChange={() => {
                        setSymptom(s);
                        clear('symptom');
                      }}
                      className="peer sr-only"
                    />
                    <span className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-line-2 bg-surface px-2 text-center text-[15px] font-semibold peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:text-primary-hover peer-focus-visible:outline-2 peer-focus-visible:outline-primary">
                      {s}
                    </span>
                  </label>
                ))}
              </div>
              {errors.symptom ? (
                <p id={`${uid}-symptom-error`} className="mt-1.5 text-[13px] font-medium text-danger" role="alert">
                  {errors.symptom}
                </p>
              ) : null}
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-[15px] font-semibold">Uređaj trenutno</legend>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: true, l: 'Ne radi uopšte' },
                  { v: false, l: 'Radi, ali s problemom' },
                ].map((o) => (
                  <label key={o.l} className="relative">
                    <input type="radio" name={`${uid}-urg`} checked={urgent === o.v} onChange={() => setUrgent(o.v)} className="peer sr-only" />
                    <span className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-line-2 bg-surface px-2 text-center text-sm font-semibold peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:text-primary-hover peer-focus-visible:outline-2 peer-focus-visible:outline-primary">
                      {o.l}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {symptom === 'Greška na ekranu' ? (
              <Field label="Kod greške sa ekrana" htmlFor={`${uid}-code`} hint="Prepišite tačno kako piše.">
                <input id={`${uid}-code`} value={errorCode} onChange={(e) => setErrorCode(e.target.value)} className={inputClass()} maxLength={30} />
              </Field>
            ) : null}

            <Field label={symptom === 'Drugo' ? 'Opišite problem' : 'Dodatni opis'} htmlFor={`${uid}-note`} required={symptom === 'Drugo'} error={errors.note}>
              <textarea
                id={`${uid}-note`}
                rows={3}
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  clear('note');
                }}
                className={inputClass(Boolean(errors.note))}
                maxLength={1000}
                {...describe('note')}
              />
            </Field>
            <PhotoPicker label="Fotografija" photo={photo} onChange={setPhoto} />
          </>
        ) : (
          <>
            <div className="flex justify-end">
              <button
                type="button"
                className="min-h-9 text-sm font-semibold text-primary underline underline-offset-2"
                onClick={() => {
                  setDate(minDate);
                  setSlot(SLOTS[0]!);
                  setErrors({});
                }}
              >
                Popuni primjerom
              </button>
            </div>
            <Field label="Željeni datum" htmlFor={`${uid}-date`} required error={errors.date}>
              <input
                id={`${uid}-date`}
                type="date"
                min={minDate}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  clear('date');
                }}
                className={inputClass(Boolean(errors.date))}
                {...describe('date')}
              />
            </Field>
            <fieldset aria-describedby={errors.slot ? `${uid}-slot-error` : undefined}>
              <legend className="mb-2 text-sm font-semibold">
                Željeni termin <span className="text-danger">*</span>
              </legend>
              <div className="grid grid-cols-3 gap-2" id={`${uid}-slot`} tabIndex={-1}>
                {SLOTS.map((s) => (
                  <label key={s} className="relative">
                    <input
                      type="radio"
                      name={`${uid}-slotr`}
                      checked={slot === s}
                      onChange={() => {
                        setSlot(s);
                        clear('slot');
                      }}
                      className="peer sr-only"
                    />
                    <span className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-line-2 bg-surface px-1 text-center text-[13px] leading-tight font-semibold peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:text-primary-hover peer-focus-visible:outline-2 peer-focus-visible:outline-primary">
                      {s}
                    </span>
                  </label>
                ))}
              </div>
              {errors.slot ? (
                <p id={`${uid}-slot-error`} className="mt-1.5 text-[13px] font-medium text-danger" role="alert">
                  {errors.slot}
                </p>
              ) : null}
            </fieldset>
            <Field label="Napomena" htmlFor={`${uid}-note`}>
              <textarea id={`${uid}-note`} rows={3} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass()} maxLength={600} />
            </Field>
          </>
        )}

        <section className="rounded-xl border border-line bg-surface p-3" aria-label="Vaši podaci">
          {editContact ? (
            <div className="space-y-3">
              <Field label="Ime i prezime" htmlFor={`${uid}-name`} required error={errors.name}>
                <input
                  id={`${uid}-name`}
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clear('name');
                  }}
                  className={inputClass(Boolean(errors.name))}
                  maxLength={80}
                  {...describe('name')}
                />
              </Field>
              <Field label="Telefon ili e-mail" htmlFor={`${uid}-contact`} required error={errors.contact} hint="Samo za primjer — niko vas neće kontaktirati.">
                <input
                  id={`${uid}-contact`}
                  value={contact}
                  onChange={(e) => {
                    setContact(e.target.value);
                    clear('contact');
                  }}
                  className={inputClass(Boolean(errors.contact))}
                  maxLength={80}
                  {...describe('contact')}
                />
              </Field>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-[13px] text-ink-2">Vaši podaci (iz evidencije firme)</p>
                <p className="font-semibold">{name}</p>
                <p className="break-all text-ink-2">{contact}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setEditContact(true)}>
                <Pencil aria-hidden /> Promijeni
              </Button>
            </div>
          )}
        </section>
      </div>

      <div className="pb-safe sticky bottom-0 z-10 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur">
        <Button type="submit" size="lg" className="w-full">
          {kind === 'servis' ? 'Simuliraj slanje zahtjeva' : 'Simuliraj prijavu kvara'}
        </Button>
        <p className="mt-1 text-center text-xs text-ink-3">Demo: ništa se ne šalje servisnoj firmi.</p>
      </div>
    </form>
  );
}
