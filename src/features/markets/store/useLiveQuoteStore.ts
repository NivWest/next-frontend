import { create } from 'zustand';
import type { Quote } from '../types';

// Latest streamed quote per instrument (story NW-09), keyed by orderbook_id. Filled by the shared quote stream
// connection (live/quoteConnection.ts); components read it through useLiveQuotes.

/** State of the shared stream: nothing watched, first connect, open, or waiting to reconnect after an error. */
export type StreamStatus = 'idle' | 'connecting' | 'live' | 'reconnecting';

/** Direction of the last price change, for the green/red flash; null before the first change. */
export type PriceDirection = 'up' | 'down' | null;

export interface LiveQuote {
  quote: Quote;
  direction: PriceDirection;
  /** Bumped on every change of `last`; used as a React key to replay the flash. */
  seq: number;
}

export type LiveQuotes = Readonly<Record<string, LiveQuote>>;

function samePrices(a: Quote, b: Quote): boolean {
  return a.last === b.last && a.bid === b.bid && a.ask === b.ask && a.change_percent === b.change_percent;
}

function isOlder(a: Quote, b: Quote): boolean {
  const ta = Date.parse(a.updated_at);
  const tb = Date.parse(b.updated_at);
  return !Number.isNaN(ta) && !Number.isNaN(tb) && ta < tb;
}

/**
 * Merges one streamed quote into `quotes` (pure). Returns `quotes` itself when nothing changed (same prices, or
 * a quote older than the stored one), so subscribers don't re-render. A change of `last` sets the direction
 * and bumps `seq`; a bid/ask/change-only update keeps both.
 */
export function mergeQuote(quotes: LiveQuotes, quote: Quote): LiveQuotes {
  const prev = quotes[quote.orderbook_id];
  if (prev && (samePrices(prev.quote, quote) || isOlder(quote, prev.quote))) return quotes;
  let direction: PriceDirection = prev?.direction ?? null;
  let seq = prev?.seq ?? 0;
  if (prev && quote.last !== prev.quote.last) {
    direction = quote.last > prev.quote.last ? 'up' : 'down';
    seq += 1;
  }
  return { ...quotes, [quote.orderbook_id]: { quote, direction, seq } };
}

/** Keeps only the entries of `ids` (pure); returns `quotes` itself when nothing is dropped. */
export function pruneQuotes(quotes: LiveQuotes, ids: readonly string[]): LiveQuotes {
  const keep = new Set(ids);
  const stale = Object.keys(quotes).filter((id) => !keep.has(id));
  if (stale.length === 0) return quotes;
  const next: Record<string, LiveQuote> = { ...quotes };
  for (const id of stale) delete next[id];
  return next;
}

export interface LiveQuoteState {
  quotes: LiveQuotes;
  status: StreamStatus;
  applyQuote: (quote: Quote) => void;
  setStatus: (status: StreamStatus) => void;
  /** Forget quotes of instruments nobody watches any more. */
  retain: (ids: readonly string[]) => void;
}

export const useLiveQuoteStore = create<LiveQuoteState>((set, get) => ({
  quotes: {},
  status: 'idle',
  applyQuote: (quote) => {
    const next = mergeQuote(get().quotes, quote);
    if (next !== get().quotes) set({ quotes: next });
  },
  setStatus: (status) => {
    if (status !== get().status) set({ status });
  },
  retain: (ids) => {
    const next = pruneQuotes(get().quotes, ids);
    if (next !== get().quotes) set({ quotes: next });
  },
}));
