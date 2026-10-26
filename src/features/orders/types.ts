// Order history (story NW-05). Mirrors backend api/openapi.yaml#/components/schemas/OrderPage.
import type { Order } from '@/features/trading/types';

export type { Order };

/** Body of GET /api/v1/orders: newest first; `next_cursor` is null on the last page. */
export interface OrderPage {
  items: Order[];
  next_cursor: string | null;
}

/** Query of `listOrders()`: `limit` 1–100 (backend default 20), `cursor` = the previous page's `next_cursor`. */
export interface ListOrdersParams {
  limit?: number;
  cursor?: string | null;
}
