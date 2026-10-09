# ServisLoop Klima — vizuelni demo

**DEMO PROTOTIP.** Pokazni frontend servisnog sistema za firme koje ugrađuju i servisiraju toplotne pumpe i klima uređaje. Pokazuje izgled i približan način rada: evidenciju uređaja, QR karticu za kupca, raspored i dodjelu servisera, mobilni radni nalog i primjer servisnog izvještaja.

Ovo nije produkcijski servisni sistem. Svi podaci su izmišljeni, a zahtjevi, termini, servisi i poruke su simulacija.

## Šta stvarno radi, šta je simulacija, šta se izrađuje za firmu

| Stvarno radi u demou | Simulacija | Izrađuje se u prilagođenoj verziji |
| --- | --- | --- |
| Svi ekrani, navigacija, aktivne stavke, back linkovi, direktno otvaranje ruta | Slanje zahtjeva za servis i prijave kvara | Trajni podaci, rad na više uređaja |
| Pretraga i filteri (uređaji, nalozi, zahtjevi, raspored) | Potvrda/odbijanje zahtjeva, dodjela servisera, kolizija termina | Korisnički računi, prijava i dozvole |
| Obrasci s validacijom, lokalni pregled fotografije | Pokretanje i završetak naloga, kontrolna lista | Stvarne obavijesti (e-mail/SMS/druge kanale po dogovoru) |
| Pravi QR kod (biblioteka `qrcode`): link, PNG i SVG preuzimanje, naljepnica za štampu | Primjeri poruka i podsjetnika (označeni „PRIMJER — NIJE POSLANO”) | Servisni obrasci i intervali koje potvrdi firma |
| Primjer izvještaja kao A4 HTML za štampu (`Štampaj primjer izvještaja` → „Sačuvaj kao PDF”) | Datumi i rokovi (relativni na dan otvaranja) | Finalni naziv, logo, kontakt i izgled firme |

Demo nema bazu, server upis, prijavu, slanje e-maila/SMS-a/Vibera, naplatu ni cron.

## Kako se ponaša stanje probe

- Vlasnik, serviser i kupac u **istom browser tabu** dijele isto lokalno stanje: zahtjev koji „kupac” simulira vidi se kod vlasnika, a dodijeljeni nalog kod servisera.
- Stanje se drži samo u tom tabu (sessionStorage). Preživi refresh, a nestaje zatvaranjem taba. Novi tab, drugi preglednik ili telefon počinju od početnog primjera.
- `Vrati početni primjer` (u bočnom meniju, meniju „Više” i u vodiču kao „Počni ponovo”) vraća izmišljene podatke. Datumi se tada računaju od tog dana (Europe/Sarajevo).
- QR na fizičkom telefonu otvara pokaznu karticu uređaja. Ništa se **ne sinhronizuje** između telefona i računara.

## Pokretanje lokalno

Potreban je Node.js 20.11+ (provjereno na Node 22).

```bash
cd servisloop-hvac-demo
npm ci
npm run dev        # http://localhost:3000
```

Produkcijski build:

```bash
npm run build
npm start          # http://localhost:3000
```

## Provjere

```bash
npm run lint        # ESLint (next/core-web-vitals + TypeScript)
npm run typecheck   # tsc --noEmit
npm test            # Vitest: datumi, demo podaci, KPI, kolizija
npm run build
npx playwright test # E2E nad production buildom (pokreće `next start` na portu 3200)
```

Playwright koristi instalirani Chromium. Za testiranje objavljene verzije: `E2E_BASE_URL=https://… npx playwright test`.

Screenshotovi i primjeri (QR, PDF):

```bash
npm run build && npx next start -p 3100 &
BASE_URL=http://localhost:3100 node scripts/screenshots.mjs     # → screenshots/
BASE_URL=http://localhost:3100 node scripts/flow-captures.mjs   # → screenshots/2x-*.png, primjeri/
```

## Prilagodba za budućeg klijenta

- `src/config/brand.ts`: naziv proizvoda, naziv firme, inicijale logotipa, boje i opcionalni kontakt autora. Dok je `contact: null`, početna stranica prikazuje „Za prilagođenu ponudu javite se osobi koja vam je poslala ovaj demo.” Kontakt se upisuje samo stvarnim, dostavljenim podacima i tada postaje funkcionalan `mailto:`/`tel:` link.
- `src/lib/demo-data.ts`: izmišljeni kupci, lokacije, uređaji, serviseri, zahtjevi i nalozi.
- `src/lib/checklists.ts`: pokazni obrazac kontrolne liste (nije tehnički protokol).
- Dizajn tokeni: `src/app/globals.css` (`@theme`).

## Objavljivanje na ZASEBNOM Vercel projektu

Original (`servisloop2`, repo, Vercel projekat, domen) se **ne dira**. Ovaj demo ide samo na novi projekat.

1. Vercel → **Add New… → Project** → importuj repo `tvkuca1113-art/Servisloopklima` (ne `servisloop2`).
2. Project Name: `servisloop-hvac-demo`.
3. **Root Directory: `servisloop-hvac-demo`**, Framework Preset: Next.js. Build i install komande ostaju podrazumijevane.
4. Environment Variables nisu potrebne. Opcionalno `NEXT_PUBLIC_SITE_URL=https://<novi-domen>`. Bez nje QR koristi adresu s koje je stranica otvorena. Originalni `servisloop2` domen kod upisivanja se ignoriše.
5. Deploy. Zatim provjeri: `/`, `/demo`, `/demo/kupac/TP-001` u privatnom prozoru (bez prijave) i dekodiranje QR-a s `/demo/uredaji/TP-001`. Može i `E2E_BASE_URL=https://<novi-domen> npx playwright test`.
6. Ako je uključena Vercel Authentication za production, isključi je za ovaj projekat, jer QR i link moraju raditi bez prijave.

Nema `vercel.json`, cron-a ni `.vercel` povezivanja iz originala.

## Struktura

```
src/
  app/
    page.tsx                         početna (pitch)
    demo/(vlasnik)/…                 pregled, uređaji, raspored, zahtjevi, nalozi, izvještaji, poruke
    demo/serviser/…                  mobilni prikaz servisera i nalog
    demo/kupac/[deviceId]/           QR kartica kupca (bez interne navigacije)
    demo/(dokument)/izvjestaji/[id]  A4 izvještaj za štampu
    demo/(dokument)/naljepnica/[id]  QR naljepnica za štampu
  components/                        UI, shellovi, vodič, QR panel, modali
  config/brand.ts                    centralna konfiguracija
  lib/                               demo podaci, store, datumi, QR, izvedene vrijednosti
e2e/                                 Playwright smoke/E2E
scripts/                             screenshotovi i primjeri
screenshots/, primjeri/              rezultati za predaju
```

Vidi i `DEMO-SCENARIO.md`, `TEST-REPORT.md` i `IMPLEMENTATION-STATUS.md`.
