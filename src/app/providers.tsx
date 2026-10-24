'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { useUIStore } from '@/store/useUIStore';

export function Providers({ children }: { children: ReactNode }) {
  const checkAuth = useUIStore((state) => state.checkAuth);

  // Resolve the session once per page load; AuthGuard and the features read the result.
  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
