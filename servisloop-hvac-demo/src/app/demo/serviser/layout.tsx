import type { Metadata } from 'next';

import { TechShell } from '@/components/other-shells';

export const metadata: Metadata = { title: 'Serviser' };

export default function TechLayout({ children }: { children: React.ReactNode }) {
  return <TechShell>{children}</TechShell>;
}
