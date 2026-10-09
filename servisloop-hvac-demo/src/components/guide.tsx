'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check, ChevronDown, Compass, X } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/cn';
import { GUIDE_DEVICE_ID } from '@/lib/demo-data';
import { useDemo } from '@/lib/store';

import { useToast } from './toast';
import { buttonClass } from './ui';

export interface GuideStep {
  title: string;
  hint: string;
  href: string;
  done: boolean;
}

export function useGuideSteps(): { steps: GuideStep[]; current: number } {
  const { state } = useDemo();
  const g = state.guide;
  const request = g.requestId ? state.requests.find((r) => r.id === g.requestId) : undefined;
  const order = request?.workOrderId ? state.workOrders.find((w) => w.id === request.workOrderId) : undefined;
  const assigned = Boolean(order?.technicianId);
  const completed = order?.status === 'zavrsen';

  const steps: GuideStep[] = [
    { title: 'Otvori primjer uređaja', hint: 'TP-001 · Demo kuća Tuzla: historija, interval i QR kod.', href: `/demo/uredaji/${GUIDE_DEVICE_ID}`, done: g.visitedDevice },
    { title: 'Pogledaj QR i prikaz kupca', hint: 'Šta kupac vidi kada skenira QR na uređaju.', href: `/demo/kupac/${GUIDE_DEVICE_ID}`, done: g.visitedCustomer },
    { title: 'Kao kupac prijavi kvar ili zakaži servis', hint: 'Stranica koju kupac dobije skeniranjem QR koda.', href: `/demo/kupac/${GUIDE_DEVICE_ID}`, done: Boolean(request) },
    {
      title: 'Kao vlasnik dodijeli servisera',
      hint: 'Potvrdite zahtjev; ostali uređaji na objektu mogu u istu posjetu.',
      href: request ? `/demo/zahtjevi?istakni=${request.id}` : '/demo/zahtjevi',
      done: assigned,
    },
    {
      title: 'Kao serviser skeniraj uređaje, završi i pogledaj izvještaj',
      hint: 'Na objektu: QR svakog uređaja → „Sve uredno” → završetak.',
      href: order ? (completed ? `/demo/izvjestaji/${order.id}` : `/demo/serviser/nalog/${order.id}`) : '/demo/serviser',
      done: completed && g.viewedReport,
    },
  ];
  // Korak koji je preskočen, a kasniji je urađen, računa se kao prođen.
  for (let i = steps.length - 2; i >= 0; i--) if (steps[i + 1]!.done) steps[i]!.done = true;
  const current = steps.findIndex((s) => !s.done);
  return { steps, current: current === -1 ? steps.length : current };
}

export function GuidePanel() {
  const { state, ready, setGuide, reset } = useDemo();
  const toast = useToast();
  const { steps, current } = useGuideSteps();
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname() ?? '';
  const raised = pathname.startsWith('/demo/serviser/nalog/');
  const tech = pathname.startsWith('/demo/serviser');

  // Na vlasničkom pregledu vodič je prikazan u samoj stranici (GuideInline).
  if (!ready || state.guide.dismissed || pathname === '/demo') return null;

  const finished = current >= steps.length;

  return (
    <aside
      aria-label="Vodič kroz demo"
      className={cn(
        'no-print pointer-events-none fixed right-3 z-40 w-[min(340px,calc(100vw-24px))] lg:right-6',
        raised ? 'bottom-[148px]' : tech ? 'bottom-[76px]' : 'bottom-[76px] lg:bottom-6',
      )}
      data-testid="guide-panel"
    >
      {expanded ? (
        <div className="pointer-events-auto overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-pop)]">
          <div className="flex items-start justify-between gap-2 bg-nav px-4 py-3 text-white">
            <div>
              <p className="text-[11px] font-bold tracking-wide text-[#bdb4fe] uppercase">Vodič za pet minuta</p>
              <h2 className="text-[15px] font-semibold">Pogledaj kako bi servis tekao</h2>
            </div>
            <button type="button" onClick={() => setExpanded(false)} className="-mr-2 inline-flex size-10 items-center justify-center rounded-lg hover:bg-white/10" aria-label="Smanji vodič">
              <ChevronDown className="size-5" aria-hidden />
            </button>
          </div>
          <ol className="max-h-[50vh] space-y-1 overflow-y-auto px-3 py-3">
            {steps.map((s, i) => {
              const active = i === current;
              return (
                <li key={s.title} className={cn('flex gap-3 rounded-xl px-2 py-2', active && 'bg-primary-soft')}>
                  <span
                    className={cn(
                      'mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      s.done ? 'bg-ok text-white' : active ? 'bg-primary text-white' : 'border border-line-2 text-ink-2',
                    )}
                    aria-hidden
                  >
                    {s.done ? <Check className="size-3.5" /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm font-semibold', s.done ? 'text-ink-2' : 'text-ink')}>
                      {s.title}
                      <span className="sr-only">{s.done ? ' (urađeno)' : active ? ' (trenutni korak)' : ''}</span>
                    </p>
                    {active ? (
                      <>
                        <p className="mt-0.5 text-[13px] text-ink-2">{s.hint}</p>
                        <Link href={s.href} className={buttonClass('primary', 'sm', 'mt-2')}>
                          Idi na korak {i + 1}
                        </Link>
                      </>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
          {finished ? (
            <p className="mx-3 mb-3 rounded-xl bg-ok-soft px-3 py-2 text-sm text-ok">Prošli ste cijeli primjer toka. Promjene su prikazane samo u ovoj probnoj verziji.</p>
          ) : null}
          <div className="flex flex-wrap gap-2 border-t border-line bg-bg px-3 py-2">
            <button
              type="button"
              className={buttonClass('ghost', 'sm')}
              onClick={() => {
                reset();
                toast({ title: 'Vodič počinje ispočetka.', body: 'Vraćen je početni primjer.' });
              }}
            >
              Počni ponovo
            </button>
            <button type="button" className={buttonClass('ghost', 'sm')} onClick={() => setGuide({ dismissed: true })}>
              <X aria-hidden /> Preskoči vodič
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="pointer-events-auto ml-auto flex min-h-11 items-center gap-2 rounded-full border border-line bg-nav px-3.5 text-sm font-semibold text-white shadow-[var(--shadow-pop)] hover:bg-nav-2"
          aria-expanded="false"
        >
          <Compass className="size-[18px]" aria-hidden />
          <span className="sm:hidden">{finished ? 'Vodič ✓' : `Vodič ${current + 1}/${steps.length}`}</span>
          <span className="hidden sm:inline">Vodič · {finished ? 'završen' : `korak ${current + 1} od ${steps.length}`}</span>
        </button>
      )}
    </aside>
  );
}

/** Dugme koje ponovo prikazuje vodič nakon „Preskoči vodič”. */
export function ShowGuideButton({ className }: { className?: string }) {
  const { state, setGuide } = useDemo();
  if (!state.guide.dismissed) return null;
  return (
    <button type="button" className={cn(buttonClass('secondary', 'sm'), className)} onClick={() => setGuide({ dismissed: false })}>
      <Compass aria-hidden /> Prikaži vodič
    </button>
  );
}

/** Vodič u samoj stranici vlasničkog pregleda, da ne prekriva sadržaj. */
export function GuideInline() {
  const { state, ready, setGuide, reset } = useDemo();
  const toast = useToast();
  const { steps, current } = useGuideSteps();
  if (!ready || state.guide.dismissed) return null;
  const finished = current >= steps.length;
  return (
    <section aria-labelledby="vodic-naslov" className="no-print mb-5 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]" data-testid="guide-inline">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-nav px-4 py-3 text-white sm:px-5">
        <div>
          <p className="text-[11px] font-bold tracking-wide text-[#bdb4fe] uppercase">Vodič za pet minuta · {finished ? 'završen' : `korak ${current + 1} od ${steps.length}`}</p>
          <h2 id="vodic-naslov" className="text-[15px] font-semibold">Pogledaj kako bi servis tekao</h2>
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className="inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-semibold text-nav-ink hover:bg-white/10"
            onClick={() => {
              reset();
              toast({ title: 'Vodič počinje ispočetka.', body: 'Vraćen je početni primjer.' });
            }}
          >
            Počni ponovo
          </button>
          <button type="button" className="inline-flex min-h-9 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-nav-ink hover:bg-white/10" onClick={() => setGuide({ dismissed: true })}>
            <X className="size-4" aria-hidden /> Preskoči vodič
          </button>
        </div>
      </div>
      <ol className={cn('grid gap-2 p-3 lg:grid-cols-5', finished && 'hidden lg:grid')}>
        {steps.map((s, i) => {
          const active = i === current;
          return (
            <li key={s.title} className={cn('gap-3 rounded-xl border px-3 py-3 lg:flex lg:flex-col lg:gap-2', active ? 'flex border-primary/30 bg-primary-soft' : 'hidden border-line')}>
              <span
                className={cn(
                  'inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  s.done ? 'bg-ok text-white' : active ? 'bg-primary text-white' : 'border border-line-2 text-ink-2',
                )}
                aria-hidden
              >
                {s.done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-semibold', s.done ? 'text-ink-2' : 'text-ink')}>
                  {s.title}
                  <span className="sr-only">{s.done ? ' (urađeno)' : active ? ' (trenutni korak)' : ''}</span>
                </p>
                {active ? (
                  <>
                    <p className="mt-0.5 text-[13px] text-ink-2">{s.hint}</p>
                    <Link href={s.href} className={buttonClass('primary', 'sm', 'mt-2')}>
                      Idi na korak {i + 1}
                    </Link>
                  </>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
      {finished ? <p className="mx-3 mb-3 rounded-xl bg-ok-soft px-3 py-2 text-sm text-ok">Prošli ste cijeli primjer toka. Promjene su prikazane samo u ovoj probnoj verziji.</p> : null}
    </section>
  );
}
