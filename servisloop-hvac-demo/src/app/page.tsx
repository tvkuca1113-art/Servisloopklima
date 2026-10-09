import Link from 'next/link';
import { ArrowRight, CalendarCheck, ClipboardCheck, FileText, QrCode, Smartphone, Thermometer } from 'lucide-react';

import { DemoBar, Logo } from '@/components/chrome';
import { LandingPreview } from '@/components/landing-preview';
import { buttonClass } from '@/components/button-class';
import { brand } from '@/config/brand';

const BENEFITS = [
  { icon: Thermometer, title: 'Uređaji na jednom mjestu', text: 'Historija i naredni servis za svaku klimu i toplotnu pumpu.' },
  { icon: QrCode, title: 'QR na uređaju', text: 'Primjer zakazivanja i prijave kvara bez prijave i aplikacije.' },
  { icon: ClipboardCheck, title: 'Jasan radni nalog', text: 'Serviser na objektu skenira svaki uređaj — nema zabune ni unosa na pogrešan uređaj.' },
];

const STEPS = [
  { icon: Thermometer, title: 'Uređaj', text: 'Vlasnik otvara karticu uređaja s historijom i QR kodom.' },
  { icon: Smartphone, title: 'Kupac', text: 'Kupac skenira QR na uređaju i jednim dodirom prijavi kvar ili zakaže servis.' },
  { icon: CalendarCheck, title: 'Dodjela', text: 'Vlasnik potvrđuje zahtjev, dodaje ostale uređaje na objektu i bira servisera.' },
  { icon: ClipboardCheck, title: 'Servis', text: 'Na objektu serviser skenira QR svakog uređaja, označi „Sve uredno” ili izuzetke.' },
  { icon: FileText, title: 'Izvještaj', text: 'Nastaje primjer izvještaja i datum sljedećeg servisa.' },
];

export default function Landing() {
  const contact = brand.contact;
  return (
    <div className="min-h-dvh bg-surface">
      <DemoBar />
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label={`${brand.productName} — početna`}>
            <Logo />
          </Link>
          <nav aria-label="Početna stranica" className="flex items-center gap-1 sm:gap-2">
            <a href="#kako-radi" className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-medium text-ink-2 hover:text-ink sm:inline-flex">
              Kako radi
            </a>
            <a href="#vasa-verzija" className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-medium text-ink-2 hover:text-ink sm:inline-flex">
              Vaša verzija
            </a>
            <Link href="/demo" className={buttonClass('primary', 'sm')}>
              Pogledaj demo
            </Link>
          </nav>
        </div>
      </header>

      <main id="sadrzaj">
        <section className="bg-gradient-to-b from-bg to-surface">
          <div className="mx-auto grid max-w-[1200px] gap-10 px-4 pt-10 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-12 lg:pt-16 lg:pb-24">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-line-2 bg-surface px-3 py-1 text-[13px] font-medium text-ink-2">
                <span className="rounded bg-demo px-1.5 py-0.5 text-[10px] font-bold text-white">DEMO PROTOTIP</span>
                {brand.productName} · {brand.tagline}
              </p>
              <h1 className="mt-5 text-[34px] leading-[1.1] font-bold tracking-tight text-ink sm:text-[46px]">Ovako može izgledati servisni sistem vaše firme.</h1>
              <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-ink-2">
                Pogledajte primjer evidencije uređaja, QR prijave, rasporeda servisera i servisnog izvještaja za toplotne pumpe i klime.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/demo" className={buttonClass('primary', 'lg')}>
                  Pogledaj demo <ArrowRight aria-hidden />
                </Link>
                <Link href="/demo/kupac/TP-001" className={buttonClass('secondary', 'lg')}>
                  <Smartphone aria-hidden /> Isprobaj prikaz kupca
                </Link>
              </div>
              <div className="mt-6 max-w-xl rounded-xl border border-demo/25 bg-demo-soft px-4 py-3 text-sm text-ink" data-testid="landing-disclaimer">
                <p className="font-semibold">Ovo je pokazni primjer izgleda i načina rada. Sistem još nije povezan sa stvarnim servisnim poslovanjem.</p>
                <p className="mt-1 text-ink-2">Zahtjevi, termini i poruke nisu povezani sa stvarnim servisom. Firma, kupci i uređaji su izmišljeni.</p>
              </div>
            </div>
            <LandingPreview />
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6" aria-labelledby="koristi">
          <h2 id="koristi" className="sr-only">
            Šta demo pokazuje
          </h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <li key={b.title} className="rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
                  <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary" aria-hidden>
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{b.title}</h3>
                  <p className="mt-1 text-ink-2">{b.text}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <section id="kako-radi" className="border-y border-line bg-bg" aria-labelledby="kako-naslov">
          <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
            <h2 id="kako-naslov" className="text-2xl font-bold tracking-tight sm:text-3xl">
              Pogledajte kako bi servis tekao
            </h2>
            <p className="mt-2 max-w-2xl text-ink-2">U istom tabu preglednika demo pokazuje cijeli put: od QR koda na uređaju do izvještaja. Vodič od pet koraka čeka vas u demou.</p>
            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <li key={s.title} className="rounded-2xl border border-line bg-surface p-5">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex size-8 items-center justify-center rounded-full bg-nav text-sm font-bold text-white">{i + 1}</span>
                      <Icon className="size-5 text-primary" aria-hidden />
                    </div>
                    <h3 className="mt-3 font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm text-ink-2">{s.text}</p>
                  </li>
                );
              })}
            </ol>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/demo/uredaji/TP-001" className={buttonClass('primary')}>
                Počni vodič s uređajem TP-001
              </Link>
              <Link href="/demo/serviser" className={buttonClass('secondary')}>
                Prikaz servisera na telefonu
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6" aria-labelledby="iskreno">
          <h2 id="iskreno" className="text-2xl font-bold tracking-tight sm:text-3xl">
            Šta je u demou stvarno, a šta je primjer
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-ok/25 bg-ok-soft/50 p-5">
              <h3 className="font-semibold text-ok">Radi u demou</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                <li>Ekrani, navigacija, pretraga i filteri</li>
                <li>Obrasci s provjerom unosa</li>
                <li>Lokalna simulacija toka u istom tabu</li>
                <li>Pravi QR kod: link, PNG i SVG</li>
                <li>Primjer izvještaja za štampu ili PDF</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-demo/25 bg-demo-soft p-5">
              <h3 className="font-semibold text-demo">Simulacija</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                <li>Slanje zahtjeva i prijave kvara</li>
                <li>Raspored i dodjela servisera</li>
                <li>Obavljeni servis i kontrolna lista</li>
                <li>Poruke i podsjetnici kupcima</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-line bg-bg p-5">
              <h3 className="font-semibold">Izrađuje se za vašu firmu</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                <li>Trajni podaci i rad na više uređaja</li>
                <li>Korisnički računi i dozvole</li>
                <li>Stvarne obavijesti kroz dogovorene kanale</li>
                <li>Servisni obrasci i intervali koje potvrdi firma</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="vasa-verzija" className="bg-nav text-white" aria-labelledby="verzija-naslov">
          <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
            <h2 id="verzija-naslov" className="max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">
              Ako vam odgovara ovaj način rada, pravimo verziju za vašu firmu.
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {['Vaš naziv, logo i izgled.', 'Vaši uređaji, kupci i servisni tim.', 'Funkcije i obavijesti prema dogovorenom procesu.'].map((t) => (
                <li key={t} className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-nav-ink">
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-8" data-testid="contact">
              {contact && (contact.email || contact.phone) ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p className="text-nav-ink">Kontakt: {contact.name}</p>
                  {contact.email ? (
                    <a href={`mailto:${contact.email}`} className={buttonClass('primary')}>
                      {contact.email}
                    </a>
                  ) : null}
                  {contact.phone ? (
                    <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className={buttonClass('secondary')}>
                      {contact.phone}
                    </a>
                  ) : null}
                </div>
              ) : (
                <p className="text-lg text-nav-ink">Za prilagođenu ponudu javite se osobi koja vam je poslala ovaj demo.</p>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 py-6 text-sm text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            {brand.productName} · demo prototip · izmišljeni podaci
          </p>
          <Link href="/demo" className="font-semibold text-primary hover:underline">
            Otvori demo
          </Link>
        </div>
      </footer>
    </div>
  );
}
