// Pure display helpers for the order history (story NW-05). Money goes through formatMoney (src/lib/format.ts).
import { formatMoney } from '@/lib/format';
import type { OrderSide, OrderStatus, OrderType } from '@/features/trading/types';

const SIDE_LABELS: Record<OrderSide, string> = {
  BUY: 'Buy',
  SELL: 'Sell',
};

const TYPE_LABELS: Record<OrderType, string> = {
  MARKET: 'Market',
  LIMIT: 'Limit',
  STOP: 'Stop',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  FILLED: 'Filled',
  OPEN: 'Open',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
};

/** `sideLabel('BUY')` → `"Buy"`, `sideLabel('SELL')` → `"Sell"`. */
export function sideLabel(side: OrderSide): string {
  return SIDE_LABELS[side];
}

/** `typeLabel('LIMIT')` → `"Limit"`, `typeLabel('STOP')` → `"Stop"`, `typeLabel('MARKET')` → `"Market"`. */
export function typeLabel(type: OrderType): string {
  return TYPE_LABELS[type] ?? type;
}

/** `statusLabel('FILLED')` → `"Filled"`; also `"Open"`, `"Cancelled"`, `"Rejected"`. */
export function statusLabel(status: OrderStatus): string {
  return STATUS_LABELS[status];
}

/** Re-exported from the shared formatters so order history and holdings show quantities the same way. */
export { formatQuantity } from '@/lib/format';

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

/** An order's money field: `formatMoney` for a number, `—` while it is null (fill fields are null until FILLED). */
export function formatOrderMoney(value: number | null): string {
  return value === null ? '—' : formatMoney(value);
}
