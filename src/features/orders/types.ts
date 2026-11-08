// Order history (story NW-05). OrderPage is generated from backend api/openapi.yaml (`npm run api:gen`).
import type { Schemas } from '@/lib/api';
import type { Order, OrderStatus } from '@/features/trading/types';

export type { Order };

/** Body of GET /api/v1/orders: newest first; `next_cursor` is null on the last page. */
export type OrderPage = Schemas['OrderPage'];

/** Query of `listOrders()`: `limit` 1–100 (backend default 20), `cursor` = the previous page's `next_cursor`, `status` = filter. */
export interface ListOrdersParams {
  limit?: number;
  cursor?: string | null;
  status?: readonly OrderStatus[];
}
