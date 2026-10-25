import { api } from '@/lib/api';
import type { Order, OrderRequest } from '../types';

// Client for order execution (backend api/openapi.yaml POST /orders, story NW-04).
// Errors reject with an `ApiRequestError` (src/lib/api.ts) whose `code` is an `OrderErrorCode`.

/** Header that makes a retried submit replay the original order instead of executing twice. */
export const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';

/** A fresh key per user action (submit); reuse it only when retrying that same submit. */
export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

/** POST /orders — places and executes a market order. */
export function placeOrder(request: OrderRequest, idempotencyKey: string): Promise<Order> {
  return api<Order>('orders', {
    method: 'POST',
    headers: { [IDEMPOTENCY_KEY_HEADER]: idempotencyKey },
    body: JSON.stringify(request),
  });
}
