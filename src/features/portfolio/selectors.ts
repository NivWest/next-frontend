// Pure helpers over the GET /portfolio body (story NW-05). Money is SEK with 2 decimals.
import { formatMoney } from '@/lib/format';
import type { Portfolio } from './types';

export type PnlTone = 'positive' | 'negative' | 'neutral';

/** Rounds to whole cents (or hundredths of a percent), half away from zero. */
function roundCents(value: number): number {
  const cents = Math.round(Math.abs(value) * 100 + Number.EPSILON) / 100;
  const rounded = value < 0 ? -cents : cents;
  return rounded === 0 ? 0 : rounded;
}

/** What the open positions cost: holdings_value − unrealized_pnl, in cents. 0 without a portfolio. */
export function costBasis(p: Portfolio | null): number {
  if (!p) return 0;
  return roundCents(p.holdings_value - p.unrealized_pnl);
}

/** Unrealized P&L as a percent of the cost basis (2 decimals); 0 when nothing is held. */
export function unrealizedPnlPercent(p: Portfolio | null): number {
  if (!p) return 0;
  const basis = costBasis(p);
  if (basis === 0) return 0;
  return roundCents((p.unrealized_pnl / basis) * 100);
}

/** Colour hint for a P&L or change value, judged at 2 decimals so -0.001 reads as neutral. */
export function pnlTone(value: number): PnlTone {
  const rounded = roundCents(value);
  if (rounded > 0) return 'positive';
  if (rounded < 0) return 'negative';
  return 'neutral';
}

/** `"+96.50 SEK"`, `"-5.00 SEK"`, `"0.00 SEK"`: formatMoney with an explicit plus sign for gains. */
export function formatSignedMoney(value: number, currency = 'SEK'): string {
  const tone = pnlTone(value);
  if (tone === 'neutral') return formatMoney(0, currency);
  const text = formatMoney(value, currency);
  return tone === 'positive' ? `+${text}` : text;
}
