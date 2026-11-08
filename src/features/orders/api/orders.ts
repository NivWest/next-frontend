import { apiGet } from '@/lib/api';
import type { ListOrdersParams, OrderPage } from '../types';

// Client for the order history (backend api/openapi.yaml GET /orders, story NW-05), typed by the generated
// contract (src/lib/api.ts, story NW-07). Errors reject with an `ApiRequestError` (src/lib/api.ts).

/** GET /orders?limit=&cursor= — one page of the signed-in user's orders, newest first. */
export function listOrders({ limit, cursor }: ListOrdersParams = {}): Promise<OrderPage> {
  return apiGet('/orders', { query: { limit, cursor: cursor || undefined } });
}
