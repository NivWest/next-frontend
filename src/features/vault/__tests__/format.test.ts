import { describe, expect, it } from 'vitest';
import { calculateProjectedMonthlyInterest, formatApy, formatOpportunityCost } from '../format';

describe('Vault formatters and projection calculations', () => {
  it('formats APY with two decimals', () => {
    expect(formatApy(0.051)).toBe('5.10%');
    expect(formatApy(0.05)).toBe('5.00%');
    expect(formatApy(0.1234)).toBe('12.34%');
  });

  it('calculates projected 30-day interest on idle cash according to AC1', () => {
    // 100,000 × 0.051 × 30 / 365 ≈ 419.18
    const proj = calculateProjectedMonthlyInterest(100000, 0.051);
    expect(proj).toBeCloseTo(419.18, 2);

    expect(calculateProjectedMonthlyInterest(0, 0.051)).toBe(0);
    expect(calculateProjectedMonthlyInterest(100000, 0)).toBe(0);
    expect(calculateProjectedMonthlyInterest(-1000, 0.051)).toBe(0);
  });

  it('formats the opportunity cost educational line according to AC6', () => {
    const text = formatOpportunityCost(419.18);
    expect(text).toBe('Your idle cash could earn about 419.18 SEK per month');
  });
});
