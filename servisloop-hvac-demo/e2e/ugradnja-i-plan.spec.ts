import { expect, test } from '@playwright/test';

test('vlasnik planira ugradnju, serviser skenira naljepnicu iz paketa i dodaje nenajavljen uređaj; prvi servis ulazi u plan', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto('/demo/uredaji');
  await page.getByRole('button', { name: 'Nova ugradnja' }).click();
  const dlg = page.getByRole('dialog');
  await dlg.getByRole('button', { name: 'Planiraj ugradnju' }).click();
  await expect(dlg.getByText('Odaberite objekat.')).toBeVisible();
  await expect(dlg.getByText(/Unesite naziv uređaja/)).toBeVisible();
  await dlg.getByText('Novi kupac', { exact: true }).click();
  await dlg.getByLabel('Naziv kupca').fill('Porodica Novaković (demo)');
  await dlg.getByLabel('Naziv objekta').fill('Demo kuća Bihać');
  await dlg.getByLabel('Grad').fill('Bihać');
  await dlg.getByLabel('Naziv uređaja').fill('Klima — dnevni boravak');
  await expect(dlg.getByText(/Prvi servis automatski u planu/)).toBeVisible();
  await dlg.getByRole('button', { name: 'Planiraj ugradnju' }).click();

  await expect(page).toHaveURL(/\/demo\/nalozi\/NAL-0118$/);
  await expect(page.getByTestId('install-order-notice')).toContainText('KL-017');
  await page.getByRole('link', { name: 'Štampaj naljepnicu KL-017' }).click();
  await expect(page.getByTestId('label')).toContainText('KL-017');

  // Uređaj čeka ugradnju: nema ga u KPI zakasnelih, kartica kupca kaže da je najavljen.
  await page.goto('/demo/uredaji/KL-017');
  await expect(page.getByTestId('install-notice')).toBeVisible();
  await page.goto('/demo/kupac/KL-017');
  await expect(page.getByText(/najavljen za ugradnju/)).toBeVisible();

  await page.goto('/demo/serviser/nalog/NAL-0118');
  await expect(page.getByText('Ugradnja: naljepnica je u paketu')).toBeVisible();
  await page.getByRole('button', { name: /pokreni posjetu/ }).click();
  await page.getByRole('button', { name: 'Skeniraj QR za KL-017' }).click();
  await page.getByRole('dialog').getByTestId('sticker-KL-017').click();
  const entry = page.getByTestId('device-entry');
  await expect(entry).toContainText('Ugradnja novog uređaja');
  await entry.getByLabel('Serijski broj (s natpisne pločice)').fill('SN-DEMO-777');
  await expect(entry.getByText('QR naljepnica zalijepljena i skenirana')).toBeVisible();
  await entry.getByRole('button', { name: 'Sve uredno' }).click();
  await entry.getByRole('button', { name: /Sačuvaj KL-017/ }).click();

  // Nenajavljen uređaj: prazna naljepnica iz kompleta.
  await page.getByRole('button', { name: /Novi uređaj na objektu/ }).click();
  await page.getByRole('dialog').getByTestId('sticker-N-0001').click();
  const form = page.getByRole('dialog');
  await expect(form).toContainText('Naljepnica N-0001 je prazna');
  await form.getByRole('button', { name: 'Dodaj uređaj i nastavi' }).click();
  await expect(form.getByText(/Unesite kratak naziv/)).toBeVisible();
  await form.getByLabel('Naziv').fill('Klima — spavaća soba');
  await form.getByRole('button', { name: 'Dodaj uređaj i nastavi' }).click();
  await expect(entry).toContainText('KL-018');
  await entry.getByRole('button', { name: 'Sve uredno' }).click();
  await entry.getByRole('button', { name: /Sačuvaj KL-018/ }).click();

  await page.getByRole('button', { name: /Nastaviti redovni servis/ }).click();
  await page.getByRole('button', { name: 'Završi demo nalog' }).click();
  await expect(page.getByTestId('first-service-KL-017')).toContainText('prvi servis automatski u planu');
  await expect(page.getByTestId('first-service-KL-018')).toBeVisible();

  await page.getByRole('link', { name: 'Pogledaj primjer izvještaja' }).click();
  await expect(page.getByTestId('report')).toContainText('Zapisnik o ugradnji');
  await expect(page.getByTestId('report')).toContainText('SN-DEMO-777');

  // Naljepnica N-0001 sada vodi kupca na KL-018.
  await page.goto('/demo/kupac/N-0001');
  await expect(page.getByTestId('customer-screen')).toContainText('KL-018');
  await page.goto('/demo/kupac/N-0002');
  await expect(page.getByTestId('unlinked-label')).toContainText('još nije povezana');
  await page.goto('/demo/naljepnice');
  await expect(page.getByTestId('blank-labels')).toContainText('Povezana: KL-018');
  expect(errors).toEqual([]);
});

test('pogrešna naljepnica (tuđi kod) se odbija', async ({ page }) => {
  await page.goto('/demo/serviser/nalog/NAL-0111');
  await page.getByRole('button', { name: /pokreni posjetu/ }).click();
  await page.getByRole('button', { name: 'Skeniraj QR uređaja' }).click();
  await page.getByRole('dialog').getByLabel('Oznaka uređaja').fill('N-9999');
  await page.getByRole('dialog').getByRole('button', { name: 'Potvrdi oznaku' }).click();
  await expect(page.getByTestId('scan-problem')).toContainText('nije iz kompleta ove firme');
});

test('prijedlog termina: vlasnik šalje, kupac bira termin → nalog; drugi kupac odgađa uz objašnjenje', async ({ page }) => {
  await page.goto('/demo/plan');
  const row = page.getByTestId('plan-KL-003');
  await expect(row).toContainText('Prijedlog nije poslan');
  await row.getByRole('button', { name: 'Pošalji prijedlog termina' }).click();
  const dlg = page.getByRole('dialog');
  await expect(dlg.getByTestId('message-preview')).toContainText('PRIMJER — NIJE POSLANO');
  await expect(dlg.getByTestId('message-preview')).toContainText('Preporučujemo da se servis obavi što prije');
  await dlg.getByRole('button', { name: 'Simuliraj slanje prijedloga' }).click();
  await expect(dlg.getByTestId('proposal-sent')).toContainText('Primjer poruke — nije poslano.');
  await dlg.getByRole('link', { name: /Otvori link iz poruke/ }).click();

  await expect(page).toHaveURL(/\/demo\/kupac\/KL-003\?prijedlog=PRJ-003$/);
  const screen = page.getByTestId('customer-screen');
  await expect(screen.getByTestId('proposal-choose')).toBeVisible();
  await screen.getByRole('button', { name: 'Simuliraj potvrdu termina' }).click();
  await expect(screen.getByText('Odaberite jedan od termina.')).toBeVisible();
  await screen.getByRole('radio').first().check();
  await screen.getByRole('button', { name: 'Simuliraj potvrdu termina' }).click();
  await expect(screen.getByTestId('proposal-accepted')).toContainText('Nije poslano servisnoj firmi');
  await screen.getByRole('link', { name: 'Pogledaj kako to vidi vlasnik' }).click();
  await expect(page).toHaveURL(/\/demo\/nalozi\/NAL-0118$/);
  await expect(page.getByText(/odabrao termin iz prijedloga PRJ-003/)).toBeVisible();

  // Kupac TP-002 (prijedlog PRJ-001 iz primjera) odgađa.
  await page.goto('/demo/kupac/TP-002');
  await expect(page.getByTestId('pending-proposal')).toBeVisible();
  await page.getByTestId('pending-proposal').getByRole('button', { name: 'Odaberi termin' }).click();
  await page.getByRole('button', { name: 'Ne želim servis sada' }).click();
  const decline = page.getByTestId('proposal-decline-form');
  await expect(decline).toContainText('Kod nekih proizvođača uslovi garancije vezani su za redovno održavanje');
  await decline.getByRole('button', { name: /Simuliraj odgovor/ }).click();
  await expect(decline.getByText('Odaberite razlog.')).toBeVisible();
  await decline.getByText('Podsjetite me za mjesec dana').click();
  await decline.getByRole('button', { name: /Simuliraj odgovor/ }).click();
  await expect(decline.getByText(/Potvrdite da ste pročitali/)).toBeVisible();
  await decline.getByText(/Pročitao\/la sam/).click();
  await decline.getByRole('button', { name: /Simuliraj odgovor/ }).click();
  await expect(page.getByTestId('proposal-declined')).toContainText('Podsjetićemo vas kasnije');

  await page.goto('/demo/plan');
  await expect(page.getByTestId('proposal-PRJ-001')).toContainText('Kupac traži kasniji podsjetnik');
  await expect(page.getByTestId('proposal-PRJ-003')).toContainText('Kupac je odabrao termin');
});
