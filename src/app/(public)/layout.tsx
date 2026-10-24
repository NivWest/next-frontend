import type { ReactNode } from 'react';
import { AppShell } from '@/components/layouts/AppShell';

/** Screens anyone may open without signing in, inside the same shell as the app. */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
