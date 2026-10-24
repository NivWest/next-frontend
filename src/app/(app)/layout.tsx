import type { ReactNode } from 'react';
import { AppShell } from '@/components/layouts/AppShell';
import { AuthGuard } from '@/features/auth/components/AuthGuard';

/** Signed-in screens: the shell is only rendered once the session check has passed. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
