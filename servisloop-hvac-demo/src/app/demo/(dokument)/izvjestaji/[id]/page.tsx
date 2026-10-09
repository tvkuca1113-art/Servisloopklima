'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Printer } from 'lucide-react';
import { useEffect } from 'react';

import { Badge, Button, ButtonLink, Card, EmptyState } from '@/components/ui';
import { brand } from '@/config/brand';
import { ANSWER_LABEL } from '@/lib/checklists';
import { formatInterval, formatLong } from '@/lib/dates';
import { lookup } from '@/lib/derive';
import { useDemo } from '@/lib/store';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="print-avoid-break">
      <dt className="text-[11px] font-semibold tracking-wide text-ink-3 uppercase">{label}</dt>
      <dd className="mt-0.5 text-[14px] text-ink">{children}</dd>
    </div>
  );
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = decodeURIComponent(id);
  const { state, setGuide } = useDemo();
  const L = lookup(state);
  const order = L.workOrder(orderId);
  const guideOrderId = state.guide.requestId ? L.request(state.guide.requestId)?.workOrderId : null;

  useEffect(() => {
    if (order?.status === 'zavrsen' && guideOrderId === order.id && !state.guide.viewedReport) setGuide({ viewedReport: true });
  }, [order?.status, order?.id, guideOrderId, state.guide.viewedReport, setGuide]);

  if (!order || order.status !== 'zavrsen') {
    return (
      <Card className="mt-4">
        <EmptyState
          title={order ? `Nalog ${order.id} još nije završen` : 'Izvještaj ne postoji u primjeru'}
          action={<ButtonLink href={order ? `/demo/serviser/nalog/${order.id}` : '/demo/izvjestaji'}>{order ? 'Otvori nalog kao serviser' : 'Svi izvještaji'}</ButtonLink>}
        >
          Primjer izvještaja nastaje kada serviser završi demo nalog.
        </EmptyState>
      </Card>
    );
  }

  const d = L.device(order.deviceId);
  const loc = d ? L.deviceLocation(d) : undefined;
  const cust = d ? L.deviceCustomer(d) : undefined;
  const tech = L.technician(order.technicianId);

  return (
    <>
      <div className="no-print mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
          <Link href="/demo/izvjestaji" className="inline-flex min-h-11 items-center text-primary">
            ← Izvještaji
          </Link>
          <Link href={`/demo/nalozi/${order.id}`} className="inline-flex min-h-11 items-center text-primary">
            Nalog {order.id}
          </Link>
          <Link href="/demo/serviser" className="inline-flex min-h-11 items-center text-primary">
            Prikaz servisera
          </Link>
        </div>
        <div className="flex flex-col items-stretch gap-1 sm:items-end">
          <Button onClick={() => window.print()} size="lg">
            <Printer aria-hidden /> Štampaj primjer izvještaja
          </Button>
          <p className="text-xs text-ink-3">U dijalogu za štampu možete odabrati „Sačuvaj kao PDF”.</p>
        </div>
      </div>

      <article className="print-sheet mx-auto w-full max-w-[210mm] rounded-lg border border-line bg-white px-5 py-6 shadow-[var(--shadow-card)] sm:px-[14mm] sm:py-[14mm]" data-testid="report">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-nav pb-4">
          <div>
            <p className="text-[17px] font-bold">{brand.companyName}</p>
            <p className="text-[13px] text-ink-2">demo firma · {brand.productName}</p>
          </div>
          <p className="rounded-md border-2 border-demo px-2.5 py-1 text-[12px] font-bold tracking-wide text-demo uppercase">DEMO — primjer servisnog izvještaja</p>
        </header>

        <h1 className="mt-5 text-[22px] font-bold">Servisni izvještaj</h1>
        <p className="text-[13px] text-ink-2">
          Broj: IZV-{order.id.replace('NAL-', '')} · Nalog {order.id} · {order.category}
        </p>

        <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2 print:grid-cols-2">
          <Row label="Datum servisa">{order.completedOn ? formatLong(order.completedOn) : '—'}</Row>
          <Row label="Serviser">{tech?.name ?? '—'}</Row>
          <Row label="Kupac">{cust?.name}</Row>
          <Row label="Lokacija">
            {loc?.name}, {loc?.address}, {loc?.city}
          </Row>
          <Row label="Uređaj">
            {d?.id} · {d?.name}
            <span className="block text-[13px] text-ink-2">{d?.typeLabel}</span>
          </Row>
          <Row label="Model / serijski broj">
            {d?.model}
            <span className="block font-mono text-[12px] text-ink-2">{d?.serial}</span>
          </Row>
          <div className="sm:col-span-2 print:col-span-2">
            <Row label="Razlog dolaska">{order.reason}</Row>
          </div>
        </dl>

        <h2 className="mt-6 text-[15px] font-bold">Kontrolna lista (demo obrazac)</h2>
        <table className="mt-2 w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-line-2 text-[11px] tracking-wide text-ink-3 uppercase">
              <th scope="col" className="py-1.5 pr-2 font-semibold">Stavka</th>
              <th scope="col" className="w-[130px] py-1.5 pr-2 font-semibold">Rezultat</th>
              <th scope="col" className="py-1.5 font-semibold">Napomena</th>
            </tr>
          </thead>
          <tbody>
            {order.checklist.map((c) => (
              <tr key={c.id} className="print-avoid-break border-b border-line align-top">
                <td className="py-2 pr-2 font-medium">{c.label}</td>
                <td className="py-2 pr-2">
                  {c.answer ? <Badge tone={c.answer === 'uredno' ? 'ok' : c.answer === 'paznja' ? 'warn' : 'neutral'}>{ANSWER_LABEL[c.answer]}</Badge> : <span className="text-ink-3">Bez odgovora</span>}
                </td>
                <td className="py-2">{c.note || <span className="text-ink-3">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2 print:grid-cols-2">
          <div className="sm:col-span-2 print:col-span-2">
            <Row label="Obavljeni radovi i bilješke">
              <span className="whitespace-pre-wrap">{order.notes || '—'}</span>
            </Row>
          </div>
          <Row label="Utrošeno vrijeme (primjer)">{order.timeSpentMin != null ? `${order.timeSpentMin} min` : '—'}</Row>
          <Row label="Materijal (primjer)">{order.materials || '—'}</Row>
        </div>

        {order.photos.length > 0 ? (
          <div className="print-avoid-break mt-5">
            <p className="text-[11px] font-semibold tracking-wide text-ink-3 uppercase">Fotografije (lokalni primjer)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {order.photos.map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={p.dataUrl} alt={p.name} className="h-28 w-36 rounded border border-line object-cover" />
              ))}
            </div>
          </div>
        ) : null}

        <div className="print-avoid-break mt-6 rounded-lg border border-line bg-bg p-4">
          <p className="text-[11px] font-semibold tracking-wide text-ink-3 uppercase">Preporuka</p>
          <p className="mt-1 text-[14px] whitespace-pre-wrap">{order.recommendation || '—'}</p>
          <p className="mt-3 text-[11px] font-semibold tracking-wide text-ink-3 uppercase">Sljedeći servis</p>
          <p className="mt-1 text-[14px] font-semibold">
            {order.nextServiceOn ? formatLong(order.nextServiceOn) : '—'}
            {d ? <span className="font-normal text-ink-2"> · interval {formatInterval(d.intervalMonths)} (DEMO postavka)</span> : null}
          </p>
        </div>

        <div className="print-avoid-break mt-6 grid gap-6 sm:grid-cols-2 print:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-ink-3 uppercase">Serviser</p>
            <p className="mt-6 border-t border-ink-3 pt-1 text-[13px]">{tech?.name}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-ink-3 uppercase">Potvrda kupca (ilustrativna rubrika)</p>
            <p className="mt-6 border-t border-ink-3 pt-1 text-[13px]">{order.customerAck || 'Primjer — bez potpisa'}</p>
          </div>
        </div>

        <footer className="mt-8 border-t border-line pt-3 text-[11px] text-ink-3">
          <strong className="text-demo">DEMO</strong> — primjer servisnog izvještaja iz pokaznog prototipa {brand.productName}. Svi podaci su izmišljeni. Dokument nije stvarna
          servisna potvrda. Servisni obrazac i intervale u stvarnoj verziji potvrđuje firma.
        </footer>
      </article>
    </>
  );
}
