'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

import { Card, PageHeader, buttonClass } from '@/components/ui';
import { brand } from '@/config/brand';
import { cn } from '@/lib/cn';
import { addDays, formatLong } from '@/lib/dates';
import { deviceTitle, lookup } from '@/lib/derive';
import { GUIDE_DEVICE_ID } from '@/lib/demo-data';
import { proposalMessage } from '@/lib/proposal-text';
import { siteOrigin } from '@/lib/qr';
import { useDemo } from '@/lib/store';

interface Example {
  id: string;
  title: string;
  when: string;
  subject: string;
  body: string;
  link?: { href: string; label: string };
}

function MessagesInner() {
  const { state } = useDemo();
  const L = lookup(state);
  const params = useSearchParams();
  const focus = params.get('primjer');
  const deviceId = params.get('uredjaj') ?? GUIDE_DEVICE_ID;
  const device = L.device(deviceId) ?? L.device(GUIDE_DEVICE_ID)!;
  const loc = L.deviceLocation(device);
  const cust = L.deviceCustomer(device);
  const today = state.anchor;
  const title = deviceTitle(state, device);

  useEffect(() => {
    if (focus) document.getElementById(`poruka-${focus}`)?.scrollIntoView({ block: 'center' });
  }, [focus]);

  const seed = state.proposals.find((p) => p.id === 'PRJ-001');
  const proposalDemo = seed
    ? proposalMessage(state, seed, `${siteOrigin()}/demo/kupac/TP-002?prijedlog=PRJ-001`)
    : { subject: 'Redovni servis — prijedlog termina', body: 'Primjer poruke s prijedlogom termina.' };

  const examples: Example[] = [
    {
      id: 'zahtjev',
      title: 'Potvrda prijema zahtjeva',
      when: 'Kada kupac pošalje zahtjev preko QR kartice',
      subject: `Primili smo vaš zahtjev za servis — ${device.id}`,
      body: `Poštovani,\n\nzaprimili smo vaš zahtjev za servis uređaja ${device.name} (${loc?.name}). Javićemo vam se s prijedlogom termina.\n\n${brand.companyName}`,
    },
    {
      id: 'termin',
      title: 'Potvrda termina',
      when: 'Kada vlasnik dodijeli servisera i termin',
      subject: `Termin servisa: ${formatLong(addDays(today, 2))} u 09:00`,
      body: `Poštovani,\n\npotvrđujemo termin servisa za ${device.id} · ${loc?.name}: ${formatLong(addDays(today, 2))} u 09:00. Dolazi serviser Amar Begić.\n\nAko vam termin ne odgovara, javite nam se.\n\n${brand.companyName}`,
    },
    {
      id: 'zavrseno',
      title: 'Servis završen',
      when: 'Kada serviser završi nalog',
      subject: `Servis završen — ${device.id}`,
      body: `Poštovani,\n\nservis uređaja ${device.name} je završen. U prilogu je servisni izvještaj. Sljedeći servis je planiran za ${formatLong(device.nextServiceOn)}.\n\n${brand.companyName}`,
      link: { href: '/demo/izvjestaji', label: 'Primjeri izvještaja' },
    },
    {
      id: 'prijedlog',
      title: 'Prijedlog termina servisa',
      when: 'Kada se približi rok (vlasnik šalje iz „Plan servisa”)',
      subject: proposalDemo.subject,
      body: proposalDemo.body,
      link: { href: '/demo/kupac/TP-002?prijedlog=PRJ-001', label: 'Kako kupac bira termin ili odbija' },
    },
    {
      id: 'podsjetnik',
      title: 'Podsjetnik na servis',
      when: 'Prije roka servisa (npr. 14 dana ranije — DEMO postavka)',
      subject: `Podsjetnik: servis uređaja ${device.id}`,
      body: `Poštovani${cust ? ` (${cust.name})` : ''},\n\npodsjećamo vas da je sljedeći servis uređaja ${device.name} (${loc?.name}) predviđen za ${formatLong(device.nextServiceOn)}. Termin možete odabrati skeniranjem QR koda na uređaju.\n\n${brand.companyName}`,
      link: { href: `/demo/kupac/${device.id}`, label: 'Kartica uređaja (prikaz kupca)' },
    },
  ];

  return (
    <>
      <PageHeader title="Primjeri poruka" subtitle={`Kako bi poruke kupcu mogle izgledati. Primjer za ${title}.`} />
      <p className="mb-4 rounded-xl border border-demo/25 bg-demo-soft px-4 py-3 text-sm">
        Ovo su samo primjeri teksta. Demo ne šalje e-mail, SMS ni poruke kroz aplikacije. Kanali i tekstovi dogovaraju se za stvarnu verziju.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        {examples.map((m) => (
          <Card key={m.id} id={`poruka-${m.id}`} className={cn('p-0', focus === m.id && 'ring-2 ring-primary')} aria-labelledby={`naslov-${m.id}`}>
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-4 py-3 sm:px-5">
              <div>
                <h2 id={`naslov-${m.id}`} className="font-semibold">
                  {m.title}
                </h2>
                <p className="text-[13px] text-ink-2">{m.when}</p>
              </div>
              <span className="rounded-md border border-demo/30 bg-demo-soft px-2 py-0.5 text-[11px] font-bold tracking-wide text-demo">PRIMJER — NIJE POSLANO</span>
            </div>
            <div className="px-4 py-4 sm:px-5">
              <p className="text-sm">
                <span className="text-ink-3">Za: </span>
                {cust?.email ?? 'kupac@example.test'}
              </p>
              <p className="text-sm">
                <span className="text-ink-3">Naslov: </span>
                <span className="font-medium">{m.subject}</span>
              </p>
              <p className="mt-3 rounded-lg bg-bg px-3 py-3 text-sm whitespace-pre-wrap">{m.body}</p>
              {m.id === 'podsjetnik' && focus === 'podsjetnik' ? <p className="mt-2 text-sm font-semibold text-demo">Primjer poruke — nije poslano.</p> : null}
              {m.link ? (
                <Link href={m.link.href} className={buttonClass('secondary', 'sm', 'mt-3')}>
                  {m.link.label}
                </Link>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

      {focus !== 'podsjetnik' ? (
        <div className="mt-4">
          <Link href={`/demo/poruke?primjer=podsjetnik&uredjaj=${device.id}`} className={buttonClass('primary')}>
            Pogledaj primjer podsjetnika
          </Link>
        </div>
      ) : null}

      <Card className="mt-6 p-5">
        <h2 className="text-lg font-semibold">Šta bi se povezalo u vašoj verziji?</h2>
        <ul className="mt-3 grid gap-2 text-[15px] sm:grid-cols-2">
          {[
            'Stvarni kupci, uređaji i servisna historija',
            'Korisnički računi i pristup za vlasnika i servisere',
            'Trajno čuvanje i rad s više uređaja',
            'Stvarne obavijesti kroz dogovorene kanale',
            'Servisni obrasci i intervali potvrđeni od firme',
            'Finalni izgled, kontakt i naziv firme',
          ].map((t) => (
            <li key={t} className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-ink-2">To su predviđene mogućnosti prilagođene verzije, ne funkcije koje su već aktivne u ovom demou.</p>
      </Card>
    </>
  );
}

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesInner />
    </Suspense>
  );
}
