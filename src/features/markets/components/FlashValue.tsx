'use client';

import type { ReactNode } from 'react';
import type { LiveQuote } from '../store/useLiveQuoteStore';

interface FlashValueProps {
  /** The live entry behind the value; a change of its `seq` replays the flash. */
  live: LiveQuote | null | undefined;
  children: ReactNode;
  className?: string;
}

/**
 * Wraps a live number and flashes it green (up) or red (down) when the price changes. The span is re-keyed by
 * `seq`, so the CSS animation restarts without state; `prefers-reduced-motion` turns it off (globals.css).
 */
export function FlashValue({ live, children, className }: FlashValueProps) {
  const flash = live?.direction ? `price-flash-${live.direction}` : '';
  return (
    <span key={live?.seq ?? 0} className={`rounded px-0.5 -mx-0.5 ${flash} ${className ?? ''}`.trim()}>
      {children}
    </span>
  );
}
