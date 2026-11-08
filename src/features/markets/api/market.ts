import { apiGet } from '@/lib/api';
import type {
  CandlePeriod,
  CandlesResponse,
  InstrumentDetails,
  InstrumentSearchResponse,
  Quote,
} from '../types';

// Client for the public market data endpoints (backend api/openapi.yaml, story NW-03). Paths, parameters and
// bodies are checked against the generated contract (src/lib/api.ts, story NW-07).
// Errors reject with the backend's `error` message (see src/lib/api.ts).

/** GET /market/instruments?q= — the backend rejects a blank query with 400, so callers skip short input. */
export function searchInstruments(query: string): Promise<InstrumentSearchResponse> {
  return apiGet('/market/instruments', { query: { q: query } });
}

/** GET /market/instruments/{id}/quote */
export function getQuote(orderbookId: string): Promise<Quote> {
  return apiGet('/market/instruments/{orderbook_id}/quote', { path: { orderbook_id: orderbookId } });
}

/** GET /market/instruments/{id} */
export function getInstrumentDetails(orderbookId: string): Promise<InstrumentDetails> {
  return apiGet('/market/instruments/{orderbook_id}', { path: { orderbook_id: orderbookId } });
}

/** GET /market/instruments/{id}/candles?period= */
export function getCandles(orderbookId: string, period: CandlePeriod): Promise<CandlesResponse> {
  return apiGet('/market/instruments/{orderbook_id}/candles', {
    path: { orderbook_id: orderbookId },
    query: { period },
  });
}
