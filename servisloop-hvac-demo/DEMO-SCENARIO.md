# Demo scenario — ServisLoop Klima

**DEMO PROTOTIP.** Podaci su izmišljeni. Zahtjevi, termini i poruke su simulacija. Demo pokazuje izgled i približan način rada; nije povezan sa stvarnim servisnim poslovanjem.

## Za koga i zašto

Firma koja ugrađuje i servisira klime i toplotne pumpe za nekoliko minuta vidi:
- kako bi pratila kupce, objekte i uređaje s rokovima servisa;
- kako bi kupac skenirao QR na uređaju i jednim dodirom prijavio kvar ili zakazao servis;
- kako bi vlasnik rasporedio posao, s jednim dolaskom za sve uređaje na objektu;
- kako bi serviser na objektu skenirao svaki uređaj, bez zabune i bez unosa na pogrešan uređaj;
- kako izgleda izvještaj i sljedeći rok.

## Proba za pet minuta (u istom tabu)

Otvorite `/demo`. Na vrhu je vodič **Pogledaj kako bi servis tekao**, koji prati stvarni napredak. Na ostalim ekranima vodič je mala pločica dolje desno.

1. **Otvori primjer uređaja.** `TP-001 · Demo kuća Tuzla` (Toplotna pumpa zrak–voda). Pogledajte rok, interval (DEMO postavka), historiju, QR kod i „Na istom objektu” (KL-012 i KL-015).
2. **Pogledaj QR i prikaz kupca.** `Pogledaj prikaz kupca`.
   - Na računaru je lijevo objašnjenje u 5 koraka (*QR naljepnica → kupac skenira → otvara se stranica → prijava → stiže vlasniku*), a desno stranica kako je kupac vidi na telefonu.
   - QR kod lijevo možete skenirati svojim telefonom.
   - Gore su uvijek `Nazad na demo` i logo za povratak na početnu.
3. **Kao kupac prijavi kvar ili zakaži servis.**
   - **Prijavi kvar:** izbor problema („Ne grije”, „Curi voda”…), „Ne radi uopšte” / „Radi, ali s problemom”, opcionalno opis i fotografija → `Simuliraj prijavu kvara`.
   - **Zakaži servis:** datum i termin (`Popuni primjerom`) → `Simuliraj slanje zahtjeva`.
   - Podaci kupca su već popunjeni iz evidencije firme (`Promijeni` ako treba). Potvrda jasno kaže da ništa nije poslano. Kupac vidi status svoje prijave.
4. **Kao vlasnik dodijeli servisera.** `Pogledaj kako ga vidi vlasnik` → `Potvrdi i dodijeli servisera`.
   - U istu posjetu su predloženi i ostali uređaji na objektu kojima uskoro ističe servis (KL-012, KL-015). Trajanje se prilagodi broju uređaja.
   - Prikaz kolizije: danas, Lejla Kovačević, 09:00 → *Demo kolizija termina* i prijedlog slobodnog termina.
5. **Kao serviser skeniraj uređaje, završi i pogledaj izvještaj.** `Otvori kao serviser` → `Stigao sam — pokreni posjetu`.
   - Unos za uređaj je **zaključan dok se njegov QR ne skenira**: `Skeniraj QR uređaja` (prava kamera na telefonu), dodir na demo naljepnicu ili, ako je naljepnica oštećena, ručni unos oznake (bilježi se u izvještaju).
   - Probajte i naljepnicu „drugi objekat”: *Pogrešan uređaj … Ništa nije upisano.*
   - Za svaki uređaj: `Sve uredno` jednim dodirom, pa promijenite samo izuzetke. Kratak opis je obavezan samo uz „Potrebna pažnja”. Fotografija i napomena su opcionalne.
   - Na kraju preporuka jednim dodirom → `Završi demo nalog` → `Pogledaj primjer izvještaja` → `Štampaj primjer izvještaja` („Sačuvaj kao PDF”). Trajanje posjete se bilježi automatski.

Nakon toga vlasnički pregled pokazuje promijenjene brojke i aktivnosti (ko je i kako identifikovao koji uređaj), a uređaji imaju nove rokove. Kupac na kartici vidi „Servis obavljen”. `Počni ponovo` ili `Vrati početni primjer` vraća početno stanje.

## Novi uređaj: ugradnja i QR naljepnica

**Najavljena ugradnja (preporučeni put):**
1. Vlasnik: `Uređaji` ili `Plan servisa` → `Nova ugradnja`. Bira postojeći objekat ili novog kupca, vrstu uređaja, interval (DEMO postavka), servisera i termin.
2. Uređaj odmah dobija oznaku (npr. KL-017) i status „Ugradnja planirana”. Vlasnik štampa QR naljepnicu (`Štampaj naljepnicu za paket`) koja ide uz uređaj.
3. Serviser: nalog „Ugradnja” → `Stigao sam` → zalijepi naljepnicu i skenira je.
   - Kratka lista: ugrađen i pušten u rad, naljepnica zalijepljena i skenirana, kupac upoznat, dokumentacija predata.
   - Serijski broj je opcionalan.
4. `Završi demo nalog` → uređaj je aktivan, a **prvi servis je automatski u planu** (datum ugradnje + interval). Izvještaj je „Zapisnik o ugradnji”.

**Nenajavljen uređaj na objektu (rezervni komplet):**
1. Vlasnik unaprijed štampa list **praznih naljepnica** (`/demo/naljepnice`, kodovi N-0001…) i daje ih serviserima.
2. Na objektu: `Novi uređaj na objektu (prazna naljepnica)` → serviser zalijepi i skenira praznu naljepnicu → nekoliko polja (upravo ugrađen ili postojeći uređaj, vrsta, naziv, opcionalno model i serijski broj, interval) → `Dodaj uređaj i nastavi`.
3. Naljepnica se trajno veže za uređaj; kupac koji je skenira dobija stranicu tog uređaja. Prazna, nepovezana naljepnica kupcu pokazuje da još nije povezana. Kod koji nije iz kompleta firme se odbija.

## Plan servisa i prijedlog termina kupcu

1. `Plan servisa` prikazuje rokove koji su prošli ili ističu u narednih 30 dana a nemaju termin, zatim šta je već ugovoreno, odgovore kupaca i planirane ugradnje.
2. `Pošalji prijedlog termina` (i na kartici uređaja i u „Potrebna pažnja”):
   - ostali uređaji na objektu mogu u isti termin;
   - kanal je e-mail ili SMS;
   - sistem predloži 3 slobodna termina (radni dani, bez preklapanja s nalozima; mogu se promijeniti);
   - prikaže se tekst poruke s oznakom **PRIMJER — NIJE POSLANO**.
3. `Otvori link iz poruke (kako kupac vidi)`. Kupac može:
   - **odabrati termin** → u ovom tabu odmah nastaje radni nalog kod vlasnika i servisera;
   - **predložiti drugi termin** → obrazac za zakazivanje;
   - **reći „Ne želim servis sada”** → prije odluke čita kratko, provjerljivo objašnjenje (preporuka proizvođača i uputstvo uređaja, mogući neprimijećeni problemi, manja efikasnost, garantni list), bira razlog (npr. „Podsjetite me za mjesec dana”) i potvrđuje da je pročitao.
4. Vlasnik u `Plan servisa` → „Odgovori kupaca” vidi: čeka odgovor / odabrao termin (s nalogom) / odbio (s razlogom) / traži kasniji podsjetnik.

U primjeru već postoji poslan prijedlog **PRJ-001** za TP-002: `/demo/kupac/TP-002?prijedlog=PRJ-001`.

## Šta serviser zaista mora unijeti

| Situacija | Unos |
| --- | --- |
| Sve uredno | Skeniranje QR-a + `Sve uredno` + `Sačuvaj` (3 dodira po uređaju) |
| Nešto treba pažnju | Isto + jedan odabir „Potrebna pažnja” + jedna rečenica |
| Na kraju posjete | Jedna preporuka (gotovi prijedlozi) + `Završi` |
| Opcionalno | Fotografija, napomena, materijal, ilustrativna potvrda kupca |

Datum, vrijeme, serviser, uređaj, lokacija i trajanje upisuju se automatski.

## Ostalo što se može klikati

- **Uređaji:** pretraga (naziv, tip, kupac, grad), filter vrste i statusa roka, `Dodaj demo uređaj`, `Uredi`, `Planiraj demo servis` (s ostalim uređajima na objektu).
- **QR:** `Preuzmi QR PNG`, `Preuzmi QR SVG`, `Kopiraj demo link`, `Štampaj naljepnicu`.
- **Raspored:** sedmica na širokom ekranu i dnevne kartice na užem; datum, sedmica, serviser, otkazani; dodjela naloga bez servisera.
- **Zahtjevi:** hitne prijave („Uređaj ne radi”) su prve; potvrda s dodjelom ili odbijanje u demou.
- **Radni nalozi:** filteri, detalj sa svim uređajima posjete i statusom identifikacije, promjena servisera, `Otkaži u demou`.
- **Serviser (telefon):** `Moji demo poslovi danas` (objekat i broj uređaja), narednih 7 dana, moji nalozi.
- **Primjeri poruka:** potvrda zahtjeva, potvrda termina, završen servis i podsjetnik, svi s oznakom **PRIMJER — NIJE POSLANO**.

## QR na telefonu

QR kod sadrži adresu kartice uređaja na sajtu na kojem je demo otvoren (npr. `https://<domen>/demo/kupac/TP-001`).
- **Kupac** ga skenira običnom kamerom telefona i dobija stranicu uređaja, bez prijave.
- **Serviser** isti kod skenira unutar aplikacije. Aplikacija iz adrese čita oznaku uređaja i provjerava da je na nalogu.

Zahtjev poslan s telefona **ne pojavljuje se** na računaru: svaki preglednik ima svoju lokalnu probu. Cijeli povezani tok radi u jednom tabu.

## Šta je simulacija

- slanje zahtjeva i prijave kvara, status prijave kod kupca;
- potvrda, odbijanje, dodjela servisera i kolizija termina;
- posjeta, identifikacija uređaja, kontrolna lista i potvrda kupca (ilustrativna rubrika);
- poruke i podsjetnici (ništa se ne šalje);
- rokovi i intervali (DEMO postavke, ne preporuka proizvođača).

## Šta se izrađuje za firmu nakon dogovora

- stvarni kupci, objekti, uređaji i servisna historija;
- korisnički računi i pristup za vlasnika i servisere;
- trajno čuvanje i rad s više uređaja (telefon servisera ↔ kancelarija);
- stvarne obavijesti kroz dogovorene kanale;
- servisni obrasci i intervali koje potvrdi firma;
- finalni izgled, kontakt i naziv firme, štampa pravih naljepnica.

To su predviđene mogućnosti, ne funkcije koje su već aktivne.

## Izmišljeni podaci u primjeru

- Firma: **Primjer Klima d.o.o. — demo firma**.
- 6 kupaca, 8 objekata, 24 uređaja (16 klima, 8 toplotnih pumpi), 2 servisera, 12 praznih naljepnica (N-0001…N-0012), 2 prijedloga termina (jedan čeka odgovor, jedan prihvaćen).
- Objekti s više uređaja:
  - *Demo kuća Tuzla*: TP-001, KL-012, KL-015;
  - *Demo poslovni prostor*: 4 uređaja;
  - *Demo pansion — depandansa*: 3 uređaja.
- Današnje posjete s 2 uređaja: NAL-0111 i NAL-0112.
- Modeli i serijski brojevi označeni su kao demonstracijski. E-mail adrese su na `example.test`. Telefoni nisu stvarni i nisu klikabilni.
