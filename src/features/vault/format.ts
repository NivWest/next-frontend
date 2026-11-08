import { formatMoney } from '@/lib/format';

/** Formats annual percentage yield as percentage with two decimals, e.g. 0.051 -> "5.10%". */
export function formatApy(apy: number): string {
  const percent = (apy * 100).toFixed(2);
  return `${percent}%`;
}

/** Formats the educational opportunity-cost projection on idle cash. */
export function formatOpportunityCost(projectedMonthlyInterest: number): string {
  return `Your idle cash could earn about ${formatMoney(projectedMonthlyInterest)} per month`;
}

/**
 * Calculates projected 30-day interest on uninvested cash (idle cash × APY × 30 / 365),
 * rounded to 2 decimals.
 */
export function calculateProjectedMonthlyInterest(cash: number, apy: number): number {
  if (cash <= 0 || apy <= 0) return 0;
  return Math.round(cash * apy * (30 / 365) * 100) / 100;
}
