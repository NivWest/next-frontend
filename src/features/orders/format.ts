// Pure display helpers for the order history (story NW-05). Money goes through formatMoney (src/lib/format.ts).
import type { OrderSide, OrderStatus } from '@/features/trading/types';

const SIDE_LABELS: Record<OrderSide, string> = {
  BUY: 'Buy',
  SELL: 'Sell',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  FILLED: 'Filled',
  OPEN: 'Open',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
};

const quantityFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 });

/** `sideLabel('BUY')` → `"Buy"`, `sideLabel('SELL')` → `"Sell"`. */
export function sideLabel(side: OrderSide): string {
  return SIDE_LABELS[side];
}

/** `statusLabel('FILLED')` → `"Filled"`; also `"Open"`, `"Cancelled"`, `"Rejected"`. */
export function statusLabel(status: OrderStatus): string {
  return STATUS_LABELS[status];
}

/** Up to 4 decimals, no trailing zeros: `10` → `"10"`, `2.5` → `"2.5"`, `1234.12345` → `"1,234.1235"`. */
export function formatQuantity(quantity: number): string {
  return quantityFormat.format(quantity);
}

/**
 * An RFC 3339 timestamp as a short date and time in the given locale (default: the user's),
 * e.g. `formatOrderTime('2026-10-26T09:42:00Z', 'en-GB', 'UTC')` → `"26 Oct 2026, 09:42"`.
 * An unparseable value is returned unchanged.
 */
export function formatOrderTime(iso: string, locale?: string, timeZone?: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone });
}
