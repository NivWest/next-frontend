import { api } from '@/lib/api';
import type { ListOrdersParams, OrderPage } from '../types';

// Client for the order history (backend api/openapi.yaml GET /orders, story NW-05).
// Errors reject with an `ApiRequestError` (src/lib/api.ts).

/** GET /orders?limit=&cursor= — one page of the signed-in user's orders, newest first. */
export function listOrders({ limit, cursor }: ListOrdersParams = {}): Promise<OrderPage> {
  const query = new URLSearchParams();
  if (limit !== undefined) query.set('limit', String(limit));
  if (cursor) query.set('cursor', cursor);
  const qs = query.toString();
  return api<OrderPage>(qs ? `orders?${qs}` : 'orders');
}
