'use client';

import type { StreamStatus } from '../store/useLiveQuoteStore';

interface LiveIndicatorProps {
  status: StreamStatus;
}

const LABELS: Record<Exclude<StreamStatus, 'idle'>, string> = {
  connecting: 'Connecting…',
  live: 'Live',
  reconnecting: 'Reconnecting…',
};

const DOT_CLASS: Record<Exclude<StreamStatus, 'idle'>, string> = {
  connecting: 'bg-zinc-500',
  live: 'bg-green-500',
  reconnecting: 'bg-yellow-500',
};

/**
 * State of the live price stream: "Live", "Connecting…" or "Reconnecting…" (nothing while no price is streamed).
 * Not a role="status" region, so pages' loading statuses stay unambiguous; aria-live announces the changes.
 */
export function LiveIndicator({ status }: LiveIndicatorProps) {
  if (status === 'idle') return null;
  return (
    <span
      aria-live="polite"
      data-testid="live-indicator"
      data-status={status}
      title={status === 'live' ? 'Prices update live' : undefined}
      className="inline-flex items-center gap-1.5 rounded-full border border-[#27272a] px-2 py-0.5 text-xs font-medium text-[#a1a1aa]"
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${DOT_CLASS[status]} ${status === 'live' ? 'motion-safe:animate-pulse' : ''}`}
      />
      {LABELS[status]}
    </span>
  );
}
