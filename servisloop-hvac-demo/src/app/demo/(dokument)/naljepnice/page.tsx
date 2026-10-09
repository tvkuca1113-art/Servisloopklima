'use client';

import Link from 'next/link';
import { Printer } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, Skeleton } from '@/components/ui';
import { brand } from '@/config/brand';
import { customerUrl, qrPngDataUrl } from '@/lib/qr';
import { useDemo } from '@/lib/store';

/** List praznih QR naljepnica: vlasnik ih unaprijed štampa i daje serviserima. */
export default function BlankLabelsPage() {
  const { state } = useDemo();
  const [pngs, setPngs] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    Promise.all(state.labels.map(async (l) => [l.code, await qrPngDataUrl(customerUrl(l.code), 360)] as const)).then((all) => {
      if (alive) setPngs(Object.fromEntries(all));
    });
    return () => {
      alive = false;
    };
  }, [state.labels]);

  return (
    <>
      <div className="no-print mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/demo/plan" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary">
            ← Plan servisa
          </Link>
          <h1 className="text-2xl font-bold">Prazne QR naljepnice</h1>
          <p className="mt-1 max-w-xl text-sm text-ink-2">
            Rezervni komplet za servisere. Kada se na objektu pojavi uređaj koji nije najavljen, serviser zalijepi praznu naljepnicu, skenira je i u nekoliko polja doda uređaj. Naljepnica se tada
            trajno veže za taj uređaj.
          </p>
        </div>
        <Button size="lg" onClick={() => window.print()} className="shrink-0">
          <Printer aria-hidden /> Štampaj list naljepnica
        </Button>
      </div>

      <div className="print-sheet mx-auto grid max-w-[190mm] grid-cols-2 gap-[4mm] rounded-lg bg-white p-4 shadow-[var(--shadow-card)] sm:grid-cols-3 print:grid-cols-3 print:p-0" data-testid="blank-labels">
        {state.labels.map((l) => (
          <div key={l.code} className="print-avoid-break rounded-[2mm] border-[0.4mm] border-black p-[3mm] text-center text-black">
            <div className="flex items-center justify-between text-[8pt] font-bold">
              <span className="truncate">{brand.companyName}</span>
              <span className="rounded-[1mm] border-[0.3mm] border-black px-[1mm]">DEMO</span>
            </div>
            {pngs[l.code] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pngs[l.code]} alt={`QR ${l.code}`} className="mx-auto mt-[2mm] block h-[30mm] w-[30mm]" />
            ) : (
              <Skeleton className="mx-auto mt-[2mm] h-[30mm] w-[30mm]" />
            )}
            <p className="mt-[1mm] font-mono text-[10pt] font-bold">{l.code}</p>
            <p className="text-[7pt] leading-tight">Skenirajte za servis ili prijavu kvara.</p>
            {l.deviceId ? <p className="no-print mt-1 text-[11px] font-semibold text-ok">Povezana: {l.deviceId}</p> : null}
          </div>
        ))}
      </div>
    </>
  );
}
