import { expect, test } from '@playwright/test';

/**
 * Glavni demo scenario u istom tabu:
 * početna → vlasnik → uređaj → prikaz kupca (QR stranica) → demo zahtjev → dodjela s
 * ostalim uređajima na objektu (uz koliziju) → serviser skenira svaki uređaj (pogrešan se
 * odbija, ručni unos se bilježi) → završetak → izvještaj → reset.
 */
test('cijeli lokalni tok od QR kartice do izvještaja', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto('/');
  await expect(page.getByTestId('landing-disclaimer')).toContainText('Ovo je pokazni primjer izgleda i načina rada.');
  await expect(page.getByTestId('demo-bar')).toContainText('DEMO PROTOTIP');
  await page.getByRole('link', { name: 'Pogledaj demo' }).first().click();

  await expect(page.getByRole('heading', { name: 'Pregled servisa', level: 1 })).toBeVisible();
  await expect(page.getByTestId('guide-inline')).toContainText('korak 1 od 5');
  const openOrders = page.getByRole('link', { name: /Otvoreni demo nalozi/ });
  await expect(openOrders).toContainText('7');

  await page.getByRole('link', { name: 'Otvori uređaj TP-001' }).click();
  await expect(page.getByRole('heading', { name: 'TP-001 · Demo kuća Tuzla' })).toBeVisible();
  await expect(page.getByTestId('qr-url')).toHaveText(/\/demo\/kupac\/TP-001$/);

  // Prikaz kupca: objašnjenje u koracima + stranica u okviru telefona + povratak.
  await page.getByRole('link', { name: 'Pogledaj prikaz kupca' }).click();
  await expect(page.getByTestId('customer-explainer')).toContainText('Ovo kupac vidi kada skenira QR kod na uređaju');
  await expect(page.getByTestId('customer-demo-header').getByRole('link', { name: 'Nazad na demo' })).toBeVisible();
  const screen = page.getByTestId('customer-screen');
  await expect(screen.getByRole('heading', { name: 'Toplotna pumpa — grijanje kuće' })).toBeVisible();
  await screen.getByRole('button', { name: /Zakaži servis/ }).click();

  // Prazna forma: validacija uz polja, unos ostaje.
  await screen.getByRole('button', { name: 'Simuliraj slanje zahtjeva' }).click();
  await expect(screen.getByText('Odaberite željeni datum.')).toBeVisible();
  await expect(screen.getByText('Odaberite željeni termin.')).toBeVisible();
  await screen.getByRole('button', { name: 'Promijeni' }).click();
  await screen.getByLabel('Telefon ili e-mail').fill('abc');
  await screen.getByRole('button', { name: 'Simuliraj slanje zahtjeva' }).click();
  await expect(screen.getByText(/Unesite ispravan e-mail ili broj telefona/)).toBeVisible();
  await expect(screen.getByLabel('Telefon ili e-mail')).toHaveValue('abc');
  await screen.getByLabel('Ime i prezime').fill('Testna Osoba Čćšžđ');
  await screen.getByLabel('Telefon ili e-mail').fill('test@example.test');
  await screen.getByRole('button', { name: 'Popuni primjerom' }).click();
  await screen.getByRole('button', { name: 'Simuliraj slanje zahtjeva' }).click();
  await expect(page.getByTestId('request-confirmation')).toContainText('Prikazan je primjer zahtjeva DEMO-001. Nije poslan servisnoj firmi.');
  await expect(page.getByTestId('request-status')).toContainText('Firma pregleda prijavu');

  await screen.getByRole('link', { name: 'Pogledaj kako ga vidi vlasnik' }).click();
  const card = page.locator('#zahtjev-DEMO-001');
  await expect(card).toContainText('Testna Osoba Čćšžđ');
  await card.getByRole('button', { name: 'Potvrdi i dodijeli servisera' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Uređaji u istoj posjeti')).toBeVisible();
  await expect(dialog.getByRole('checkbox', { name: /KL-012/ })).toBeChecked();
  await expect(dialog.getByRole('checkbox', { name: /KL-015/ })).toBeChecked();
  // Lejla je u primjeru zauzeta danas od 09:00 → demo kolizija.
  await dialog.getByRole('radio', { name: /Lejla Kovačević/ }).check();
  await dialog.getByLabel('Početak').selectOption('09:00');
  await expect(dialog.getByText('Demo kolizija termina')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Dodijeli servisera' })).toBeDisabled();
  await dialog.getByRole('radio', { name: /Amar Begić/ }).check();
  await dialog.getByLabel('Početak').selectOption('08:00');
  await expect(dialog.getByText('Demo kolizija termina')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Dodijeli servisera' }).click();

  await expect(page).toHaveURL(/\/demo\/nalozi\/NAL-0118$/);
  await expect(page.getByText('Promjena je prikazana u ovoj probnoj verziji.')).toBeVisible();
  await expect(page.getByText('Uređaji u posjeti (3)')).toBeVisible();

  await page.getByRole('link', { name: 'Otvori kao serviser' }).first().click();
  await expect(page).toHaveURL(/\/demo\/serviser\/nalog\/NAL-0118$/);
  await page.getByRole('button', { name: /pokreni posjetu/ }).click();

  // Završetak bez obrađenih uređaja → spisak onoga što nedostaje.
  await page.getByRole('button', { name: 'Završi posjetu' }).click();
  await expect(page.getByText('Uređaj TP-001 nije obrađen', { exact: false })).toBeVisible();

  // Pogrešna naljepnica (drugi objekat) se odbija — ništa se ne upisuje.
  await page.getByRole('button', { name: 'Skeniraj QR uređaja' }).click();
  const scan = page.getByRole('dialog');
  await scan.locator('[data-testid^=sticker-]').last().click();
  await expect(scan.getByTestId('scan-problem')).toContainText('Pogrešan uređaj');
  await expect(scan.getByTestId('scan-problem')).toContainText('Ništa nije upisano');

  // Ispravna naljepnica TP-001 → otvara unos samo za taj uređaj.
  await scan.getByTestId('sticker-TP-001').click();
  const entry = page.getByTestId('device-entry');
  await expect(entry).toContainText('QR skeniran');
  await entry.getByRole('button', { name: /Sačuvaj TP-001/ }).click();
  await expect(page.getByText('Za TP-001 nedostaje:')).toBeVisible();
  await entry.getByRole('button', { name: 'Sve uredno' }).click();
  await entry.getByRole('button', { name: /Sačuvaj TP-001/ }).click();
  await expect(page.getByTestId('item-TP-001')).toContainText('Obrađen');

  // KL-012: oštećena naljepnica → ručni unos oznake; jedna stavka „Potrebna pažnja”.
  await page.getByRole('button', { name: 'Skeniraj QR za KL-012' }).click();
  await page.getByRole('dialog').getByLabel('Oznaka uređaja').fill('kl012');
  await page.getByRole('dialog').getByRole('button', { name: 'Potvrdi oznaku' }).click();
  await expect(entry).toContainText('Ručni unos oznake');
  await entry.getByText('Potrebna pažnja', { exact: true }).nth(2).click();
  await entry.getByRole('button', { name: 'Sve uredno' }).click();
  await entry.getByRole('button', { name: /Sačuvaj KL-012/ }).click();
  await expect(page.getByText(/Kratak opis uz „Potrebna pažnja”/)).toBeVisible();
  await entry.getByPlaceholder('Kratko: šta treba pažnju (obavezno)').fill('Filter zaprljan — očišćen (čćšžđ).');
  await entry.getByRole('button', { name: /Sačuvaj KL-012/ }).click();

  await page.getByRole('button', { name: 'Skeniraj QR za KL-015' }).click();
  await page.getByRole('dialog').getByTestId('sticker-KL-015').click();
  await entry.getByRole('button', { name: 'Sve uredno' }).click();
  await entry.getByRole('button', { name: /Sačuvaj KL-015/ }).click();

  await page.getByRole('button', { name: /Nastaviti redovni servis/ }).click();
  await page.getByRole('button', { name: 'Završi demo nalog' }).click();
  await expect(page.getByTestId('order-completed')).toContainText('Demo nalog je završen u ovom primjeru.');
  await expect(page.getByTestId('order-completed')).toContainText('Obrađeno uređaja: 3 od 3');

  await page.getByRole('link', { name: 'Pogledaj primjer izvještaja' }).click();
  const report = page.getByTestId('report');
  await expect(report).toContainText('DEMO — primjer servisnog izvještaja');
  await expect(report).toContainText('NAL-0118');
  await expect(report).toContainText('KL-015 · Klima — dnevni boravak');
  await expect(report).toContainText('Identifikacija: Ručni unos oznake');
  await expect(report).toContainText('Filter zaprljan — očišćen (čćšžđ).');
  await expect(page.getByRole('button', { name: 'Štampaj primjer izvještaja' })).toBeVisible();

  // Print prikaz: alatna traka i DEMO linija se ne štampaju, izvještaj da.
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByRole('button', { name: 'Štampaj primjer izvještaja' })).toBeHidden();
  await expect(report).toBeVisible();
  await page.emulateMedia({ media: 'screen' });

  // Kupac u istom tabu vidi status svoje prijave.
  await page.goto('/demo/kupac/TP-001');
  await expect(page.getByTestId('request-status')).toContainText('Servis obavljen');

  await page.goto('/demo');
  await expect(page.getByTestId('guide-inline')).toContainText('završen');
  await expect(openOrders).toContainText('7');
  await expect(page.getByText('Završen demo nalog NAL-0118')).toBeVisible();

  // Reset vraća početni primjer.
  await page.getByRole('button', { name: 'Vrati početni primjer' }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Vrati početni primjer' }).click();
  await expect(page.getByTestId('guide-inline')).toContainText('korak 1 od 5');
  await page.goto('/demo/zahtjevi?status=svi');
  await expect(page.locator('#zahtjev-DEMO-001')).toHaveCount(0);

  expect(errors).toEqual([]);
});

test('uređaj s istog objekta koji nije na nalogu može se dodati na licu mjesta', async ({ page }) => {
  await page.goto('/demo/serviser/nalog/NAL-0111');
  await page.getByRole('button', { name: /pokreni posjetu/ }).click();
  await page.getByRole('button', { name: 'Skeniraj QR uređaja' }).click();
  const scan = page.getByRole('dialog');
  await scan.getByTestId('sticker-KL-003').click();
  await expect(scan.getByTestId('scan-problem')).toContainText('nije na nalogu NAL-0111');
  await scan.getByRole('button', { name: 'Dodaj na nalog i nastavi' }).click();
  await expect(page.getByTestId('device-entry')).toContainText('KL-003');
  await page.getByRole('button', { name: /Lista uređaja/ }).click();
  await expect(page.getByTestId('item-KL-003')).toBeVisible();
  await expect(page.getByText('Obrađeno: 0 od 3 uređaja')).toBeVisible();
});

test('reload u istom tabu zadržava probu, novi tab počinje od primjera', async ({ page, browser }) => {
  await page.goto('/demo/kupac/KL-002?forma=kvar');
  const screen = page.getByTestId('customer-screen');
  await screen.getByRole('button', { name: 'Simuliraj prijavu kvara' }).click();
  await expect(screen.getByText('Odaberite šta se dešava s uređajem.')).toBeVisible();
  await screen.getByText('Curi voda', { exact: true }).click();
  await screen.getByText('Ne radi uopšte', { exact: true }).click();
  await screen.getByRole('button', { name: 'Simuliraj prijavu kvara' }).click();
  await expect(page.getByTestId('request-confirmation')).toContainText('Ovo je primjer prijave kvara. Stvarna intervencija nije naručena.');
  await page.goto('/demo/zahtjevi');
  const card = page.locator('#zahtjev-DEMO-001');
  await expect(card).toContainText('Curi voda');
  await expect(card).toContainText('Uređaj ne radi');
  await page.reload();
  await expect(page.locator('#zahtjev-DEMO-001')).toBeVisible();

  const fresh = await browser.newContext();
  const other = await fresh.newPage();
  await other.goto(new URL('/demo/zahtjevi', page.url()).toString());
  await expect(other.getByRole('heading', { name: 'Zahtjevi' })).toBeVisible();
  await expect(other.locator('#zahtjev-DEMO-001')).toHaveCount(0);
  await fresh.close();
});
