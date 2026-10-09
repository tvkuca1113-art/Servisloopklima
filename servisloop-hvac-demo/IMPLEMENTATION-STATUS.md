# Implementation status — za nastavak rada

Stanje: 9. oktobar 2026. Obim: **vizuelni frontend demo s označenom simulacijom**, bez backend-a, baze, prijave i stvarnog slanja. Mjerodavni zahtjevi su u paketu `servisloop-klima-claude-code` (SUPER-PROMPT, 02-DIZAJN, 04-PROVJERE). Stari PLAN/TASKS iz originala nisu obaveze.

## Urađeno

- [x] Zaseban projekat `servisloop-hvac-demo` u repou `tvkuca1113-art/Servisloopklima`. Original `servisloop2` je samo pročitan (commit `6e91257`, isti kao pregledani), nije mijenjan.
- [x] Stack: Next.js 15.5 (App Router), React 19, TypeScript strict, Tailwind v4, `qrcode`, `lucide-react`, Inter (self-hosted, `@fontsource-variable/inter`). Nema Supabase ni server akcija.
- [x] Centralna konfiguracija `src/config/brand.ts` (naziv, firma, boje, opcionalni kontakt).
- [x] Seed `src/lib/demo-data.ts`: 6 kupaca, 8 lokacija, 24 uređaja (16 klima, 8 TP), 2 servisera, 4 zahtjeva, 11 naloga (3 završena s izvještajem, 1 otkazan, 1 bez servisera). Datumi su relativni na dan otvaranja (Europe/Sarajevo), s kalendarskim mjesecima.
- [x] Lokalni store (`src/lib/store.tsx`, useReducer + Context, sessionStorage po tabu), reset, dnevnik aktivnosti.
- [x] Rute: `/`, `/demo`, `/demo/uredaji`, `/demo/uredaji/[id]`, `/demo/raspored`, `/demo/zahtjevi`, `/demo/nalozi`, `/demo/nalozi/[id]`, `/demo/serviser`, `/demo/serviser/nalozi`, `/demo/serviser/nalog/[id]`, `/demo/kupac/[deviceId]` (`/demo/kupac` → TP-001), `/demo/izvjestaji`, `/demo/izvjestaji/[id]`, `/demo/poruke`, `/demo/naljepnica/[id]`, 404.
- [x] Perspektive Vlasnik/Serviser/Kupac bez prijave; kupac bez interne navigacije.
- [x] Vodič od 5 koraka (u stranici na `/demo`, pločica na ostalim ekranima) prati stvarni napredak; `Preskoči vodič`, `Počni ponovo`, `Prikaži vodič`.
- [x] Uređaji: pretraga, filteri (vrsta, status roka; KPI kartice otvaraju filter), dodavanje i uređivanje s validacijom, planiranje demo servisa.
- [x] QR: `qrcode`, ECL M, 4 modula mirne zone, crno na bijelom, prikaz 256 px, PNG/SVG preuzimanje, kopiranje linka, naljepnica za štampu. URL = `NEXT_PUBLIC_SITE_URL` ili trenutni origin; `servisloop2` se odbacuje.
- [x] Kupac: kartica, primjer zakazivanja i kvara, validacija uz polja, `Popuni primjerom`, fotografija (JPG/PNG/WEBP ≤ 5 MB, lokalni pregled i uklanjanje), poštene potvrde.
- [x] Zahtjevi: potvrda s dodjelom, odbijanje u demou, isticanje (`?istakni=`).
- [x] Dodjela servisera (modal): demo kolizija, prijedlog slobodnog termina ili drugog servisera.
- [x] Raspored: sedmica (≥1280 px), dnevne kartice ispod toga; datum, sedmica, serviser, otkazani.
- [x] Serviser: današnji poslovi, narednih 7 dana, nalog s kontrolnom listom (klima/pumpa, `Uredno / Potrebna pažnja / Nije primjenjivo` + napomena), bilješka, do 3 fotografije, vrijeme, materijal, preporuka, ilustrativna potvrda kupca, popis onoga što nedostaje + `Ipak završi demo nalog`.
- [x] Izvještaj: A4 HTML + print CSS, dugme `Štampaj primjer izvještaja`, DEMO u headeru i footeru.
- [x] Primjeri poruka (4) s „PRIMJER — NIJE POSLANO” i blok „Šta bi se povezalo u vašoj verziji?”.
- [x] Pristupačnost: trajni labeli, greške uz polja (`aria-invalid`/`aria-describedby`), focus ring, native `<dialog>` s povratkom fokusa, skip link, reduced-motion, statusi s tekstom i ikonom, touch ciljevi ≥44 px, input 16 px na mobilnom.
- [x] Testovi: 11 unit (Vitest), 16 E2E (Playwright, uključujući kameru s emuliranim videom). Lint, typecheck i build prolaze.
- [x] Predaja: README, DEMO-SCENARIO.md, TEST-REPORT.md, `screenshots/` (33), `primjeri/` (QR PNG/SVG, 3 PDF-a).

## Drugi krug (po povratnoj informaciji naručioca)

- [x] Nalog je **posjeta objektu** s više uređaja (`WorkOrder.items[]`: kontrolna lista, napomena, fotografije, `identifiedBy`/`identifiedAt`, `done` po uređaju).
- [x] Seed: Demo kuća Tuzla ima TP-001, KL-012 i KL-015; današnji NAL-0111 i NAL-0112 imaju po 2 uređaja; NAL-0116 ima 2 uređaja.
- [x] Dodjela iz zahtjeva i planiranje predlažu ostale uređaje na objektu (rok ≤ 90 dana). Trajanje +30 min po uređaju, a termin se pomjeri na slobodan ako je predloženi zauzet.
- [x] Skener (`src/components/scan-dialog.tsx`):
  - prava kamera (`getUserMedia` + `jsqr`), demo naljepnice (uključujući jednu s drugog objekta) i ručni unos;
  - provjera pripadnosti nalogu: drugi objekat → odbijeno, isti objekat → „Dodaj na nalog”.
- [x] Nalog servisera:
  - „Stigao sam — pokreni posjetu”;
  - lista uređaja, unos zaključan do skeniranja;
  - `Sve uredno`, opis samo uz „Potrebna pažnja”;
  - gotove preporuke, opcionalni dodaci sklopljeni, automatsko trajanje.
- [x] Izvještaj po uređaju s načinom identifikacije; kompaktan red kada je sve uredno; sljedeći rok po uređaju.
- [x] Prikaz kupca (`/demo/kupac/[id]`):
  - na desktopu objašnjenje u 5 koraka i QR za vlastiti telefon, a stranica u okviru telefona;
  - na telefonu sklopivo objašnjenje;
  - gornja demo traka s logom (početna) i `Nazad na demo`;
  - prijava kvara: izbor simptoma + hitnost + opcionalni opis i fotografija; kontakt popunjen iz evidencije;
  - status prijave za kupca.
- [x] Vlasnik vidi simptom i „Uređaj ne radi”; hitne prijave su prve.
- [x] Tri pregledna prolaza i ispravke (vidi TEST-REPORT.md).

## Otvoreno

- [ ] **Provjera objavljene verzije.** Naručilac je objavio demo (`servisloop-hvac-demo.vercel.app`, prema screenshotu). Iz ovog okruženja adresa nije dostupna (proxy; Vercel 403), pa provjeru nakon novog pusha treba uraditi ručno:
  - provjeriti `/`, `/demo`, `/demo/kupac/TP-001` u privatnom prozoru;
  - pokrenuti `E2E_BASE_URL=https://<domen> npx playwright test`;
  - regenerisati `primjeri/` s `BASE_URL=https://<domen>` da QR vodi na javni domen;
  - tek tada navesti javni HTTPS link.
- [ ] Fizičko skeniranje QR-a telefonom (kupac i skener servisera) i sa štampane naljepnice. Skener je provjeren samo emuliranom kamerom.
- [ ] Provjera na stvarnom iOS Safari / Android Chrome i čitačem ekrana.
- [ ] Opcionalno: stvarni kontakt autora u `brand.ts` (samo ako ga naručilac dostavi).

## Namjerno izvan obima

Baza, trajno čuvanje, prijava i dozvole, stvarno slanje poruka, cron podsjetnici, naplata, sinhronizacija telefona i računara, automatsko raspoređivanje, tehnički servisni protokoli i univerzalne vrijednosti (tlakovi, punjenje i sl.).

## Napomene za razvoj

- Sve stranice su klijentske i renderuju sadržaj tek kada je lokalno stanje učitano (`ready`), da se izbjegne neusklađenost datuma između servera i preglednika.
- `buttonClass` je u `src/components/button-class.ts` (nije `'use client'`), da ga koristi i serverska početna stranica.
- Verzija stanja je `DEMO_STATE_VERSION` u `demo-data.ts`. Povećati je pri promjeni oblika seed-a da stara proba u tabu ne pukne.
