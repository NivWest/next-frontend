import { api } from '@/lib/api';
import type { Portfolio } from '../types';

// Client for the portfolio (backend api/openapi.yaml GET /portfolio, story NW-05).
// Errors reject with an `ApiRequestError` (src/lib/api.ts).

/** GET /portfolio — cash, positions at live prices, unrealized and realized P&L. */
export function getPortfolio(): Promise<Portfolio> {
  return api<Portfolio>('portfolio');
}
