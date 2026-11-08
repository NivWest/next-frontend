import { buildApiUrl } from '@/lib/api';
import type { Quote } from '../types';

// Live quotes over Server-Sent Events: GET /api/v1/market/stream?ids= (backend api/openapi.yaml, story NW-09).
// The stream is read with EventSource, so it can't go through api(); the URL comes from the same contract helper.

/** Event names of the stream, as documented in the contract. */
export const QUOTE_EVENT = 'quote';

/** The contract caps one stream at 50 ids. */
export const MAX_STREAM_IDS = 50;

/** `/api/v1/market/stream?ids=A,B` for the given ids (deduplicated, sorted, at most MAX_STREAM_IDS). */
export function quoteStreamUrl(ids: readonly string[]): string {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))].sort().slice(0, MAX_STREAM_IDS);
  return buildApiUrl('/market/stream', { query: { ids: unique.join(',') } });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Parses the `data` of a `quote` event; null when it isn't a Quote (the event is then ignored). */
export function parseQuoteEvent(data: string): Quote | null {
  let body: unknown;
  try {
    body = JSON.parse(data);
  } catch {
    return null;
  }
  if (!isRecord(body)) return null;
  const { orderbook_id, symbol, last, bid, ask, change_percent, currency, updated_at } = body;
  if (typeof orderbook_id !== 'string' || orderbook_id === '') return null;
  if (typeof symbol !== 'string' || typeof currency !== 'string' || typeof updated_at !== 'string') return null;
  for (const n of [last, bid, ask, change_percent]) {
    if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  }
  return {
    orderbook_id,
    symbol,
    last: last as number,
    bid: bid as number,
    ask: ask as number,
    change_percent: change_percent as number,
    currency,
    updated_at,
  };
}
