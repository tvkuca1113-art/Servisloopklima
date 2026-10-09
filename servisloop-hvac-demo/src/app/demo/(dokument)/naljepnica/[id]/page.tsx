'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Printer } from 'lucide-react';

import { useQr } from '@/components/qr-panel';
import { Button, ButtonLink, Card, EmptyState, Skeleton } from '@/components/ui';
import { brand } from '@/config/brand';
import { deviceTitle, lookup } from '@/lib/derive';
import { useDemo } from '@/lib/store';

export default function LabelPage() {
  const { id } = useParams<{ id: string }>();
  const deviceId = decodeURIComponent(id);
  const { state } = useDemo();
  const device = lookup(state).device(deviceId);
  const { url, png } = useQr(deviceId, 600);

  if (!device) {
    return (
      <Card className="mt-4">
        <EmptyState title="Uređaj ne postoji u primjeru" action={<ButtonLink href="/demo/uredaji">Uređaji</ButtonLink>} />
      </Card>
    );
  }

  return (
    <>
      <div className="no-print mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href={`/demo/uredaji/${device.id}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary">
          ← {deviceTitle(state, device)}
        </Link>
        <div className="flex flex-col gap-1 sm:items-end">
          <Button size="lg" onClick={() => window.print()}>
            <Printer aria-hidden /> Štampaj naljepnicu
          </Button>
          <p className="text-xs text-ink-3">Predložak naljepnice oko 7 × 10 cm. Prije stvarne upotrebe testirajte skeniranje.</p>
        </div>
      </div>

      <div className="print-sheet mx-auto flex justify-center rounded-lg bg-white py-8 shadow-[var(--shadow-card)] print:py-0">
        <div className="w-[70mm] rounded-[3mm] border-[0.5mm] border-black p-[4mm] text-black" data-testid="label">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10pt] leading-tight font-bold">{brand.companyName}</p>
            <span className="rounded-[1mm] border-[0.4mm] border-black px-[1.5mm] text-[9pt] font-bold">DEMO</span>
          </div>
          <div className="mt-[3mm] flex justify-center bg-white">
            {png ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={png} alt={`QR kod za ${device.id}`} className="block h-[50mm] w-[50mm]" />
            ) : (
              <Skeleton className="h-[50mm] w-[50mm]" />
            )}
          </div>
          <p className="mt-[2mm] text-center text-[12pt] font-bold">{device.id}</p>
          <p className="text-center text-[9pt] leading-snug">{device.name}</p>
          <p className="mt-[2mm] text-center text-[8pt] leading-snug">Skenirajte za servis ili prijavu kvara.</p>
          <p className="mt-[1mm] text-center text-[7pt] leading-snug">DEMO — ne koristi se za stvarno zakazivanje servisa.</p>
          <p className="mt-[1mm] text-center font-mono text-[6pt] break-all">{url}</p>
        </div>
      </div>
    </>
  );
}
