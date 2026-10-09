import type { Metadata } from 'next';

import { CustomerShell } from '@/components/other-shells';

export const metadata: Metadata = { title: 'Vaš uređaj' };

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <CustomerShell>{children}</CustomerShell>;
}
