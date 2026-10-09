'use client';

import Link from 'next/link';
import { Copy, Download, Printer, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';

import { customerPath, customerUrl, downloadDataUrl, downloadText, qrPngDataUrl, qrSvg } from '@/lib/qr';

import { useToast } from './toast';
import { Button, Card, CardHeader, Skeleton, buttonClass } from './ui';

export function useQr(deviceId: string, width = 512) {
  const [url, setUrl] = useState('');
  const [png, setPng] = useState<string | null>(null);
  useEffect(() => {
    const u = customerUrl(deviceId);
    setUrl(u);
    let alive = true;
    qrPngDataUrl(u, width).then((d) => {
      if (alive) setPng(d);
    });
    return () => {
      alive = false;
    };
  }, [deviceId, width]);
  return { url, png };
}

export function QrPanel({ deviceId, title }: { deviceId: string; title: string }) {
  const { url, png } = useQr(deviceId);
  const toast = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Demo link je kopiran.', body: url });
    } catch {
      window.prompt('Kopirajte demo link:', url);
    }
  }

  return (
    <Card aria-labelledby="qr-naslov">
      <CardHeader id="qr-naslov" title="QR kod uređaja" subtitle="QR otvara pokaznu karticu ovog uređaja." />
      <div className="flex flex-col items-center gap-3 px-4 py-5 sm:px-5">
        <div className="rounded-xl border border-line bg-white p-2">
          {png ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={png} width={256} height={256} alt={`QR kod za ${title}`} className="block size-64" data-testid="qr-image" data-qr-url={url} />
          ) : (
            <Skeleton className="size-64" />
          )}
        </div>
        <p className="text-center text-[13px] font-semibold text-demo">DEMO — ne koristi se za stvarno zakazivanje servisa.</p>
        <p className="w-full rounded-lg bg-bg px-3 py-2 text-center font-mono text-xs break-all text-ink-2" data-testid="qr-url">
          {url || '…'}
        </p>
        <div className="grid w-full gap-2 sm:grid-cols-2">
          <Link href={customerPath(deviceId)} className={buttonClass('primary', 'md', 'sm:col-span-2')}>
            <Smartphone aria-hidden /> Pogledaj prikaz kupca
          </Link>
          <Button
            variant="secondary"
            disabled={!png}
            onClick={() => {
              if (png) downloadDataUrl(png, `qr-${deviceId}-demo.png`);
            }}
          >
            <Download aria-hidden /> Preuzmi QR PNG
          </Button>
          <Button
            variant="secondary"
            disabled={!url}
            onClick={async () => {
              downloadText(await qrSvg(url), `qr-${deviceId}-demo.svg`, 'image/svg+xml');
            }}
          >
            <Download aria-hidden /> Preuzmi QR SVG
          </Button>
          <Button variant="secondary" onClick={copy} disabled={!url}>
            <Copy aria-hidden /> Kopiraj demo link
          </Button>
          <Link href={`/demo/naljepnica/${deviceId}`} className={buttonClass('secondary')}>
            <Printer aria-hidden /> Štampaj naljepnicu
          </Link>
        </div>
      </div>
    </Card>
  );
}
