# Demo scenario — ServisLoop Klima

**DEMO PROTOTIP.** Podaci su izmišljeni. Zahtjevi, termini i poruke su simulacija. Demo pokazuje izgled i približan način rada; nije povezan sa stvarnim servisnim poslovanjem.

## Za koga i zašto

Firma koja ugrađuje i servisira klime i toplotne pumpe za nekoliko minuta vidi:
- kako bi pratila kupce, lokacije i uređaje s rokovima servisa;
- kako bi kupac preko QR koda na uređaju zakazao servis ili prijavio kvar;
- kako bi vlasnik rasporedio posao serviseru;
- kako bi serviser na telefonu evidentirao obavljeni posao;
- kako izgleda servisni izvještaj i sljedeći rok.

## Proba za pet minuta (u istom tabu)

Otvorite `/demo`. Na vrhu je vodič **Pogledaj kako bi servis tekao**, koji prati stvarni napredak. Na ostalim ekranima vodič je mala pločica dolje desno.

1. **Otvori primjer uređaja.** Otvorite `TP-001 · Demo kuća Tuzla` (Toplotna pumpa zrak–voda). Pogledajte prethodni i sljedeći servis, interval (DEMO postavka), servisnu historiju i QR kod.
2. **Pogledaj QR i prikaz kupca.** Kliknite `Pogledaj prikaz kupca`. To je ono što kupac vidi kada skenira QR: bez prijave i bez interne navigacije firme.
3. **Simuliraj zahtjev za servis.** `Pogledaj primjer zakazivanja` → popunite obrazac (ili `Popuni primjerom`) → `Simuliraj slanje zahtjeva`. Potvrda glasi: *Prikazan je primjer zahtjeva DEMO-001. Nije poslan servisnoj firmi.*
4. **Kao vlasnik dodijeli servisera.** `Pogledaj kako ga vidi vlasnik` → `Potvrdi i dodijeli servisera`. Odaberite servisera, datum i vrijeme.
   - Za prikaz kolizije odaberite danas, Lejla Kovačević, 09:00. U primjeru je već zauzeta, pa se pojavi *Demo kolizija termina* s prijedlogom slobodnog termina ili drugog servisera.
   - Savjet: s današnjim datumom nalog se odmah vidi u prikazu servisera.
5. **Kao serviser završi primjer i pogledaj izvještaj.** `Otvori kao serviser` → `Pokreni demo nalog` → kontrolna lista (`Uredno / Potrebna pažnja / Nije primjenjivo`), bilješka, fotografija (samo lokalni pregled) i preporuka → `Završi demo nalog`. Ako nešto nedostaje, demo navede šta, a nalog se ipak može završiti. Zatim `Pogledaj primjer izvještaja` → `Štampaj primjer izvještaja` (u dijalogu za štampu može se odabrati „Sačuvaj kao PDF”).

Nakon toga vlasnički pregled pokazuje promijenjene brojke, aktivnost „Završen demo nalog …” i novi rok servisa uređaja. `Počni ponovo` ili `Vrati početni primjer` vraća početno stanje.

## Ostalo što se može klikati

- **Uređaji:** pretraga (naziv, tip, kupac, grad), filter vrste i statusa roka, `Dodaj demo uređaj`, `Uredi`, `Planiraj demo servis`.
- **QR:** `Preuzmi QR PNG`, `Preuzmi QR SVG`, `Kopiraj demo link`, `Štampaj naljepnicu`.
- **Raspored:** sedmica na širokom ekranu i dnevne kartice na užem; odabir datuma, sedmice i servisera, prikaz otkazanih, dodjela naloga bez servisera.
- **Zahtjevi:** statusi `Na čekanju / Potvrđen u demou / Odbijen u demou`; potvrda s dodjelom ili odbijanje u demou.
- **Radni nalozi:** filter po statusu (`Planiran / U radu / Završen / Otkazan`) i serviseru, detalj, promjena servisera, `Otkaži u demou`.
- **Serviser (telefon):** `Moji demo poslovi danas`, izbor servisera (demo perspektiva, bez prijave), narednih 7 dana, moji nalozi.
- **Kupac:** primjer zakazivanja i primjer prijave kvara (opis, opcionalni kod greške, fotografija JPG/PNG/WEBP do 5 MB, samo lokalni pregled).
- **Izvještaji:** tri unaprijed završena primjera i svaki nalog završen u probi.
- **Primjeri poruka:** potvrda zahtjeva, potvrda termina, završen servis i podsjetnik, svi s oznakom **PRIMJER — NIJE POSLANO**. `Pogledaj primjer podsjetnika` s kartice uređaja otvara podsjetnik za taj uređaj.

## QR na telefonu

QR kod sadrži apsolutnu adresu kartice na sajtu na kojem je demo otvoren (npr. `https://<novi-domen>/demo/kupac/TP-001`). Skeniranje otvara pokaznu karticu uređaja bez prijave.

> QR otvara pokaznu karticu uređaja. Za cijeli povezani primjer vratite se na demo vodič.

Zahtjev poslan s telefona **ne pojavljuje se** na računaru: svaki preglednik ima svoju lokalnu probu. Cijeli povezani tok radi u jednom tabu.

## Šta je simulacija

- slanje zahtjeva i prijave kvara;
- potvrda, odbijanje, dodjela servisera i kolizija termina;
- pokretanje i završetak naloga, kontrolna lista, potvrda kupca (ilustrativna rubrika);
- poruke i podsjetnici (ništa se ne šalje);
- rokovi i intervali (DEMO postavke, ne preporuka proizvođača).

## Šta se izrađuje za firmu nakon dogovora

- stvarni kupci, uređaji i servisna historija;
- korisnički računi i pristup za vlasnika i servisere;
- trajno čuvanje i rad s više uređaja;
- stvarne obavijesti kroz dogovorene kanale;
- servisni obrasci i intervali koje potvrdi firma;
- finalni izgled, kontakt i naziv firme.

To su predviđene mogućnosti, ne funkcije koje su već aktivne.

## Izmišljeni podaci u primjeru

- Firma: **Primjer Klima d.o.o. — demo firma**.
- 6 kupaca, 8 lokacija, 24 uređaja (16 klima, 8 toplotnih pumpi), 2 servisera.
- Zahtjevi: 2 na čekanju, 1 potvrđen i 1 odbijen. Nalozi: današnji, naredni, jedan bez servisera, jedan otkazan i 3 završena s izvještajima.
- Modeli i serijski brojevi označeni su kao demonstracijski. E-mail adrese su na `example.test`. Telefoni nisu stvarni i nisu klikabilni.
