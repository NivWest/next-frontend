// Order execution (story NW-04). OrderRequest, Order and their enums are generated from backend
// api/openapi.yaml (src/lib/api/schema.d.ts, `npm run api:gen`); the preview types are frontend-only.
// Money is SEK with 2 decimals; quantities allow up to 4 decimals (the ticket only sends whole shares).
import type { ErrorCode, Schemas } from '@/lib/api';

/** BUY fills at the ask, SELL fills at the bid. */
export type OrderSide = Schemas['OrderSide'];

/** Only market orders until NW-08. */
export type OrderType = Schemas['OrderType'];

/** Market orders are always FILLED; the other states are reserved for pending orders (NW-08). */
export type OrderStatus = Schemas['OrderStatus'];

/** Body of POST /api/v1/orders. Sent with an `Idempotency-Key` header (one key per submit). */
export type OrderRequest = Schemas['OrderRequest'];

/** Body of POST /api/v1/orders (201, or 200 when replayed with the same Idempotency-Key). Timestamps are RFC 3339 UTC. */
export type Order = Schemas['Order'];

/** `code`s an error body from POST /orders can carry; a value that is not an `ErrorCode` of the contract fails to compile. */
export const ORDER_ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'INSTRUMENT_NOT_FOUND',
  'CONFLICT',
  'INSUFFICIENT_FUNDS',
  'INSUFFICIENT_SHARES',
  'MARKET_DATA_UNAVAILABLE',
  'ORDER_NOT_FOUND',
  'ORDER_NOT_OPEN',
] as const satisfies readonly ErrorCode[];

export type OrderErrorCode = (typeof ORDER_ERROR_CODES)[number];

/** Input of `previewReservation()`: side, order type, quantity, limit/stop prices. */
export interface ReservationInput {
  side: OrderSide;
  type: OrderType;
  quantity: number;
  limitPrice?: number | null;
  stopPrice?: number | null;
}

/** Result of `previewReservation()`: cash reserved in SEK (BUY) or shares reserved (SELL). */
export interface ReservationPreview {
  cash: number;
  shares: number;
}

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
