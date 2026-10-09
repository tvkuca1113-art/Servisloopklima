// Pravi primjere za predaju: QR PNG/SVG, PDF naljepnice i PDF izvještaja
// (početni primjer NAL-0102 i posjeta s 3 uređaja napravljena kroz demo tok).
// Upotreba: BASE_URL=http://localhost:3000 SAMPLES_DIR=primjeri node scripts/flow-captures.mjs
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const SAMPLES = process.env.SAMPLES_DIR ?? 'primjeri';
await mkdir(SAMPLES, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'bs-BA', timezoneId: 'Europe/Sarajevo', viewport: { width: 1280, height: 900 }, acceptDownloads: true });
const d = await ctx.newPage();

// Tok: kupac prijavi kvar → vlasnik dodijeli (3 uređaja) → serviser skenira i završi.
await d.goto(`${BASE}/demo/kupac/TP-001?forma=kvar`);
const screen = d.getByTestId('customer-screen');
await screen.getByText('Ne grije', { exact: true }).click();
await screen.getByRole('button', { name: 'Simuliraj prijavu kvara' }).click();
await screen.getByRole('link', { name: 'Pogledaj kako ga vidi vlasnik' }).click();
await d.locator('#zahtjev-DEMO-001').getByRole('button', { name: 'Potvrdi i dodijeli servisera' }).click();
await d.getByRole('dialog').getByRole('button', { name: 'Dodijeli servisera' }).click();
await d.waitForURL(/nalozi\/NAL-/);
const orderId = d.url().split('/').pop();
await d.goto(`${BASE}/demo/serviser/nalog/${orderId}`);
await d.getByRole('button', { name: /pokreni posjetu/ }).click();
for (const id of ['TP-001', 'KL-012', 'KL-015']) {
  await d.getByRole('button', { name: `Skeniraj QR za ${id}` }).click();
  await d.getByRole('dialog').getByTestId(`sticker-${id}`).click();
  await d.getByRole('button', { name: 'Sve uredno' }).click();
  if (id === 'KL-012') {
    await d.getByTestId('device-entry').getByText('Potrebna pažnja', { exact: true }).nth(2).click();
    await d.getByPlaceholder('Kratko: šta treba pažnju (obavezno)').fill('Filter zaprljan — očišćen, kupcu objašnjeno održavanje (čćšžđ).');
  }
  await d.getByRole('button', { name: new RegExp(`Sačuvaj ${id}`) }).click();
}
await d.getByRole('button', { name: /Nastaviti redovni servis/ }).click();
await d.getByRole('button', { name: 'Završi demo nalog' }).click();
await d.goto(`${BASE}/demo/izvjestaji/${orderId}`);
await d.waitForSelector('[data-testid=report]');
await d.emulateMedia({ media: 'print' });
await d.pdf({ path: `${SAMPLES}/primjer-izvjestaja-posjeta-3-uredjaja.pdf`, format: 'A4', printBackground: true });
await d.emulateMedia({ media: 'screen' });

await d.goto(`${BASE}/demo/izvjestaji/NAL-0102`);
await d.waitForSelector('[data-testid=report]');
await d.emulateMedia({ media: 'print' });
await d.pdf({ path: `${SAMPLES}/primjer-izvjestaja-NAL-0102.pdf`, format: 'A4', printBackground: true });
await d.emulateMedia({ media: 'screen' });

await d.goto(`${BASE}/demo/uredaji/TP-001`);
const [pngDl] = await Promise.all([d.waitForEvent('download'), d.getByRole('button', { name: 'Preuzmi QR PNG' }).click()]);
await pngDl.saveAs(`${SAMPLES}/qr-TP-001-demo.png`);
const [svgDl] = await Promise.all([d.waitForEvent('download'), d.getByRole('button', { name: 'Preuzmi QR SVG' }).click()]);
await svgDl.saveAs(`${SAMPLES}/qr-TP-001-demo.svg`);
await d.goto(`${BASE}/demo/naljepnica/TP-001`);
await d.waitForTimeout(500);
await d.emulateMedia({ media: 'print' });
await d.pdf({ path: `${SAMPLES}/naljepnica-TP-001.pdf`, format: 'A4', printBackground: true });

await writeFile(`${SAMPLES}/IZVOR.txt`, `Generisano iz ${BASE} skriptom scripts/flow-captures.mjs.\nQR kodovi vode na ${BASE}/demo/kupac/TP-001 (adresa servera na kojem je skripta pokrenuta).\n`);
await browser.close();
console.log('gotovo', orderId);
