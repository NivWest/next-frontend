'use client';

import { useEffect } from 'react';
import { getQuoteConnection } from '../live/quoteConnection';
import { useLiveQuoteStore, type LiveQuote, type LiveQuotes, type StreamStatus } from '../store/useLiveQuoteStore';
import type { Quote } from '../types';

export interface LiveQuotesResult {
  /** Streamed quotes keyed by orderbook_id (may also hold other components' ids). */
  quotes: LiveQuotes;
  status: StreamStatus;
}

/** Stable key for an id list, so a new array with the same ids doesn't resubscribe. */
function idsKey(ids: readonly string[]): string {
  return [...new Set(ids.filter(Boolean))].sort().join(',');
}

/**
 * Streams live quotes for `ids` (story NW-09) over the tab's shared EventSource (GET /api/v1/market/stream),
 * which reconnects with exponential backoff and closes once no component watches anything. Unsubscribes on
 * unmount or when the ids change.
 */
export function useLiveQuotes(ids: readonly string[]): LiveQuotesResult {
  const key = idsKey(ids);
  useEffect(() => {
    if (key === '') return;
    return getQuoteConnection()?.subscribe(key.split(','));
  }, [key]);
  const quotes = useLiveQuoteStore((state) => state.quotes);
  const status = useLiveQuoteStore((state) => state.status);
  return { quotes, status };
}

/** `useLiveQuotes([orderbookId])`, returning that instrument's entry. */
export function useLiveQuote(orderbookId: string): { live: LiveQuote | null; status: StreamStatus } {
  const { quotes, status } = useLiveQuotes([orderbookId]);
  return { live: quotes[orderbookId] ?? null, status };
}

/**
 * The quote to show: the streamed one while the stream is live (or when there is nothing else), otherwise the
 * fallback (initial load or polling), which is fresher while the stream is down.
 */
export function pickQuote(live: LiveQuote | null, status: StreamStatus, fallback: Quote | null): Quote | null {
  if (live && (status === 'live' || fallback === null)) return live.quote;
  return fallback ?? live?.quote ?? null;
}
