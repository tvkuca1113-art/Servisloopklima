'use client';

import QRCode from 'qrcode';

/**
 * QR kod sadrži samo apsolutnu adresu pokazne kartice uređaja na NOVOM demo sajtu.
 * Crno na bijelom, 4 modula mirne zone, korekcija grešaka M, bez logotipa preko koda.
 */
export const QR_OPTIONS = {
  errorCorrectionLevel: 'M',
  margin: 4,
  color: { dark: '#000000', light: '#ffffff' },
} as const;

const FORBIDDEN_HOST = 'servisloop2';

export function siteOrigin(): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim().replace(/\/+$/, '');
  if (configured && !configured.includes(FORBIDDEN_HOST)) return configured;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export function customerPath(deviceId: string): string {
  return `/demo/kupac/${encodeURIComponent(deviceId)}`;
}

export function customerUrl(deviceId: string): string {
  return `${siteOrigin()}${customerPath(deviceId)}`;
}

export async function qrPngDataUrl(url: string, width = 512): Promise<string> {
  return QRCode.toDataURL(url, { ...QR_OPTIONS, type: 'image/png', width });
}

export async function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { ...QR_OPTIONS, type: 'svg' });
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function downloadText(text: string, filename: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
