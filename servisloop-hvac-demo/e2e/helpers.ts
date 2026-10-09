import { readFileSync } from 'node:fs';

import jsQR from 'jsqr';
import { PNG } from 'pngjs';

export function decodePng(buffer: Buffer): string | null {
  const png = PNG.sync.read(buffer);
  const result = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  return result?.data ?? null;
}

export function decodePngFile(path: string): string | null {
  return decodePng(readFileSync(path));
}
