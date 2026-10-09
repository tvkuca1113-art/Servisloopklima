// Snima stanja toka (greške forme, potvrda, kolizija, mobilni nalog) i pravi
// primjere: QR PNG/SVG i PDF izvještaja preko browser „Print → PDF”.
// Upotreba: BASE_URL=http://localhost:3000 node scripts/flow-captures.mjs
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { PNG } from 'pngjs';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const SHOTS = process.env.OUT_DIR ?? 'screenshots';
const SAMPLES = process.env.SAMPLES_DIR ?? 'primjeri';
await mkdir(SHOTS, { recursive: true });
await mkdir(SAMPLES, { recursive: true });

const browser = await chromium.launch();
const opts = { locale: 'bs-BA', timezoneId: 'Europe/Sarajevo' };
const mobile = await browser.newContext({ ...opts, viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, acceptDownloads: true });
const page = await mobile.newPage();

// Kupac: greške forme na telefonu
await page.goto(`${BASE}/demo/uredaji/TP-001`);
await page.goto(`${BASE}/demo/kupac/TP-001?forma=servis`);
await page.getByLabel('Telefon ili e-mail').fill('061');
await page.getByRole('button', { name: 'Simuliraj slanje zahtjeva' }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOTS}/20-kupac-forma-greske-mobile.png` });
await page.getByRole('button', { name: 'Popuni primjerom' }).click();
await page.getByRole('button', { name: 'Simuliraj slanje zahtjeva' }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOTS}/21-kupac-potvrda-mobile.png` });

// Vlasnik na telefonu: dodjela s kolizijom
await page.getByRole('link', { name: 'Pogledaj kako ga vidi vlasnik' }).click();
await page.locator('#zahtjev-DEMO-001').getByRole('button', { name: 'Potvrdi i dodijeli servisera' }).click();
const dialog = page.getByRole('dialog');
await dialog.getByRole('button', { name: 'Postavi danas' }).click().catch(() => {});
await dialog.getByRole('radio', { name: /Lejla/ }).check();
await dialog.getByLabel('Početak').selectOption('09:00');
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOTS}/22-dodjela-kolizija-mobile.png` });
await dialog.getByRole('radio', { name: /Amar/ }).check();
await dialog.getByRole('button', { name: 'Dodijeli servisera' }).click();
await page.waitForURL(/nalozi\/NAL-/);
const orderId = page.url().split('/').pop();

// Serviser: dnevni pregled i nalog sa dugom bilješkom i fotografijom
await page.goto(`${BASE}/demo/serviser`);
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOTS}/23-serviser-danas-mobile.png`, fullPage: true });
await page.goto(`${BASE}/demo/serviser/nalog/${orderId}`);
await page.getByRole('button', { name: 'Pokreni demo nalog' }).click();
const uredno = page.getByText('Uredno', { exact: true });
for (let i = 0; i < (await uredno.count()); i++) await uredno.nth(i).click();
await page.getByText('Potrebna pažnja', { exact: true }).nth(2).click();
await page.getByPlaceholder('Opišite šta treba pažnju (obavezno)').fill('Primjer zapisa: zatečeno stanje opisano za kupca.');
await page.getByLabel('Bilješka servisera').fill('Duža bilješka servisera: pregled obavljen u dogovoru s kupcem, pristup jedinicama uredan. Kupcu objašnjeno šta je evidentirano i kada je sljedeći servis. Slova č ć š ž đ prikazana ispravno.');
const png = new PNG({ width: 320, height: 200 });
for (let y = 0; y < 200; y++) for (let x = 0; x < 320; x++) { const i = (y * 320 + x) * 4; png.data[i] = 60 + x / 3; png.data[i + 1] = 110 + y / 3; png.data[i + 2] = 200; png.data[i + 3] = 255; }
await page.locator('input[type=file]').setInputFiles({ name: 'vanjska-jedinica-primjer.png', mimeType: 'image/png', buffer: PNG.sync.write(png) });
await page.getByLabel(/Preporuka kupcu/).fill('Nastaviti redovni servis prema intervalu koji potvrdi firma.');
await page.getByLabel(/Potvrda kupca/).fill('Demo Kupac (primjer potvrde)');
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOTS}/24-serviser-nalog-mobile.png`, fullPage: true });
await page.getByRole('button', { name: 'Završi demo nalog' }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOTS}/25-serviser-zavrseno-mobile.png` });

// Izvještaj: ekran i stvarni PDF iz print prikaza (Chromium „Save as PDF”)
const desktop = await browser.newContext({ ...opts, viewport: { width: 1280, height: 900 } });
const d = await desktop.newPage();
// isti tab-state nije dijeljen između konteksta, zato izvještaj za PDF pravimo iz početnog završenog primjera
await d.goto(`${BASE}/demo/izvjestaji/NAL-0102`);
await d.waitForSelector('[data-testid=report]');
await d.emulateMedia({ media: 'print' });
await d.pdf({ path: `${SAMPLES}/primjer-izvjestaja-NAL-0102.pdf`, format: 'A4', printBackground: true });
await d.emulateMedia({ media: 'screen' });
await page.goto(`${BASE}/demo/izvjestaji/${orderId}`);
await page.waitForSelector('[data-testid=report]');
await page.screenshot({ path: `${SHOTS}/26-izvjestaj-mobile.png`, fullPage: true });
await page.emulateMedia({ media: 'print' });
await page.pdf({ path: `${SAMPLES}/primjer-izvjestaja-iz-toka.pdf`, format: 'A4', printBackground: true });

// QR primjeri
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
