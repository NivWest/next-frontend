import { describe, expect, it } from 'vitest';
import { formatOrderMoney, formatOrderTime, formatQuantity, sideLabel, statusLabel, typeLabel } from '../format';

describe('sideLabel', () => {
  it('maps BUY and SELL to Buy and Sell', () => {
    expect(sideLabel('BUY')).toBe('Buy');
    expect(sideLabel('SELL')).toBe('Sell');
  });
});

describe('typeLabel', () => {
  it('maps order types to title-case labels', () => {
    expect(typeLabel('MARKET')).toBe('Market');
    expect(typeLabel('LIMIT')).toBe('Limit');
    expect(typeLabel('STOP')).toBe('Stop');
  });
});

describe('formatOrderMoney', () => {
  it('returns formatted money for numbers and a dash for null', () => {
    expect(formatOrderMoney(100.1)).toBe('100.10 SEK');
    expect(formatOrderMoney(null)).toBe('—');
  });
});

describe('statusLabel', () => {
  it('maps every order status to a title-case label', () => {
    expect(statusLabel('FILLED')).toBe('Filled');
    expect(statusLabel('OPEN')).toBe('Open');
    expect(statusLabel('CANCELLED')).toBe('Cancelled');
    expect(statusLabel('REJECTED')).toBe('Rejected');
  });
});

describe('formatQuantity', () => {
  it('shows whole quantities without decimals', () => {
    expect(formatQuantity(10)).toBe('10');
    expect(formatQuantity(0)).toBe('0');
  });

  it('keeps up to 4 decimals and drops trailing zeros', () => {
    expect(formatQuantity(2.5)).toBe('2.5');
    expect(formatQuantity(0.1234)).toBe('0.1234');
    expect(formatQuantity(1.10)).toBe('1.1');
  });

  it('rounds beyond 4 decimals and groups thousands', () => {
    expect(formatQuantity(1234.12345)).toBe('1,234.1235');
    expect(formatQuantity(1.00001)).toBe('1');
  });
});

describe('formatOrderTime', () => {
  it('formats a timestamp as a medium date and short time in the given locale and zone', () => {
    expect(formatOrderTime('2026-10-26T09:42:00Z', 'en-GB', 'UTC')).toBe('26 Oct 2026, 09:42');
  });

  it('applies the time zone', () => {
    expect(formatOrderTime('2026-10-26T09:42:00Z', 'en-GB', 'Europe/Stockholm')).toBe('26 Oct 2026, 10:42');
  });

  it('defaults to the runtime locale', () => {
    const iso = '2026-10-26T09:42:00Z';
    const expected = new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    expect(formatOrderTime(iso)).toBe(expected);
  });

  it('returns an unparseable value unchanged', () => {
    expect(formatOrderTime('not a date')).toBe('not a date');
  });
});
