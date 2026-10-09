import { expect, test } from '@playwright/test';

/**
 * Glavni demo scenario u istom tabu:
 * početna → vlasnik → uređaj → prikaz kupca → demo zahtjev → dodjela (uz koliziju)
 * → serviser → završetak → primjer izvještaja → reset.
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

  await page.getByRole('link', { name: 'Pogledaj prikaz kupca' }).click();
  await expect(page.getByRole('heading', { name: 'TP-001 · Demo kuća Tuzla' })).toBeVisible();
  await page.getByRole('button', { name: 'Pogledaj primjer zakazivanja' }).click();

  // Prazna forma: validacija, unos ostaje.
  await page.getByLabel('Telefon ili e-mail').fill('abc');
  await page.getByRole('button', { name: 'Simuliraj slanje zahtjeva' }).click();
  await expect(page.getByText('Unesite ime i prezime.')).toBeVisible();
  await expect(page.getByText(/Unesite ispravan e-mail ili broj telefona/)).toBeVisible();
  await expect(page.getByText('Odaberite željeni datum.')).toBeVisible();
  await expect(page.getByLabel('Telefon ili e-mail')).toHaveValue('abc');

  await page.getByLabel('Ime i prezime').fill('Testna Osoba Čćšžđ');
  await page.getByLabel('Telefon ili e-mail').fill('test@example.test');
  await page.getByRole('button', { name: 'Popuni primjerom' }).click();
  await page.getByLabel('Ime i prezime').fill('Testna Osoba Čćšžđ');
  await page.getByRole('button', { name: 'Simuliraj slanje zahtjeva' }).click();
  await expect(page.getByTestId('request-confirmation')).toContainText('Prikazan je primjer zahtjeva DEMO-001. Nije poslan servisnoj firmi.');

  await page.getByRole('link', { name: 'Pogledaj kako ga vidi vlasnik' }).click();
  const card = page.locator('#zahtjev-DEMO-001');
  await expect(card).toContainText('Testna Osoba Čćšžđ');
  await card.getByRole('button', { name: 'Potvrdi i dodijeli servisera' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  // Lejla je u primjeru zauzeta danas 09:00–10:30 → demo kolizija.
  await dialog.getByRole('radio', { name: /Lejla Kovačević/ }).check();
  await dialog.getByLabel('Početak').selectOption('09:00');
  await expect(dialog.getByText('Demo kolizija termina')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Dodijeli servisera' })).toBeDisabled();
  await dialog.getByRole('radio', { name: /Amar Begić/ }).check();
  await expect(dialog.getByText('Demo kolizija termina')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Dodijeli servisera' }).click();

  await expect(page).toHaveURL(/\/demo\/nalozi\/NAL-0118$/);
  await expect(page.getByText('Promjena je prikazana u ovoj probnoj verziji.')).toBeVisible();
  await expect(page.getByText('Amar Begić').first()).toBeVisible();

  await page.getByRole('link', { name: 'Otvori kao serviser' }).first().click();
  await expect(page).toHaveURL(/\/demo\/serviser\/nalog\/NAL-0118$/);
  await page.getByRole('button', { name: 'Pokreni demo nalog' }).click();

  // Prazna kontrolna lista → prikazuje šta nedostaje.
  await page.getByRole('button', { name: 'Završi demo nalog' }).click();
  await expect(page.getByText('U demo obrascu nedostaje:')).toBeVisible();
  await expect(page.getByText('Odgovor za „Identifikacija uređaja”')).toBeVisible();

  const uredno = page.getByText('Uredno', { exact: true });
  const n = await uredno.count();
  for (let i = 0; i < n; i++) await uredno.nth(i).click();
  await page.getByLabel('Bilješka servisera').fill('Duža bilješka servisera sa slovima č ć š ž đ. '.repeat(4));
  await page.getByLabel(/Preporuka kupcu/).fill('Nastaviti redovni servis prema intervalu koji potvrdi firma.');
  await page.getByRole('button', { name: 'Završi demo nalog' }).click();
  await expect(page.getByTestId('order-completed')).toContainText('Demo nalog je završen u ovom primjeru.');

  await page.getByRole('link', { name: 'Pogledaj primjer izvještaja' }).click();
  const report = page.getByTestId('report');
  await expect(report).toContainText('DEMO — primjer servisnog izvještaja');
  await expect(report).toContainText('NAL-0118');
  await expect(report).toContainText('č ć š ž đ');
  await expect(page.getByRole('button', { name: 'Štampaj primjer izvještaja' })).toBeVisible();

  // Print prikaz: alatna traka i DEMO linija se ne štampaju, izvještaj da.
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByRole('button', { name: 'Štampaj primjer izvještaja' })).toBeHidden();
  await expect(report).toBeVisible();
  await page.emulateMedia({ media: 'screen' });

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

test('reload u istom tabu zadržava probu, novi tab počinje od primjera', async ({ page, context, browser }) => {
  await page.goto('/demo/kupac/KL-002?forma=kvar');
  await page.getByRole('button', { name: 'Popuni primjerom' }).click();
  await page.getByRole('button', { name: 'Simuliraj prijavu kvara' }).click();
  await expect(page.getByTestId('request-confirmation')).toContainText('Ovo je primjer prijave kvara. Stvarna intervencija nije naručena.');
  await page.goto('/demo/zahtjevi');
  await expect(page.locator('#zahtjev-DEMO-001')).toBeVisible();
  await page.reload();
  await expect(page.locator('#zahtjev-DEMO-001')).toBeVisible();

  const fresh = await browser.newContext();
  const other = await fresh.newPage();
  await other.goto(new URL('/demo/zahtjevi', page.url()).toString());
  await expect(other.getByRole('heading', { name: 'Zahtjevi' })).toBeVisible();
  await expect(other.locator('#zahtjev-DEMO-001')).toHaveCount(0);
  await fresh.close();
  void context;
});
