import { api } from '@/lib/api';
import type {
  CandlePeriod,
  CandlesResponse,
  InstrumentDetails,
  InstrumentSearchResponse,
  Quote,
} from '../types';

// Client for the public market data endpoints (backend api/openapi.yaml, story NW-03).
// Errors reject with the backend's `error` message (see src/lib/api.ts).

const instrumentPath = (orderbookId: string) => `market/instruments/${encodeURIComponent(orderbookId)}`;

/** GET /market/instruments?q= — the backend rejects a blank query with 400, so callers skip short input. */
export function searchInstruments(query: string): Promise<InstrumentSearchResponse> {
  return api<InstrumentSearchResponse>(`market/instruments?q=${encodeURIComponent(query)}`);
}

/** GET /market/instruments/{id}/quote */
export function getQuote(orderbookId: string): Promise<Quote> {
  return api<Quote>(`${instrumentPath(orderbookId)}/quote`);
}

/** GET /market/instruments/{id} */
export function getInstrumentDetails(orderbookId: string): Promise<InstrumentDetails> {
  return api<InstrumentDetails>(instrumentPath(orderbookId));
}

/** GET /market/instruments/{id}/candles?period= */
export function getCandles(orderbookId: string, period: CandlePeriod): Promise<CandlesResponse> {
  return api<CandlesResponse>(`${instrumentPath(orderbookId)}/candles?period=${period}`);
}
