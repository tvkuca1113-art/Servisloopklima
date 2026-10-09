import { expect, test } from '@playwright/test';

const ROUTES = [
  '/',
  '/demo',
  '/demo/uredaji',
  '/demo/uredaji/TP-001',
  '/demo/uredaji/KL-009',
  '/demo/raspored',
  '/demo/zahtjevi',
  '/demo/nalozi',
  '/demo/nalozi/NAL-0111',
  '/demo/serviser',
  '/demo/serviser/nalozi',
  '/demo/serviser/nalog/NAL-0111',
  '/demo/kupac/TP-001',
  '/demo/kupac/TP-001?forma=servis',
  '/demo/kupac/KL-002?forma=kvar',
  '/demo/izvjestaji',
  '/demo/izvjestaji/NAL-0101',
  '/demo/poruke',
  '/demo/naljepnica/TP-001',
];

test('sve glavne rute rade direktno i prikazuju DEMO oznaku', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(`${page.url()}: ${m.text()}`));
  for (const r of ROUTES) {
    const res = await page.goto(r);
    expect(res?.status(), r).toBe(200);
    await expect(page.getByTestId('demo-bar'), r).toContainText('DEMO PROTOTIP');
    await expect(page.locator('a[href="#"]'), r).toHaveCount(0);
  }
  await page.goto('/demo/kupac');
  await expect(page).toHaveURL(/\/demo\/kupac\/TP-001$/);
  expect(errors).toEqual([]);
});

for (const width of [360, 390, 430, 768, 1280]) {
  test(`bez horizontalnog overflowa na ${width}px`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 800 }, isMobile: width < 768, hasTouch: width < 768 });
    const page = await ctx.newPage();
    for (const r of ROUTES) {
      await page.goto(r);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${r} @ ${width}px`).toBeLessThanOrEqual(0);
    }
    await ctx.close();
  });
}

test('modal: tastatura, Esc i povratak fokusa', async ({ page }) => {
  await page.goto('/demo/uredaji');
  const opener = page.getByRole('button', { name: 'Dodaj demo uređaj' });
  await opener.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(opener).toBeFocused();
});
