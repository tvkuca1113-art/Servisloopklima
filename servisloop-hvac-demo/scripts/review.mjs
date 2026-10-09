// Pregledni prolaz: snima ključne ekrane novog toka (kupac, posjeta s više uređaja, skeniranje).
// Upotreba: BASE_URL=http://localhost:3100 OUT_DIR=... node scripts/review.mjs
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const OUT = process.env.OUT_DIR ?? 'review';
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const errors = [];
const opts = { locale: 'bs-BA', timezoneId: 'Europe/Sarajevo' };

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
  const ctx = await browser.newContext({ ...opts, ...ctxOpts });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(`${label} console: ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`${label} pageerror: ${e}`));
  await page.goto(`${BASE}/demo/uredaji/TP-001`);
  await page.goto(`${BASE}/demo/kupac/TP-001`);
  await shoot(page, `${label}-01-kupac-kartica`, label === 'm');
  if (label === 'm') {
    await page.getByText('Demo: ovo je stranica koju kupac').click();
    await shoot(page, `${label}-01b-kupac-objasnjenje`);
  }
  await page.getByRole('button', { name: /Prijavi kvar/ }).click();
  await shoot(page, `${label}-02-kupac-kvar`);
  await page.getByRole('button', { name: 'Simuliraj prijavu kvara' }).click();
  await shoot(page, `${label}-03-kupac-kvar-greska`);
  await page.getByText('Ne grije', { exact: true }).click();
  await page.getByText('Ne radi uopšte', { exact: true }).click();
  await page.getByRole('button', { name: 'Simuliraj prijavu kvara' }).click();
  await shoot(page, `${label}-04-kupac-poslano`);
  await page.getByRole('link', { name: 'Pogledaj kako ga vidi vlasnik' }).first().click();
  await shoot(page, `${label}-05-vlasnik-zahtjev`);
  await page.locator('#zahtjev-DEMO-001').getByRole('button', { name: 'Potvrdi i dodijeli servisera' }).click();
  await shoot(page, `${label}-06-dodjela`);
  const dlg = page.getByRole('dialog');
  if (await dlg.getByRole('button', { name: 'Postavi danas' }).count()) await dlg.getByRole('button', { name: 'Postavi danas' }).click();
  await dlg.getByLabel('Početak').selectOption('09:00');
  await dlg.getByRole('radio', { name: /Amar/ }).check();
  const suggest = dlg.getByRole('button', { name: /Predloži slobodan termin/ });
  if (await suggest.count()) {
    await shoot(page, `${label}-06b-kolizija`);
    await suggest.click();
  }
  await dlg.getByRole('button', { name: 'Dodijeli servisera' }).click();
  await page.waitForURL(/nalozi\/NAL-/);
  await shoot(page, `${label}-07-nalog-vlasnik`, true);
  const id = page.url().split('/').pop();
  await page.goto(`${BASE}/demo/serviser/nalog/${id}`);
  await shoot(page, `${label}-08-serviser-planiran`, true);
  await page.getByRole('button', { name: /pokreni posjetu/ }).click();
  await shoot(page, `${label}-09-serviser-lista`, true);
  await page.getByRole('button', { name: 'Skeniraj QR uređaja' }).click();
  await shoot(page, `${label}-10-skeniranje`);
  // pogrešna naljepnica (drugi objekat)
  const decoy = page.locator('[data-testid^=sticker-]').last();
  await decoy.click();
  await shoot(page, `${label}-11-pogresan-uredjaj`);
  await page.getByTestId('sticker-TP-001').click();
  await shoot(page, `${label}-12-unos-uredjaja`, true);
  await page.getByRole('button', { name: 'Sve uredno' }).click();
  await shoot(page, `${label}-13-sve-uredno`, true);
  await page.getByRole('button', { name: /Sačuvaj TP-001/ }).click();
  await shoot(page, `${label}-14-lista-nakon-prvog`, true);
  for (const dev of ['KL-012', 'KL-015']) {
    if (!(await page.getByTestId(`item-${dev}`).count())) continue;
    await page.getByRole('button', { name: `Skeniraj QR za ${dev}` }).click();
    await page.getByTestId(`sticker-${dev}`).click();
    await page.getByRole('button', { name: 'Sve uredno' }).click();
    await page.getByRole('button', { name: new RegExp(`Sačuvaj ${dev}`) }).click();
  }
  await page.getByRole('button', { name: /Nastaviti redovni servis/ }).click();
  await shoot(page, `${label}-15-zavrsetak`, true);
  await page.getByRole('button', { name: 'Završi demo nalog' }).click();
  await shoot(page, `${label}-16-zavrseno`);
  await page.getByRole('link', { name: 'Pogledaj primjer izvještaja' }).click();
  await shoot(page, `${label}-17-izvjestaj`, true);
  await page.goto(`${BASE}/demo/kupac/TP-001`);
  await shoot(page, `${label}-18-kupac-status`, label === 'm');
  for (const [n, path] of [['19-pregled', '/demo'], ['20-raspored', '/demo/raspored'], ['21-nalozi', '/demo/nalozi'], ['22-uredaji', '/demo/uredaji'], ['23-pocetna', '/'], ['24-serviser', '/demo/serviser'], ['25-poruke', '/demo/poruke'], ['26-uredaj', '/demo/uredaji/KL-002']]) {
    await page.goto(BASE + path);
    await shoot(page, `${label}-${n}`, true);
  }
  await ctx.close();
}
await browser.close();
console.log(errors.length ? errors.join('\n') : 'bez grešaka i overflowa');
