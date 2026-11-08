import { describe, expect, it } from 'vitest';
import {
  costBasis,
  formatSignedMoney,
  pnlTone,
  unrealizedPnlPercent,
} from '../selectors';
import type { Portfolio, PortfolioPosition } from '../types';

function position(overrides: Partial<PortfolioPosition>): PortfolioPosition {
  return {
    orderbook_id: 'SIM-NVE',
    symbol: 'NVE',
    name: 'Nordvik Energy',
    quantity: 10,
    avg_cost: 100.35,
    last_price: 110,
    market_value: 1100,
    unrealized_pnl: 96.5,
    unrealized_pnl_percent: 9.62,
    day_change_percent: 1.25,
    weight: 100,
    reserved_quantity: 0,
    ...overrides,
  };
}

function portfolio(overrides: Partial<Portfolio> = {}): Portfolio {
  return {
    cash: 98996.5,
    reserved_cash: 0,
    buying_power: 98996.5,
    holdings_value: 1100,
    total_equity: 100096.5,
    unrealized_pnl: 96.5,
    realized_pnl: 0,
    positions: [position({})],
    top_movers: [],
    ...overrides,
  };
}

const fresh = portfolio({
  cash: 100000,
  reserved_cash: 0,
  buying_power: 100000,
  holdings_value: 0,
  total_equity: 100000,
  unrealized_pnl: 0,
  positions: [],
});

describe('costBasis', () => {
  it('is holdings_value minus unrealized_pnl, in cents', () => {
    expect(costBasis(portfolio())).toBe(1003.5);
    expect(costBasis(portfolio({ holdings_value: 0.3, unrealized_pnl: 0.1 }))).toBe(0.2);
  });

  it('is 0 without a portfolio or positions', () => {
    expect(costBasis(null)).toBe(0);
    expect(costBasis(fresh)).toBe(0);
  });
});

describe('unrealizedPnlPercent', () => {
  it('divides unrealized P&L by the cost basis', () => {
    expect(unrealizedPnlPercent(portfolio())).toBe(9.62);
    expect(unrealizedPnlPercent(portfolio({ holdings_value: 950, unrealized_pnl: -50 }))).toBe(-5);
  });

  it('is 0 when the cost basis is 0', () => {
    expect(unrealizedPnlPercent(null)).toBe(0);
    expect(unrealizedPnlPercent(fresh)).toBe(0);
    expect(unrealizedPnlPercent(portfolio({ holdings_value: 10, unrealized_pnl: 10 }))).toBe(0);
  });
});

describe('pnlTone', () => {
  it('classifies by sign at 2 decimals', () => {
    expect(pnlTone(96.5)).toBe('positive');
    expect(pnlTone(0.01)).toBe('positive');
    expect(pnlTone(-5)).toBe('negative');
    expect(pnlTone(0)).toBe('neutral');
    expect(pnlTone(-0.001)).toBe('neutral');
    expect(pnlTone(0.004)).toBe('neutral');
  });
});

describe('formatSignedMoney', () => {
  it('adds a plus sign to gains and keeps the minus on losses', () => {
    expect(formatSignedMoney(96.5)).toBe('+96.50 SEK');
    expect(formatSignedMoney(-5)).toBe('-5.00 SEK');
    expect(formatSignedMoney(1234.5)).toBe('+1,234.50 SEK');
  });

  it('shows zero without a sign', () => {
    expect(formatSignedMoney(0)).toBe('0.00 SEK');
    expect(formatSignedMoney(-0.001)).toBe('0.00 SEK');
  });

  it('accepts another currency', () => {
    expect(formatSignedMoney(1, 'USD')).toBe('+1.00 USD');
  });
});
