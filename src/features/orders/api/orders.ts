import { apiDelete, apiGet, apiPatch } from '@/lib/api';
import type { OrderStatus } from '@/features/trading/types';
import type { ListOrdersParams, Order, OrderPage } from '../types';

// Client for the order history, pending orders and thesis notes (backend api/openapi.yaml GET /orders, GET/DELETE /orders/{id}, PATCH /orders/{id}/note, stories NW-05, NW-08 and NW-17),
// typed by the generated contract (src/lib/api.ts, story NW-07). Errors reject with an `ApiRequestError` (src/lib/api.ts).

/** GET /orders?limit=&cursor=&status= — one page of the signed-in user's orders, newest first. */
export function listOrders({ limit, cursor, status }: ListOrdersParams = {}): Promise<OrderPage> {
  return apiGet('/orders', {
    query: {
      limit,
      cursor: cursor || undefined,
      status: status ? (status as OrderStatus[]) : undefined,
    },
  });
}

/** GET /orders/{id} — one order of the signed-in user. */
export function getOrder(id: number): Promise<Order> {
  return apiGet('/orders/{id}', { path: { id } });
}

/** DELETE /orders/{id} — cancels an OPEN order and releases its reservation. */
export function cancelOrder(id: number): Promise<Order> {
  return apiDelete('/orders/{id}', { path: { id } });
}

/** PATCH /orders/{id}/note — set or update the signed-in user's thesis note on an order (≤ 500 characters). */
export function updateOrderNote(id: number, note: string): Promise<Order> {
  return apiPatch('/orders/{id}/note', { path: { id }, body: { note } });
}
