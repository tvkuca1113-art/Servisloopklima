// Pregledni prolaz za ugradnju, prazne naljepnice i prijedlog termina.
// Upotreba: BASE_URL=http://localhost:3100 OUT_DIR=... node scripts/review-ugradnja.mjs
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const OUT = process.env.OUT_DIR ?? 'review-ugradnja';
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const errors = [];

async function shoot(page, name, full = false) {
  await page.waitForTimeout(350);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 0) errors.push(`${name}: overflow ${overflow}`);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
}

for (const [label, ctxOpts] of [
  ['d', { viewport: { width: 1440, height: 900 } }],
  ['m', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
]) {
  const ctx = await browser.newContext({ locale: 'bs-BA', timezoneId: 'Europe/Sarajevo', ...ctxOpts });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(`${label} console: ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`${label} pageerror: ${e}`));

  // 1. Vlasnik planira ugradnju za novog kupca
  await page.goto(`${BASE}/demo/uredaji`);
  await page.getByRole('button', { name: 'Nova ugradnja' }).click();
  const dlg = page.getByRole('dialog');
  await dlg.getByText('Novi kupac', { exact: true }).click();
  await dlg.getByLabel('Naziv kupca').fill('Porodica Novaković (demo)');
  await dlg.getByLabel('Naziv objekta').fill('Demo kuća Bihać');
  await dlg.getByLabel('Grad').fill('Bihać');
  await dlg.getByLabel('Naziv uređaja').fill('Klima — dnevni boravak');
  await shoot(page, `${label}-01-nova-ugradnja`);
  await dlg.getByRole('button', { name: 'Planiraj ugradnju' }).click();
  await page.waitForURL(/nalozi\/NAL-/);
  await shoot(page, `${label}-02-nalog-ugradnja`, true);
  const orderId = page.url().split('/').pop();
  await page.getByRole('link', { name: /Štampaj naljepnicu/ }).first().click();
  await shoot(page, `${label}-03-naljepnica-paket`);

  // 2. Serviser na ugradnji: skenira naljepnicu iz paketa + dodaje nenajavljen uređaj
  await page.goto(`${BASE}/demo/serviser/nalog/${orderId}`);
  await shoot(page, `${label}-04-serviser-ugradnja`, true);
  await page.getByRole('button', { name: /pokreni posjetu/ }).click();
  await page.getByRole('button', { name: 'Skeniraj QR uređaja' }).click();
  await page.locator('[data-testid^=sticker-KL-]').first().click();
  await page.getByLabel('Serijski broj (s natpisne pločice)').fill('SN-DEMO-12345');
  await page.getByRole('button', { name: 'Sve uredno' }).click();
  await shoot(page, `${label}-05-unos-ugradnje`, true);
  await page.getByRole('button', { name: /Sačuvaj KL-/ }).click();
  await page.getByRole('button', { name: /Novi uređaj na objektu/ }).click();
  await shoot(page, `${label}-06-prazna-naljepnica`);
  await page.getByTestId('sticker-N-0001').click();
  await page.getByRole('dialog').getByLabel('Naziv').fill('Klima — spavaća soba');
  await shoot(page, `${label}-07-novi-uredjaj-forma`);
  await page.getByRole('dialog').getByRole('button', { name: 'Dodaj uređaj i nastavi' }).click();
  await page.getByRole('button', { name: 'Sve uredno' }).click();
  await page.getByRole('button', { name: /Sačuvaj KL-/ }).click();
  await page.getByRole('button', { name: /Nastaviti redovni servis/ }).click();
  await page.getByRole('button', { name: 'Završi demo nalog' }).click();
  await shoot(page, `${label}-08-ugradnja-zavrsena`);
  await page.getByRole('link', { name: 'Pogledaj primjer izvještaja' }).click();
  await shoot(page, `${label}-09-zapisnik-ugradnje`, true);

  // 3. Plan servisa i prijedlog termina
  await page.goto(`${BASE}/demo/plan`);
  await shoot(page, `${label}-10-plan`, true);
  await page.locator('[data-testid^=plan-]').first().getByRole('button', { name: /Pošalji prijedlog termina|Pošalji novi prijedlog/ }).click();
  await shoot(page, `${label}-11-prijedlog-modal`);
  await page.getByRole('dialog').getByRole('button', { name: 'Simuliraj slanje prijedloga' }).click();
  await shoot(page, `${label}-12-prijedlog-poslan`);
  await page.getByRole('link', { name: /Otvori link iz poruke/ }).click();
  await shoot(page, `${label}-13-kupac-prijedlog`);
  await page.getByRole('button', { name: 'Ne želim servis sada' }).click();
  await shoot(page, `${label}-14-kupac-odbijanje`, label === 'm');
  await page.getByText('Podsjetite me za mjesec dana').click();
  await page.getByText(/Pročitao\/la sam/).click();
  await page.getByRole('button', { name: /Simuliraj odgovor/ }).click();
  await shoot(page, `${label}-15-kupac-odgodio`);
  await page.goto(`${BASE}/demo/kupac/TP-002?prijedlog=PRJ-001`);
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Simuliraj potvrdu termina' }).click();
  await shoot(page, `${label}-16-kupac-prihvatio`);
  await page.goto(`${BASE}/demo/plan`);
  await shoot(page, `${label}-17-plan-odgovori`, true);
  await page.goto(`${BASE}/demo/kupac/N-0001`);
  await shoot(page, `${label}-18-naljepnica-povezana`);
  await page.goto(`${BASE}/demo/kupac/N-0007`);
  await shoot(page, `${label}-19-naljepnica-prazna`);
  await page.goto(`${BASE}/demo/naljepnice`);
  await shoot(page, `${label}-20-prazne-naljepnice`, true);
  await ctx.close();
}
await browser.close();
console.log(errors.length ? errors.join('\n') : 'bez grešaka i overflowa');
