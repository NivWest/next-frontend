import type { OrderPreview, OrderPreviewInput } from './types';

// Client-side order preview (story NW-04). Mirrors the backend pricing in internal/services (api/openapi.yaml#/components/schemas/Order):
// price = ask (BUY) / bid (SELL), ×(1 + SLIPPAGE_RATE) / ×(1 − SLIPPAGE_RATE) when quantity > SLIPPAGE_QUANTITY_THRESHOLD,
// rounded half-up to 2 decimals; gross = price × quantity; commission = max(MIN_COMMISSION, COMMISSION_RATE × gross);
// total = gross + commission (BUY) / gross − commission (SELL). Every step rounds half-up to 2 decimals.
//
// All arithmetic runs on integers (money in cents, quantity in 1/10000 shares, rates in basis points) so float noise
// never changes a rounding: 100.10 × 1.005 = 100.6005 → 100.60, and 1.00 × 1.005 = 1.005 → 1.01.

/** Orders with strictly more shares than this get slippage. */
export const SLIPPAGE_QUANTITY_THRESHOLD = 100;
/** 0.5%: BUY fills at ask × 1.005, SELL at bid × 0.995 above the threshold. */
export const SLIPPAGE_RATE = 0.005;
/** 0.25% of the gross amount. */
export const COMMISSION_RATE = 0.0025;
/** Minimum commission per order, SEK. */
export const MIN_COMMISSION = 1;
/** Quantities allow at most this many decimals. */
export const QUANTITY_DECIMALS = 4;

const CENTS = 100;
const BASIS_POINTS = 10_000;
const QUANTITY_SCALE = 10 ** QUANTITY_DECIMALS;

const SLIPPAGE_BPS = Math.round(SLIPPAGE_RATE * BASIS_POINTS);
const COMMISSION_BPS = Math.round(COMMISSION_RATE * BASIS_POINTS);
const MIN_COMMISSION_CENTS = Math.round(MIN_COMMISSION * CENTS);

/** Half-up integer division of a non-negative numerator by a positive denominator. */
function divRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  const two = BigInt(2);
  return (two * numerator + denominator) / (two * denominator);
}

/** A positive SEK amount in whole cents, rounded half-up; strips float noise such as 100.1 × 100 = 10009.999…. */
function toCents(amount: number): number {
  return Math.round(Number((amount * CENTS).toPrecision(12)));
}

/** The quantity in 1/10000 shares, or null when it is not finite, not > 0 or has more than 4 decimals. */
function toQuantityUnits(quantity: number): number | null {
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  const units = Math.round(quantity * QUANTITY_SCALE);
  if (units < 1 || !Number.isSafeInteger(units) || units / QUANTITY_SCALE !== quantity) return null;
  return units;
}

function fromCents(cents: bigint): number {
  return Number(cents) / CENTS;
}

/** Prices an order like the backend does, or returns null for an invalid quantity or a non-positive bid/ask. */
export function previewOrder(input: OrderPreviewInput): OrderPreview | null {
  const { side, quantity, bid, ask } = input;
  const units = toQuantityUnits(quantity);
  if (units === null) return null;
  if (!Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0 || ask <= 0) return null;

  const baseCents = toCents(side === 'BUY' ? ask : bid);
  if (baseCents <= 0) return null;

  let priceCents = BigInt(baseCents);
  if (quantity > SLIPPAGE_QUANTITY_THRESHOLD) {
    const factor = BigInt(side === 'BUY' ? BASIS_POINTS + SLIPPAGE_BPS : BASIS_POINTS - SLIPPAGE_BPS);
    priceCents = divRoundHalfUp(priceCents * factor, BigInt(BASIS_POINTS));
  }

  const grossCents = divRoundHalfUp(priceCents * BigInt(units), BigInt(QUANTITY_SCALE));
  const percentCommission = divRoundHalfUp(grossCents * BigInt(COMMISSION_BPS), BigInt(BASIS_POINTS));
  const minCommission = BigInt(MIN_COMMISSION_CENTS);
  const commissionCents = percentCommission > minCommission ? percentCommission : minCommission;
  const totalCents = side === 'BUY' ? grossCents + commissionCents : grossCents - commissionCents;

  return {
    price: fromCents(priceCents),
    gross: fromCents(grossCents),
    commission: fromCents(commissionCents),
    total: fromCents(totalCents),
  };
}
