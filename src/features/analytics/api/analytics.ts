import { apiGet } from '@/lib/api';
import type { EquityHistory, HistoryRange, PortfolioAnalytics } from '../types';

// Client for portfolio history and analytics (backend api/openapi.yaml, story NW-10), typed by the generated
// contract (src/lib/api.ts). Errors reject with an `ApiRequestError`.

/** GET /portfolio/history?range=… — the signed-in user's equity over time, oldest first. */
export function getPortfolioHistory(range: HistoryRange, signal?: AbortSignal): Promise<EquityHistory> {
  return apiGet('/portfolio/history', { query: { range }, signal });
}

/** GET /portfolio/analytics — total return, risk metrics (null until enough history) and allocation. */
export function getPortfolioAnalytics(signal?: AbortSignal): Promise<PortfolioAnalytics> {
  return apiGet('/portfolio/analytics', { signal });
}
