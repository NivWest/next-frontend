'use client';

import { Suspense, useEffect } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { loginHref } from '@/lib/routes';
import { useUIStore } from '@/store/useUIStore';

export interface AuthGuardProps {
  children: ReactNode;
}

function Splash() {
  return (
    <div className="h-screen w-full bg-black flex items-center justify-center" role="status" aria-label="Loading">
      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-green-500/20 animate-pulse">
        T
      </div>
    </div>
  );
}

function Guard({ children }: AuthGuardProps) {
  const isAuthChecking = useUIStore((state) => state.isAuthChecking);
  const isAuthenticated = useUIStore((state) => state.isAuthenticated);
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const search = useSearchParams()?.toString() ?? '';
  const mustSignIn = !isAuthChecking && !isAuthenticated;

  useEffect(() => {
    if (mustSignIn) {
      router.replace(loginHref(pathname + (search ? `?${search}` : '')));
    }
  }, [mustSignIn, pathname, search, router]);

  if (isAuthChecking || !isAuthenticated) {
    return <Splash />;
  }
  return <>{children}</>;
}

/**
 * Renders its children only for a signed-in visitor. While the session check (started by
 * Providers) runs, and while an unauthenticated visitor is sent to /login?next=<current URL>,
 * it shows the splash instead.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  // useSearchParams needs a Suspense boundary so the route can still be prerendered (as the splash).
  return (
    <Suspense fallback={<Splash />}>
      <Guard>{children}</Guard>
    </Suspense>
  );
}
