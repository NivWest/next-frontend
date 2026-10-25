// Order execution (story NW-04). Mirrors backend api/openapi.yaml#/components/schemas (OrderRequest, Order).
// Money is SEK with 2 decimals; quantities allow up to 4 decimals (the ticket only sends whole shares).

/** BUY fills at the ask, SELL fills at the bid. */
export type OrderSide = 'BUY' | 'SELL';

/** Only market orders until NW-08. */
export type OrderType = 'MARKET';

/** Market orders are always FILLED; the other states are reserved for pending orders (NW-08). */
export type OrderStatus = 'OPEN' | 'FILLED' | 'CANCELLED' | 'REJECTED';

/** Body of POST /api/v1/orders. Sent with an `Idempotency-Key` header (one key per submit). */
export interface OrderRequest {
  orderbook_id: string;
  side: OrderSide;
  quantity: number;
  type?: OrderType;
}

/** Body of POST /api/v1/orders (201, or 200 when replayed with the same Idempotency-Key). Timestamps are RFC 3339 UTC. */
export interface Order {
  id: number;
  orderbook_id: string;
  symbol: string;
  name: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  quantity: number;
  fill_price: number;
  commission: number;
  total: number;
  created_at: string;
  filled_at: string | null;
}

/** `code` of an error body from POST /orders. */
export type OrderErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'INSTRUMENT_NOT_FOUND'
  | 'CONFLICT'
  | 'INSUFFICIENT_FUNDS'
  | 'INSUFFICIENT_SHARES'
  | 'MARKET_DATA_UNAVAILABLE';

/** Input of `previewOrder()`: the side, the share count and the live quote's bid and ask. */
export interface OrderPreviewInput {
  side: OrderSide;
  quantity: number;
  bid: number;
  ask: number;
}

/**
 * Result of `previewOrder()`, mirroring the backend pricing rules (all SEK, 2 decimals):
 * `price` = ask (BUY) / bid (SELL), ×1.005 / ×0.995 when quantity > 100, rounded half-up;
 * `gross` = price × quantity; `commission` = max(1.00, 0.25% × gross);
 * `total` = gross + commission (BUY, cash debited) or gross − commission (SELL, cash credited).
 */
export interface OrderPreview {
  price: number;
  gross: number;
  commission: number;
  total: number;
}
