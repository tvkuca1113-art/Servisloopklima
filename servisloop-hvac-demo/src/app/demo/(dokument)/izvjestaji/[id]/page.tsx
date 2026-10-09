'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Printer } from 'lucide-react';
import { useEffect } from 'react';

import { Badge, Button, ButtonLink, Card, EmptyState } from '@/components/ui';
import { brand } from '@/config/brand';
import { ANSWER_LABEL } from '@/lib/checklists';
import { addMonths, formatInterval, formatLong } from '@/lib/dates';
import { lookup } from '@/lib/derive';
import { useDemo } from '@/lib/store';
import { identificationLabel } from '@/components/work-order-run';

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

  const loc = L.location(order.locationId);
  const cust = loc ? L.customer(loc.customerId) : undefined;
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
          <p className="rounded-md border-2 border-demo px-2.5 py-1 text-[12px] font-bold tracking-wide text-demo uppercase">{order.category === 'Ugradnja' ? 'DEMO — primjer zapisnika o ugradnji' : 'DEMO — primjer servisnog izvještaja'}</p>
        </header>

        <h1 className="mt-5 text-[22px] font-bold">{order.category === 'Ugradnja' ? 'Zapisnik o ugradnji' : 'Servisni izvještaj'}</h1>
        <p className="text-[13px] text-ink-2">
          Broj: IZV-{order.id.replace('NAL-', '')} · Nalog {order.id} · {order.category}
        </p>

        <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2 print:grid-cols-2">
          <Row label={order.category === 'Ugradnja' ? 'Datum ugradnje' : 'Datum servisa'}>{order.completedOn ? formatLong(order.completedOn) : '—'}</Row>
          <Row label="Serviser">{tech?.name ?? '—'}</Row>
          <Row label="Kupac">{cust?.name}</Row>
          <Row label="Lokacija">
            {loc?.name}, {loc?.address}, {loc?.city}
          </Row>
          <Row label="Uređaji u posjeti">
            {order.items.length} · obrađeno {order.items.filter((i) => i.done).length}
          </Row>
          <Row label="Trajanje posjete">{order.timeSpentMin != null ? `${order.timeSpentMin} min` : '—'}</Row>
          <div className="sm:col-span-2 print:col-span-2">
            <Row label="Razlog dolaska">{order.reason}</Row>
          </div>
        </dl>

        {order.items.map((item) => {
          const dev = L.device(item.deviceId);
          return (
            <section key={item.deviceId} className="mt-6 border-t border-line pt-4" aria-label={`Uređaj ${item.deviceId}`}>
              <div className="print-avoid-break flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-[15px] font-bold">
                    {dev?.id} · {dev?.name}
                  </h2>
                  <p className="text-[12px] text-ink-2">
                    {dev?.typeLabel} · {dev?.model} · <span className="font-mono">{dev?.serial}</span>
                  </p>
                </div>
                <span className={item.identifiedBy === 'qr' ? 'text-[12px] font-semibold text-ok' : 'text-[12px] font-semibold text-warn'}>
                  Identifikacija: {identificationLabel(item)}
                </span>
              </div>
              {item.done && item.checklist.every((c) => c.answer === 'uredno' && !c.note) ? (
                <p className="mt-2 text-[13px]">
                  <Badge tone="ok">Uredno</Badge> Sve stavke demo obrasca ({item.checklist.length}/{item.checklist.length}): {item.checklist.map((c) => c.label).join(', ')}.
                </p>
              ) : item.done ? (
                <table className="mt-2 w-full border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-line-2 text-[11px] tracking-wide text-ink-3 uppercase">
                      <th scope="col" className="py-1.5 pr-2 font-semibold">Stavka (demo obrazac)</th>
                      <th scope="col" className="w-[130px] py-1.5 pr-2 font-semibold">Rezultat</th>
                      <th scope="col" className="py-1.5 font-semibold">Napomena</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.checklist.map((c) => (
                      <tr key={c.id} className="print-avoid-break border-b border-line align-top">
                        <td className="py-1.5 pr-2 font-medium">{c.label}</td>
                        <td className="py-1.5 pr-2">
                          {c.answer ? <Badge tone={c.answer === 'uredno' ? 'ok' : c.answer === 'paznja' ? 'warn' : 'neutral'}>{ANSWER_LABEL[c.answer]}</Badge> : <span className="text-ink-3">Bez odgovora</span>}
                        </td>
                        <td className="py-1.5">{c.note || <span className="text-ink-3">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="mt-2 rounded bg-warn-soft px-3 py-2 text-[13px] text-warn">Uređaj nije pregledan u ovoj posjeti.</p>
              )}
              {item.note ? (
                <p className="mt-2 text-[13px]">
                  <span className="font-semibold">Napomena: </span>
                  {item.note}
                </p>
              ) : null}
              {item.photos.length > 0 ? (
                <div className="print-avoid-break mt-2 flex flex-wrap gap-2">
                  {item.photos.map((p, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={p.dataUrl} alt={p.name} className="h-24 w-32 rounded border border-line object-cover" />
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}

        <div className="mt-6 grid gap-x-8 gap-y-3 border-t border-line pt-4 sm:grid-cols-2 print:grid-cols-2">
          <div className="sm:col-span-2 print:col-span-2">
            <Row label="Bilješka za posjetu">
              <span className="whitespace-pre-wrap">{order.notes || '—'}</span>
            </Row>
          </div>
          <Row label="Materijal (primjer)">{order.materials || '—'}</Row>
        </div>

        <div className="print-avoid-break mt-6 rounded-lg border border-line bg-bg p-4">
          <p className="text-[11px] font-semibold tracking-wide text-ink-3 uppercase">Preporuka</p>
          <p className="mt-1 text-[14px] whitespace-pre-wrap">{order.recommendation || '—'}</p>
          <p className="mt-3 text-[11px] font-semibold tracking-wide text-ink-3 uppercase">{order.category === 'Ugradnja' ? 'Prvi servis — automatski u planu (DEMO interval)' : 'Sljedeći servis (DEMO interval)'}</p>
          <ul className="mt-1 space-y-0.5 text-[14px]">
            {order.items
              .filter((i) => i.done)
              .map((i) => {
                const dev = L.device(i.deviceId);
                const next = dev && order.completedOn ? addMonths(order.completedOn, dev.intervalMonths) : null;
                return (
                  <li key={i.deviceId}>
                    <span className="font-semibold">{i.deviceId}:</span> {next ? formatLong(next) : '—'}
                    {dev ? <span className="text-ink-2"> · interval {formatInterval(dev.intervalMonths)}</span> : null}
                  </li>
                );
              })}
          </ul>
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
