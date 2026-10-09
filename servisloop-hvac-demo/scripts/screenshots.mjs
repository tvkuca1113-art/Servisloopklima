// Pravi screenshotove ključnih ekrana iz pokrenute aplikacije.
// Upotreba: BASE_URL=http://localhost:3100 node scripts/screenshots.mjs
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const OUT = process.env.OUT_DIR ?? 'screenshots';
const ONLY = process.env.ONLY;

const pages = [
  ['01-pocetna', '/'],
  ['02-vlasnik-pregled', '/demo'],
  ['03-uredaji', '/demo/uredaji'],
  ['04-uredaj-TP-001', '/demo/uredaji/TP-001'],
  ['05-kupac-TP-001', '/demo/kupac/TP-001'],
  ['06-kupac-zakazivanje', '/demo/kupac/TP-001?forma=servis'],
  ['07-raspored', '/demo/raspored'],
  ['08-zahtjevi', '/demo/zahtjevi'],
  ['09-nalozi', '/demo/nalozi'],
  ['10-serviser-danas', '/demo/serviser'],
  ['11-izvjestaj-NAL-0101', '/demo/izvjestaji/NAL-0101'],
  ['12-poruke', '/demo/poruke?primjer=podsjetnik&uredjaj=TP-001'],
  ['13-naljepnica', '/demo/naljepnica/TP-001'],
  ['14-plan-servisa', '/demo/plan'],
  ['15-prazne-naljepnice', '/demo/naljepnice'],
  ['16-kupac-prijedlog-termina', '/demo/kupac/TP-002?prijedlog=PRJ-001'],
];

const viewports = [
  ['desktop', { width: 1440, height: 900 }, false],
  ['mobile', { width: 390, height: 844 }, true],
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
for (const [vname, viewport, mobile] of viewports) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, locale: 'bs-BA', timezoneId: 'Europe/Sarajevo' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  for (const [name, path] of pages) {
    if (ONLY && !name.includes(ONLY)) continue;
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await page.screenshot({ path: `${OUT}/${name}-${vname}.png`, fullPage: true });
    console.log(`${vname} ${path} overflow=${overflow}`);
  }
  console.log(`${vname} console errors: ${errors.length ? errors.join('\n') : 'nema'}`);
  await ctx.close();
}
await browser.close();
