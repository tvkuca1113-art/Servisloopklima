import '@fontsource-variable/inter';
import './globals.css';

import type { Metadata, Viewport } from 'next';

import { ToastProvider } from '@/components/toast';
import { brand } from '@/config/brand';
import { DemoProvider } from '@/lib/store';

export const metadata: Metadata = {
  title: { default: `${brand.productName} — demo prototip`, template: `%s · ${brand.productName} (demo)` },
  description:
    'Pokazni primjer servisnog sistema za toplotne pumpe i klime: evidencija uređaja, QR prijava, raspored servisera i servisni izvještaj. Podaci su izmišljeni.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#101828',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bs">
      <body>
        <a href="#sadrzaj" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow">
          Preskoči na sadržaj
        </a>
        <DemoProvider>
          <ToastProvider>{children}</ToastProvider>
        </DemoProvider>
      </body>
    </html>
  );
}
