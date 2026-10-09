# Test report — ServisLoop Klima vizuelni demo

Datum provjere: 9. oktobar 2026. Okruženje: Linux kontejner, Node 22.22.0, npm 10.9.4, Next.js 15.5.22, Playwright 1.56.1 s instaliranim Chromiumom (headless).
Svi rezultati ispod su stvarno izvedeni nad production buildom (`next build` + `next start`). Što nije izvedeno, navedeno je na kraju.

## Rezime

| Provjera | Komanda | Rezultat |
| --- | --- | --- |
| Lint | `npm run lint` | prošlo, 0 grešaka, 0 upozorenja |
| Typecheck | `npm run typecheck` | prošlo |
| Unit testovi | `npm test` | 2 fajla, **8/8 prošlo** |
| Production build | `npm run build` | prošlo; 18 ruta |
| E2E / smoke | `npx playwright test` | **14/14 prošlo** (≈1,2 min) |
| Screenshot skripta | `node scripts/screenshots.mjs` | 26 snimaka (desktop 1440 i mobile 390), 0 grešaka u konzoli, 0 px horizontalnog overflowa |
| Snimanje toka | `node scripts/flow-captures.mjs` | 7 snimaka stanja + QR PNG/SVG + 3 PDF-a iz print prikaza |
| **Javni deploy** | Vercel MCP | **nije izveden**: 403 „You don't have permission to create the project” (vidi D01) |

## Automatski testovi (Playwright, `e2e/`)

| Test | Šta provjerava |
| --- | --- |
| `glavni-tok › cijeli lokalni tok od QR kartice do izvještaja` | početna (DEMO tekst) → vlasnik (vodič korak 1, 7 otvorenih naloga) → TP-001 (QR URL) → prikaz kupca → validacija prazne/loše forme (greške uz polja, unos ostaje) → `Simuliraj slanje zahtjeva` → potvrda „Prikazan je primjer zahtjeva DEMO-001. Nije poslan servisnoj firmi.” → zahtjev kod vlasnika → **demo kolizija** (Lejla 09:00, dugme onemogućeno) → dodjela Amaru → nalog NAL-0118 + „Promjena je prikazana u ovoj probnoj verziji.” → serviser: pokretanje, prazna lista („U demo obrascu nedostaje”), popunjavanje, završetak → izvještaj (DEMO oznaka, NAL-0118, `č ć š ž đ`) → print media sakriva alatnu traku → vodič „završen”, aktivnost upisana → reset vraća početno stanje; bez grešaka u konzoli |
| `glavni-tok › reload u istom tabu…` | prijava kvara (potvrda „Stvarna intervencija nije naručena.”) ostaje nakon reloada u istom tabu; novi browser kontekst je ne vidi |
| `funkcije › QR PNG i SVG…` | URL = `{baseURL}/demo/kupac/TP-001`, ne sadrži `servisloop2`; PNG se preuzima (≥256 px) i **jsQR ga dekodira na tačan URL**; SVG se preuzima, renderuje i dekodira na isti URL; URL otvoren u novom mobilnom kontekstu prikazuje karticu bez prijave i poštenu QR napomenu |
| `funkcije › pretraga i filteri…` | 24/24, pumpe 8, klime 16, zakasnio 4, „Mostar” 3, prazno stanje |
| `funkcije › dodavanje i uređivanje…` | validacija naziva i lokacije, novi TP-009, izmjena naziva, lista 25 |
| `funkcije › fotografija kvara…` | odbijen `.txt` s porukom o formatu, PNG lokalni pregled, uklanjanje; **0 ne-GET zahtjeva** (nema uploada) |
| `funkcije › primjeri poruka…` | 4× „PRIMJER — NIJE POSLANO”, „Primjer poruke — nije poslano.”; tekst ne sadrži „dostavljeno”, „trajno sačuvan”, „sve funkcije su aktivne”, „stvarno zakazan” |
| `rute-i-mobilni › sve glavne rute…` | 19 ruta direktno: HTTP 200, DEMO traka vidljiva, nema `href="#"`; `/demo/kupac` preusmjerava na TP-001; bez grešaka u konzoli |
| `rute-i-mobilni › overflow 360/390/430/768/1280` | svih 19 ruta bez horizontalnog overflowa na svakoj širini |
| `rute-i-mobilni › modal…` | otvaranje tastaturom, `Esc` zatvara, fokus se vraća na dugme |

Unit (`src/lib/*.test.ts`): kalendarski mjeseci (31. aug + 6 mj. = 28./29. feb; 6 mjeseci ≠ 180 dana), bosanski formati datuma, ponedjeljak sedmice, „danas” u Europe/Sarajevo, obim seed podataka (6/8/24/16/8/2/3), KPI iz podataka, detekcija kolizije.

## Matrica provjera iz 04-PROVJERE-DEMOA.md

| ID | Rezultat | Kako |
| --- | --- | --- |
| D01 | ✅ lokalno / ⚠️ deploy | Novi kod je u `servisloop-hvac-demo` u repou `tvkuca1113-art/Servisloopklima` (remote provjeren). Klon originala samo za čitanje ima push URL `DISABLED_READ_ONLY`, nema lokalnih izmjena, HEAD = `6e91257…` = pregledani commit = trenutni `origin/HEAD`. Nema `.vercel`, `.env` ni `vercel.json` iz originala. Novi Vercel projekat **nije kreiran**: API je vratio 403 za kreiranje projekta i za deployment. Original nije korišten kao zaobilaznica. |
| D02 | ✅ | Početna: DEMO traka i rečenica „Ovo je pokazni primjer izgleda i načina rada…” (E2E) |
| D03 | ✅ | 19 ruta direktno, HTTP 200 (E2E) |
| D04 | ✅ | Prekidač Vlasnik/Serviser/Kupac bez login forme; kupac bez interne navigacije (screenshotovi 02, 05, 10) |
| D05 | ✅ | E2E filteri i brojke |
| D06 | ✅ | E2E dodavanje/uređivanje; nema mrežnih upisa |
| D07 | ✅ | E2E glavni tok |
| D08 | ✅ | E2E + screenshot `20-kupac-forma-greske-mobile.png` |
| D09 | ✅ | E2E tekst potvrde |
| D10 | ✅ | E2E: preview, uklanjanje, 0 upload zahtjeva |
| D11 | ✅ | E2E + `22-dodjela-kolizija-mobile.png` |
| D12 | ✅ | E2E „U demo obrascu nedostaje” |
| D13 | ✅ | E2E: status, aktivnost, izvještaj, novi rok |
| D14 | ✅ | E2E poruke |
| D15 | ✅ | E2E dekodiranje PNG i SVG; primjeri u `primjeri/` (lokalni URL `http://localhost:3100/...`) |
| D16 | ✅ lokalno | Novi browser kontekst otvara karticu bez prijave. Na javnom domenu nije provjereno jer deploy nije izveden. |
| D17 | ✅ | Tekst na kartici i u dokumentaciji; nema tvrdnje o sinhronizaciji |
| D18 | ✅ | HTML print prikaz; dugme se zove `Štampaj primjer izvještaja` i poziva `window.print()`. Chromium `page.pdf()` iz print media dao je A4 PDF-ove (`primjeri/*.pdf`, 2 stranice za nalog s fotografijom). Vizuelno pregledano: čćšžđ ispravni, tabela i dugi tekst se ne režu, DEMO u headeru i footeru. |
| D19 | ✅ | E2E reset i reload |
| D20 | ✅ | Dugi naziv KL-009 i duga bilješka bez overflowa; prazna stanja (pretraga, zahtjevi, nalozi) |
| D21 | ✅ djelimično | Modal: tastatura, Esc, povratak fokusa (E2E). Vidljiv focus ring i trajni labeli pregledani na screenshotovima. Čitač ekrana nije testiran. |
| D22 | ✅ | 360/390/430: 0 px overflowa (E2E); sticky CTA i bottom nav pregledani na snimcima |
| D23 | ✅ | 768/1280 E2E bez overflowa; 1440 screenshotovi |
| D24 | ✅ | `contact: null` → „Za prilagođenu ponudu javite se osobi koja vam je poslala ovaj demo.” Nema mrtvog dugmeta. |
| D25 | ✅ | lint/typecheck/build prošli; 0 runtime grešaka u konzoli u E2E i screenshot prolazima |
| D26 | ✅ | E2E provjera zabranjenih fraza na porukama; statusi „Potvrđen u demou / Odbijen u demou” |

## Kontrast (izračunato po WCAG formuli za stvarne kombinacije)

| Kombinacija | Omjer |
| --- | --- |
| Glavni tekst #1D2939 na #F7F9FC | 13,94:1 |
| Sekundarni #475467 na bijelom | 7,69:1 |
| Pomoćni #667085 na bijelom / na #F7F9FC | 4,97:1 / 4,72:1 |
| Bijelo na primarnom #2563EB (dugmad) | 5,17:1 |
| Uredno #067647 na #ECFDF3 | 5,40:1 |
| Pažnja #B54708 na #FFFAEB | 5,20:1 |
| Kasni #B42318 na #FEF3F2 | 6,05:1 |
| Info #1D4ED8 na #EFF4FF | 6,08:1 |
| DEMO #6941C6 na #F4F3FF / bijelo na #6941C6 | 6,02:1 / 6,62:1 |
| Navigacija #E4E7EC / #98A2B3 na #101828 | 14,32:1 / 6,89:1 |

Svi statusi uz boju imaju tekst i ikonu.

## Screenshotovi (`screenshots/`)

Stvarno izgrađeni ekrani, Chromium headless, `bs-BA`, `Europe/Sarajevo`:
- `01…13-*-desktop.png` (1440×900, full page) i `01…13-*-mobile.png` (390×844 @2x, full page): početna, vlasnički pregled, uređaji, TP-001, kartica kupca, zakazivanje, raspored, zahtjevi, nalozi, serviser, izvještaj, poruke, naljepnica.
- `20-kupac-forma-greske-mobile.png`, `21-kupac-potvrda-mobile.png`, `22-dodjela-kolizija-mobile.png`, `23-serviser-danas-mobile.png`, `24-serviser-nalog-mobile.png` (duga bilješka + fotografija), `25-serviser-zavrseno-mobile.png`, `26-izvjestaj-mobile.png`.

Napomena: na full-page snimcima fiksni elementi (bočni meni, donja navigacija, vodič, sticky dugme) se pojavljuju na poziciji prvog ekrana. To je artefakt snimanja, ne izgled stranice pri skrolanju.

## Primjeri (`primjeri/`)

- `qr-TP-001-demo.png` (512 px, dekodiran: `http://localhost:3100/demo/kupac/TP-001`), `qr-TP-001-demo.svg`.
- `primjer-izvjestaja-NAL-0102.pdf`, `primjer-izvjestaja-iz-toka.pdf`, `naljepnica-TP-001.pdf`: PDF iz browser print prikaza (isti mehanizam kao „Sačuvaj kao PDF”).
- QR primjeri vode na lokalni server s kojeg su generisani. Za javni domen treba ih ponovo generisati nakon deploya (`BASE_URL=https://… node scripts/flow-captures.mjs`).

## Šta NIJE provjereno

- **Javni HTTPS link**: zaseban deploy nije izveden (Vercel 403 na kreiranje projekta; u okruženju nema Vercel CLI ni tokena). Koraci za objavu su u README-u.
- **URL i dekodiranje provjereni; fizički scan nije izveden.** Ni telefonom ni sa štampane naljepnice.
- Stvarni iOS Safari / Android Chrome (samo emulacija u Chromiumu). Na snimcima `<input type="date">` prikazuje `mm/dd/yyyy` jer headless Chromium koristi en-US format. Stvarni preglednik prikazuje lokalni format korisnika.
- Stvarni sistemski dijalog štampe (provjeren print CSS i PDF iz Chromiuma, ne fizički štampač).
- Čitač ekrana (NVDA/VoiceOver).
- Safe-area na uređaju s notch-om (CSS `env(safe-area-inset-bottom)` postoji, nije provjeren na fizičkom uređaju).
