import { DocumentShell } from '@/components/other-shells';

export default function DocumentLayout({ children }: { children: React.ReactNode }) {
  return <DocumentShell>{children}</DocumentShell>;
}
