// Order history (story NW-05) and order thesis notes (story NW-17).
// OrderPage and OrderNoteRequest are generated from backend api/openapi.yaml (`npm run api:gen`).
import type { Schemas } from '@/lib/api';
import type { Order, OrderNoteRequest, OrderStatus } from '@/features/trading/types';

export type { Order, OrderNoteRequest, OrderStatus };

/** Body of GET /api/v1/orders: newest first; `next_cursor` is null on the last page. */
export type OrderPage = Schemas['OrderPage'];

/** Query of `listOrders()`: `limit` 1–100 (backend default 20), `cursor` = the previous page's `next_cursor`, `status` = filter. */
export interface ListOrdersParams {
  limit?: number;
  cursor?: string | null;
  status?: readonly OrderStatus[];
}
