import { apiGet, apiPatch } from '@/lib/api';
import type { ListOrdersParams, Order, OrderPage } from '../types';

// Client for the order history (backend api/openapi.yaml GET /orders, story NW-05) and order thesis notes
// (PATCH /orders/{id}/note, story NW-17), typed by the generated contract (src/lib/api.ts, story NW-07).
// Errors reject with an `ApiRequestError` (src/lib/api.ts).

/** GET /orders?limit=&cursor= — one page of the signed-in user's orders, newest first. */
export function listOrders({ limit, cursor }: ListOrdersParams = {}): Promise<OrderPage> {
  return apiGet('/orders', { query: { limit, cursor: cursor || undefined } });
}

/** PATCH /orders/{id}/note — set or update the signed-in user's thesis note on an order (≤ 500 characters). */
export function updateOrderNote(id: number, note: string): Promise<Order> {
  return apiPatch('/orders/{id}/note', { path: { id }, body: { note } });
}
