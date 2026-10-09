# Test report — ServisLoop Klima vizuelni demo

Posljednja provjera: 9. oktobar 2026. Treći krug: ugradnja novih uređaja, prazne naljepnice, plan servisa i prijedlog termina kupcu, uz tri pregledna prolaza.
Okruženje: Linux kontejner, Node 22.22.0, npm 10.9.4, Next.js 15.5.22, Playwright 1.56.1 s instaliranim Chromiumom (headless).
Svi rezultati su stvarno izvedeni nad production buildom (`next build` + `next start`). Što nije izvedeno, navedeno je na kraju.

## Rezime

| Provjera | Komanda | Rezultat |
| --- | --- | --- |
| Lint | `npm run lint` | prošlo, 0 grešaka, 0 upozorenja |
| Typecheck | `npm run typecheck` | prošlo |
| Unit testovi | `npm test` | 3 fajla, **14/14 prošlo** |
| Production build | `npm run build` | prošlo; 20 ruta |
| E2E / smoke | `npx playwright test` | **19/19 prošlo**, uključujući test kamere |
| Screenshot skripte | `scripts/screenshots.mjs`, `scripts/review.mjs`, `scripts/review-ugradnja.mjs` | 32 + 24 + 22 snimka; 0 grešaka u konzoli; 0 px horizontalnog overflowa |
| Primjeri | `scripts/flow-captures.mjs` | QR PNG/SVG + 3 PDF-a iz print prikaza |
| Javni deploy | — | Objavljenu adresu (`servisloop-hvac-demo.vercel.app`, vidljiva na screenshotu naručioca) **nisam mogao otvoriti iz ovog okruženja**: proxy odbija vezu, Vercel API vraća 403. Provjera je izvedena na istom kodu lokalno. |

## Automatski testovi (Playwright, `e2e/`)

| Test | Šta provjerava |
| --- | --- |
| `glavni-tok › cijeli lokalni tok…` | početna (DEMO tekst) → vlasnik (vodič korak 1, 7 otvorenih naloga) → TP-001 (QR URL) → **prikaz kupca**: objašnjenje u koracima, okvir telefona, `Nazad na demo` → validacija (datum, termin, kontakt; unos ostaje) → potvrda „Prikazan je primjer zahtjeva DEMO-001. Nije poslan servisnoj firmi.” + status prijave → vlasnik: **KL-012 i KL-015 predloženi u istoj posjeti**, demo kolizija (Lejla 09:00, dugme onemogućeno) → dodjela → NAL-0118 s 3 uređaja → serviser: završetak bez obrade navodi šta nedostaje → **naljepnica s drugog objekta odbijena („Pogrešan uređaj… Ništa nije upisano”)** → TP-001 skeniran → prazna lista pokazuje šta nedostaje → `Sve uredno` → **KL-012 ručnim unosom** + „Potrebna pažnja” bez opisa (traži opis) → KL-015 → preporuka → završetak (3/3) → izvještaj (sva 3 uređaja, „Ručni unos oznake”, `čćšžđ`) → print sakriva alatnu traku → kupac vidi „Servis obavljen” → vodič „završen” → reset; 0 grešaka u konzoli |
| `glavni-tok › uređaj s istog objekta…` | KL-003 skeniran na posjeti NAL-0111 → „nije na nalogu” → `Dodaj na nalog i nastavi` → 3 uređaja na nalogu |
| `glavni-tok › reload u istom tabu…` | prijava kvara bez simptoma traži izbor; „Curi voda” + „Ne radi uopšte” → potvrda „Stvarna intervencija nije naručena.” → vlasnik vidi simptom i „Uređaj ne radi”; ostaje nakon reloada; novi browser kontekst je ne vidi |
| `ugradnja-i-plan › vlasnik planira ugradnju…` | validacija → novi kupac i objekat → KL-017 „Ugradnja planirana” → naljepnica za paket → kartica kupca „najavljen za ugradnju” → serviser skenira naljepnicu iz paketa, upisuje serijski broj → **prazna naljepnica N-0001** → forma (validacija) → KL-018 → završetak: oba uređaja aktivna, **prvi servis automatski u planu** → „Zapisnik o ugradnji” sa serijskim brojem → `/demo/kupac/N-0001` vodi na KL-018, N-0002 „još nije povezana”, list naljepnica pokazuje „Povezana: KL-018” |
| `ugradnja-i-plan › pogrešna naljepnica…` | kod N-9999 (nije iz kompleta) se odbija |
| `ugradnja-i-plan › prijedlog termina…` | Plan servisa → prijedlog za KL-003 (zakasnio) → poruka „PRIMJER — NIJE POSLANO” s tekstom „…obavi što prije” → link iz poruke → bez izbora traži termin → izbor → „Nije poslano servisnoj firmi” → nalog NAL-0118 kod vlasnika; TP-002 (PRJ-001) → „Ne želim servis sada” → objašnjenje s garantnim listom → traži razlog i potvrdu → „Podsjetićemo vas kasnije” → vlasnik vidi oba odgovora |
| `kamera › skener servisera dekodira QR iz kamere…` | Chromium s lažnom kamerom (Y4M video s QR kodom KL-002) → `Skeniraj kamerom` → **jsQR dekodira sliku s kamere** i otvara unos baš za KL-002 („QR skeniran”) |
| `funkcije › QR PNG i SVG…` | URL = `{baseURL}/demo/kupac/TP-001`, bez `servisloop2`; PNG (≥256 px) i SVG se preuzimaju i **dekodiraju na tačan URL**; URL u novom mobilnom kontekstu otvara stranicu kupca bez prijave, s objašnjenjem i `Nazad na demo` |
| `funkcije › pretraga i filteri…` | 24/24, pumpe 8, klime 16, zakasnio 4, „Mostar” 3, prazno stanje |
| `funkcije › dodavanje i uređivanje…` | validacija, novi TP-009, izmjena naziva, lista 25 |
| `funkcije › fotografija kvara…` | odbijen `.txt`, PNG lokalni pregled, uklanjanje; 0 ne-GET zahtjeva (nema uploada) |
| `funkcije › primjeri poruka…` | 4× „PRIMJER — NIJE POSLANO”; bez „dostavljeno / trajno sačuvan / sve funkcije su aktivne / stvarno zakazan” |
| `rute-i-mobilni › sve glavne rute…` | 23 rute direktno (uključujući `/demo/plan`, `/demo/naljepnice`, `/demo/kupac/N-0001` i link prijedloga): HTTP 200, DEMO traka, nema `href="#"`; 0 grešaka u konzoli |
| `rute-i-mobilni › overflow 360/390/430/768/1280` | sve 23 rute bez horizontalnog overflowa |
| `rute-i-mobilni › modal…` | tastatura, `Esc`, povratak fokusa |

Unit (`src/lib/*.test.ts`):
- kalendarski mjeseci i bosanski formati datuma;
- seed (6/8/24/16/8/2/3), KPI, kolizija;
- čitanje oznake uređaja iz QR-a (URL, ručni unos `kl012`, odbijanje drugih kodova);
- `Sve uredno` popunjava samo neodgovorene stavke;
- kodovi praznih naljepnica;
- budući nalozi i termini prijedloga u primjeru su radnim danima i bez kolizija; komplet od 12 praznih naljepnica.

## Tri pregledna prolaza (drugi krug)

Svaki prolaz je kroz `scripts/review.mjs` snimio cijeli tok na 1440 px i 390 px: kupac → kvar → vlasnik → dodjela → serviser → skeniranje → pogrešan uređaj → unos → završetak → izvještaj → kupac vidi status, plus pregled, raspored, nalozi, uređaji, početna, serviser, poruke. Snimke sam pregledao i popravio:

| Prolaz | Nađeno | Urađeno |
| --- | --- | --- |
| 1 | Napomene „DEMO” imale su ikonu praznog kruga koja liči na radio dugme (vidljivo i na snimku naručioca) | Ikona „info” |
| 1 | Više obavijesti odjednom prekrivalo je sadržaj; na desktopu su prekrivale navigaciju servisera | Jedna obavijest, kraće trajanje, uvijek gore |
| 1 | Vodič ostaje na koraku 1 ako se korak preskoči | Kasniji urađeni korak označava raniji kao prođen |
| 1 | Pločica vodiča prekrivala je dugmad kontrolne liste na telefonu | Kompaktna pločica „Vodič 3/5” |
| 1 | Kartice uređaja na telefonu skučene zbog dugmeta sa strane | Dugme `Skeniraj QR` preko cijele širine ispod |
| 1 | Izvještaj predugačak kada je sve uredno | Jedan red „Sve stavke demo obrasca (6/6): Uredno”; tabela samo za izuzetke |
| 1 | Trajanje posjete se nije mijenjalo s brojem uređaja | +30 min po uređaju (do 3 h), opcije 2,5 h i 3 h |
| 2 | Kolizija termina bila je ispod ruba modala na telefonu, vidjelo se samo sivo dugme | Poruka i „Uzmi HH:MM” u podnožju modala; početni termin se automatski pomjeri na slobodan |
| 2 | Vodič na pregledu vlasnika zauzimao je cijeli ekran telefona | Na telefonu samo trenutni korak; kad je završen, samo poruka |
| 2 | Nejasno koji je uređaj „glavni” na nalogu | Oznaka „Glavni uređaj (iz zahtjeva / plana)” |
| 3 | Na kartici uređaja nije se vidjelo da objekat ima više uređaja | Polje „Na istom objektu” s linkovima |
| 3 | Bez novih overflowa, grešaka ni preklapanja | — |

## Tri pregledna prolaza (treći krug)

`scripts/review-ugradnja.mjs` snima na 1440 i 390 px: nova ugradnja → nalog → naljepnica → serviser (ugradnja + prazna naljepnica) → zapisnik → plan → prijedlog → link kupca → odgađanje → prihvatanje → odgovori → povezana i prazna naljepnica → list naljepnica.

| Prolaz | Nađeno | Urađeno |
| --- | --- | --- |
| 1 | Za zakasneli rok poruka je glasila „treba obaviti do … (prije 35 dana)” | Zakasneli rok: „rok je bio … Preporučujemo da se servis obavi što prije” (poruka i stranica kupca) |
| 1 | Objašnjenje lijevo kod linka iz poruke opisivalo je QR skeniranje | Posebnih 5 koraka za prijedlog termina (rok → poruka → link → izbor/odbijanje → vlasnik) |
| 1 | Termini u primjeru padali su i u nedjelju; jedan termin iz prijedloga sudarao se s nalogom | Budući nalozi i termini samo radnim danima, bez kolizija (unit test) |
| 1 | Nepovezana naljepnica nije govorila serviseru šta da radi | Dodata uputa „Novi uređaj na objektu” |
| 2 | Zapisnik o ugradnji imao je „Datum servisa” i oznaku „servisnog izvještaja”; „nije upisan · nije upisan” | „Datum ugradnje”, „DEMO — primjer zapisnika o ugradnji”, „model/serijski broj nije upisan” |
| 3 | Serijski broj kod ugradnje bio je ispod liste | Polje za serijski broj je prvo, odmah ispod potvrde identifikacije |
| 3 | Bez novih overflowa i grešaka u konzoli | — |

## Matrica provjera iz 04-PROVJERE-DEMOA.md

| ID | Rezultat | Kako |
| --- | --- | --- |
| D01 | ✅ / ⚠️ | Novi kod je u repou `tvkuca1113-art/Servisloopklima`, folder `servisloop-hvac-demo`. Original je samo pročitan (HEAD `6e91257`, push onemogućen u klonu). Nema `.vercel`, `.env` ni `vercel.json` iz originala. Javnu adresu nisam mogao provjeriti iz okruženja (vidi rezime). |
| D02–D03 | ✅ | E2E |
| D04 | ✅ | Prekidač perspektiva; kupac bez interne navigacije, uz demo traku `Nazad na demo` i logo za početnu |
| D05–D06 | ✅ | E2E |
| D07 | ✅ | E2E glavni tok s posjetom od 3 uređaja |
| D08–D10 | ✅ | E2E |
| D11 | ✅ | E2E + `screenshots/tok/m-06b-kolizija.png` |
| D12–D13 | ✅ | E2E (po uređaju i za cijelu posjetu) |
| D14 | ✅ | E2E |
| D15 | ✅ | E2E dekodiranje PNG i SVG; `primjeri/` (lokalni URL) |
| D16 | ✅ lokalno | Novi kontekst otvara stranicu kupca bez prijave; javni domen nije provjeren iz okruženja |
| D17 | ✅ | Objašnjenje na stranici kupca i u dokumentaciji |
| D18 | ✅ | `Štampaj primjer izvještaja` → `window.print()`; Chromium PDF iz print prikaza (`primjeri/*.pdf`), čćšžđ ispravni |
| D19–D20 | ✅ | E2E reset i reload; dugi nazivi i prazna stanja |
| D21 | ✅ djelimično | Modal i fokus (E2E); radio dugmad u formama s tastaturom pregledana; čitač ekrana nije testiran |
| D22–D23 | ✅ | E2E overflow 360–1280; snimci 390/1440 |
| D24–D26 | ✅ | Kontakt pošten tekst; 0 grešaka u konzoli; nema lažnih statusa |

Kontrast stvarnih kombinacija boja (WCAG formula) ostaje ≥4,7:1 za sav normalni tekst; tabela je u prethodnoj verziji izvještaja, a boje nisu mijenjane.

## Screenshotovi

- `screenshots/01…16-*-desktop.png` i `*-mobile.png`: glavne stranice (uključujući plan servisa, prazne naljepnice i prijedlog termina).
- `screenshots/ugradnja-i-plan/`: nova ugradnja, nalog i naljepnica za paket, serviser (ugradnja, prazna naljepnica, forma novog uređaja, završetak s prvim servisom), zapisnik, plan servisa, prijedlog (modal, poslan), kupac (izbor, odbijanje, odgoda, prihvatanje), odgovori, prazna naljepnica, list naljepnica.
- `screenshots/tok/`: tok skeniranja (`d-` = 1440 px, `m-` = 390 px):
  - `01` kartica kupca, `01b` objašnjenje, `02–04` prijava kvara, greška, potvrda;
  - `06/06b` dodjela s uređajima na objektu i kolizijom, `07` nalog kod vlasnika;
  - `08–09` posjeta servisera, `10` skeniranje, `11` pogrešan uređaj, `12–13` unos i „Sve uredno”;
  - `15–16` završetak, `17` izvještaj, `18` status kod kupca, `19` pregled.

Na full-page snimcima fiksni elementi (donja navigacija, sticky dugme, vodič) pojavljuju se na poziciji prvog ekrana. To je artefakt snimanja.

## Šta NIJE provjereno

- **Objavljena verzija na Vercelu** nije dostupna iz ovog okruženja (proxy i Vercel 403). Nakon pusha na `main` treba provjeriti da se novi deploy pokrenuo.
- Tekst o posljedicama odgađanja servisa je namjerno opšti i provjerljiv; firma ga treba potvrditi prema proizvođačima koje ugrađuje.
- **Fizička kamera telefona i fizička naljepnica.** Skener je provjeren emuliranom kamerom u Chromiumu, ne stvarnim telefonom. Na telefonu kamera radi samo preko HTTPS-a i uz dozvolu za kameru.
- Stvarni iOS Safari / Android Chrome, čitač ekrana, fizički štampač.
- Headless Chromium prikazuje datum kao `mm/dd/yyyy`; stvarni preglednik prikazuje lokalni format.
