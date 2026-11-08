import { apiGet } from '@/lib/api';
import type { Portfolio } from '../types';

// Client for the portfolio (backend api/openapi.yaml GET /portfolio, story NW-05), typed by the generated
// contract (src/lib/api.ts, story NW-07). Errors reject with an `ApiRequestError` (src/lib/api.ts).

/** GET /portfolio — cash, positions at live prices, unrealized and realized P&L. */
export function getPortfolio(): Promise<Portfolio> {
  return apiGet('/portfolio');
}
