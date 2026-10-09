import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';
import { PNG } from 'pngjs';

import { decodePng, decodePngFile } from './helpers';

test('QR PNG i SVG se preuzimaju i dekodiraju na URL novog sajta', async ({ page, browser, baseURL }) => {
  await page.goto('/demo/uredaji/TP-001');
  const expected = `${baseURL}/demo/kupac/TP-001`;
  await expect(page.getByTestId('qr-url')).toHaveText(expected);
  expect(expected).not.toContain('servisloop2');

  const [pngDl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Preuzmi QR PNG' }).click()]);
  expect(pngDl.suggestedFilename()).toBe('qr-TP-001-demo.png');
  const pngPath = await pngDl.path();
  const png = PNG.sync.read(readFileSync(pngPath));
  expect(png.width).toBeGreaterThanOrEqual(256);
  expect(decodePngFile(pngPath)).toBe(expected);

  const [svgDl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Preuzmi QR SVG' }).click()]);
  expect(svgDl.suggestedFilename()).toBe('qr-TP-001-demo.svg');
  const svg = readFileSync(await svgDl.path(), 'utf8');
  expect(svg).toContain('<svg');
  // Render SVG-a u pregledniku i dekodiranje snimka.
  const render = await browser.newPage({ viewport: { width: 600, height: 600 } });
  await render.setContent(`<body style="margin:0;background:#fff">${svg.replace('<svg', '<svg width="580" height="580"')}</body>`);
  const shot = await render.screenshot();
  expect(decodePng(shot)).toBe(expected);
  await render.close();

  // Odredište QR-a u novom browser kontekstu (telefon, bez prijave).
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await phone.newPage();
  await p.goto(expected);
  await expect(p.getByText('Vaš uređaj')).toBeVisible();
  await expect(p.getByRole('heading', { name: 'TP-001 · Demo kuća Tuzla' })).toBeVisible();
  await expect(p.getByText('QR otvara pokaznu karticu uređaja. Za cijeli povezani primjer vratite se na demo vodič.')).toBeVisible();
  await expect(p.getByRole('button', { name: 'Pogledaj primjer zakazivanja' })).toBeVisible();
  await phone.close();
});

test('pretraga i filteri uređaja odgovaraju demo podacima', async ({ page }) => {
  await page.goto('/demo/uredaji');
  await expect(page.getByTestId('device-count')).toContainText('Prikazano: 24 od 24');
  await page.getByLabel('Vrsta uređaja').selectOption('pumpa');
  await expect(page.getByTestId('device-count')).toContainText('Prikazano: 8 od 24');
  await page.getByLabel('Vrsta uređaja').selectOption('klima');
  await expect(page.getByTestId('device-count')).toContainText('Prikazano: 16 od 24');
  await page.goto('/demo/uredaji?status=zakasnio');
  await expect(page.getByTestId('device-count')).toContainText('Prikazano: 4 od 24');
  await page.goto('/demo/uredaji');
  // Demo kancelarija Mostar ima tri uređaja (TP-007, KL-009, KL-010).
  await page.getByLabel('Pretraga uređaja').fill('Mostar');
  await expect(page.getByTestId('device-count')).toContainText('Prikazano: 3 od 24');
  await page.getByLabel('Pretraga uređaja').fill('nepostojeći uređaj xyz');
  await expect(page.getByText('Nema uređaja za ovaj filter')).toBeVisible();
});

test('dodavanje i uređivanje demo uređaja s validacijom', async ({ page }) => {
  await page.goto('/demo/uredaji');
  await page.getByRole('button', { name: 'Dodaj demo uređaj' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Dodaj u primjer' }).click();
  await expect(dialog.getByText('Unesite naziv uređaja (najmanje 3 znaka).')).toBeVisible();
  await expect(dialog.getByText('Odaberite lokaciju iz primjera.')).toBeVisible();
  await dialog.getByRole('radio', { name: 'Toplotna pumpa' }).check();
  await dialog.getByLabel('Naziv uređaja').fill('Toplotna pumpa — nova kuća');
  await dialog.getByLabel('Lokacija i kupac').selectOption({ index: 1 });
  await dialog.getByRole('button', { name: 'Dodaj u primjer' }).click();
  await expect(page).toHaveURL(/\/demo\/uredaji\/TP-009$/);
  await expect(page.getByRole('heading', { name: /TP-009/ })).toBeVisible();
  await page.getByRole('button', { name: 'Uredi' }).click();
  await page.getByRole('dialog').getByLabel('Naziv uređaja').fill('Toplotna pumpa — izmijenjen naziv');
  await page.getByRole('dialog').getByRole('button', { name: 'Sačuvaj u primjeru' }).click();
  await expect(page.getByText('Toplotna pumpa — izmijenjen naziv').first()).toBeVisible();
  await page.goto('/demo/uredaji');
  await expect(page.getByTestId('device-count')).toContainText('od 25');
});

test('fotografija kvara: lokalni pregled, ograničenje formata i uklanjanje', async ({ page }) => {
  let uploads = 0;
  page.on('request', (r) => {
    if (r.method() !== 'GET') uploads++;
  });
  await page.goto('/demo/kupac/TP-001?forma=kvar');
  const input = page.locator('input[type=file]');
  await input.setInputFiles({ name: 'dokument.txt', mimeType: 'text/plain', buffer: Buffer.from('x') });
  await expect(page.getByText('Dozvoljeni formati su JPG, PNG ili WEBP.')).toBeVisible();
  const png = new PNG({ width: 40, height: 40 });
  png.data.fill(200);
  await input.setInputFiles({ name: 'kvar-slika.png', mimeType: 'image/png', buffer: PNG.sync.write(png) });
  await expect(page.getByTestId('photo-preview')).toBeVisible();
  await page.getByRole('button', { name: 'Ukloni fotografiju' }).click();
  await expect(page.getByTestId('photo-preview')).toHaveCount(0);
  expect(uploads).toBe(0);
});

test('primjeri poruka su označeni kao neposlani', async ({ page }) => {
  await page.goto('/demo/uredaji/TP-001');
  await page.getByRole('link', { name: 'Pogledaj primjer podsjetnika' }).click();
  await expect(page).toHaveURL(/primjer=podsjetnik/);
  await expect(page.getByText('PRIMJER — NIJE POSLANO')).toHaveCount(4);
  await expect(page.getByText('Primjer poruke — nije poslano.')).toBeVisible();
  const body = (await page.locator('body').innerText()).toLowerCase();
  for (const forbidden of ['dostavljeno', 'trajno sačuvan', 'sve funkcije su aktivne', 'stvarno zakazan']) {
    expect(body).not.toContain(forbidden);
  }
});
