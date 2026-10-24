'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';

interface TryDemoButtonProps {
  /** Extra classes; also sets the vertical padding (default `py-2`). */
  className?: string;
}

// Starts a guest session in place: it is a button, not a link, so the visitor never leaves the app.
// The accessible name stays "Try the demo" while pending; progress is signalled with aria-busy.
export function TryDemoButton({ className = 'py-2' }: TryDemoButtonProps) {
  const loginAsGuest = useUIStore((state) => state.loginAsGuest);
  const [isPending, setIsPending] = useState(false);

  async function handleClick(): Promise<void> {
    if (isPending) return;
    setIsPending(true);
    try {
      // loginAsGuest reports its own failures with a toast.
      await loginAsGuest();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-busy={isPending}
      className={`w-full flex items-center justify-center gap-2 px-4 border border-[#27272a] text-white font-medium rounded-lg hover:bg-[#111111] hover:border-zinc-500 transition-colors disabled:opacity-70 disabled:cursor-wait ${className}`}
    >
      {isPending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
      Try the demo
    </button>
  );
}
