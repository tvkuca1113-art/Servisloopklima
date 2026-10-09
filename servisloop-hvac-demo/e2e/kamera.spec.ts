import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { chromium, expect, test } from '@playwright/test';
import { PNG } from 'pngjs';
import QRCode from 'qrcode';

/**
 * Stvarno skeniranje kamerom: Chromium dobija lažnu kameru iz Y4M videa u kojem je
 * QR naljepnica uređaja KL-002. Skener u aplikaciji servisera mora ga dekodirati i
 * otvoriti unos baš za taj uređaj. (Fizički telefon ovim nije testiran.)
 */
async function qrVideo(text: string): Promise<string> {
  const W = 640;
  const H = 480;
  const png = PNG.sync.read(await QRCode.toBuffer(text, { errorCorrectionLevel: 'M', margin: 4, width: 360 }));
  const y = Buffer.alloc(W * H, 235);
  const ox = Math.floor((W - png.width) / 2);
  const oy = Math.floor((H - png.height) / 2);
  for (let r = 0; r < png.height; r++) {
    for (let c = 0; c < png.width; c++) {
      const i = (r * png.width + c) * 4;
      const lum = 0.299 * png.data[i]! + 0.587 * png.data[i + 1]! + 0.114 * png.data[i + 2]!;
      y[(oy + r) * W + ox + c] = Math.round(16 + (lum / 255) * 219);
    }
  }
  const uv = Buffer.alloc((W / 2) * (H / 2), 128);
  const frame = Buffer.concat([Buffer.from('FRAME\n'), y, uv, uv]);
  const file = join(mkdtempSync(join(tmpdir(), 'qr-cam-')), 'qr.y4m');
  writeFileSync(file, Buffer.concat([Buffer.from(`YUV4MPEG2 W${W} H${H} F10:1 Ip A1:1 C420jpeg\n`), ...Array(10).fill(frame)]));
  return file;
}

test('skener servisera dekodira QR iz kamere i otvara unos za taj uređaj', async ({ baseURL }) => {
  const video = await qrVideo(`${baseURL}/demo/kupac/KL-002`);
  const browser = await chromium.launch({
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${video}`],
  });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['camera'] });
  const page = await ctx.newPage();
  await page.goto(`${baseURL}/demo/serviser/nalog/NAL-0111`);
  await page.getByRole('button', { name: /pokreni posjetu/ }).click();
  await page.getByRole('button', { name: 'Skeniraj QR za KL-002' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Skeniraj kamerom' }).click();
  const entry = page.getByTestId('device-entry');
  await expect(entry).toContainText('KL-002', { timeout: 15_000 });
  await expect(entry).toContainText('QR skeniran');
  await browser.close();
});
