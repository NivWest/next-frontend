import { describe, expect, it } from 'vitest';
import {
  COMMISSION_RATE,
  MIN_COMMISSION,
  SLIPPAGE_QUANTITY_THRESHOLD,
  SLIPPAGE_RATE,
  previewOrder,
} from '../preview';
import type { OrderPreview, OrderPreviewInput } from '../types';

const BID = 99.9;
const ASK = 100.1;

interface PreviewCase {
  name: string;
  input: OrderPreviewInput;
  want: OrderPreview;
}

const cases: PreviewCase[] = [
  {
    name: 'BUY 10 fills at the ask with a 0.25% commission',
    input: { side: 'BUY', quantity: 10, bid: BID, ask: ASK },
    want: { price: 100.1, gross: 1001, commission: 2.5, total: 1003.5 },
  },
  {
    name: 'SELL 4 fills at the bid with the minimum commission',
    input: { side: 'SELL', quantity: 4, bid: BID, ask: ASK },
    want: { price: 99.9, gross: 399.6, commission: 1, total: 398.6 },
  },
  {
    name: 'BUY 200 adds 0.5% slippage, 100.6005 rounds to 100.60',
    input: { side: 'BUY', quantity: 200, bid: BID, ask: ASK },
    want: { price: 100.6, gross: 20120, commission: 50.3, total: 20170.3 },
  },
  {
    name: 'BUY 100 is at the threshold, no slippage',
    input: { side: 'BUY', quantity: 100, bid: BID, ask: ASK },
    want: { price: 100.1, gross: 10010, commission: 25.03, total: 10035.03 },
  },
  {
    name: 'BUY 101 is above the threshold, slippage applies',
    input: { side: 'BUY', quantity: 101, bid: BID, ask: ASK },
    want: { price: 100.6, gross: 10160.6, commission: 25.4, total: 10186 },
  },
  {
    name: 'SELL 200 subtracts 0.5% slippage, 99.4005 rounds to 99.40',
    input: { side: 'SELL', quantity: 200, bid: BID, ask: ASK },
    want: { price: 99.4, gross: 19880, commission: 49.7, total: 19830.3 },
  },
  {
    name: 'ask 1.00 x 1.005 = 1.005 rounds half-up to 1.01',
    input: { side: 'BUY', quantity: 101, bid: 0.99, ask: 1 },
    want: { price: 1.01, gross: 102.01, commission: 1, total: 103.01 },
  },
  {
    name: 'fractional quantity 0.5',
    input: { side: 'BUY', quantity: 0.5, bid: BID, ask: ASK },
    want: { price: 100.1, gross: 50.05, commission: 1, total: 51.05 },
  },
  {
    name: 'gross rounds half-up: 0.0001 x 50.00 = 0.005 -> 0.01',
    input: { side: 'BUY', quantity: 0.0001, bid: 49.9, ask: 50 },
    want: { price: 50, gross: 0.01, commission: 1, total: 1.01 },
  },
  {
    name: 'commission rounds half-up: 0.25% x 1002.00 = 2.505 -> 2.51',
    input: { side: 'SELL', quantity: 10, bid: 100.2, ask: 100.3 },
    want: { price: 100.2, gross: 1002, commission: 2.51, total: 999.49 },
  },
];

describe('previewOrder', () => {
  it.each(cases)('$name', ({ input, want }) => {
    expect(previewOrder(input)).toEqual(want);
  });

  it.each([
    ['zero', 0],
    ['negative', -1],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['more than 4 decimals', 1.00001],
  ])('returns null for a %s quantity', (_label, quantity) => {
    expect(previewOrder({ side: 'BUY', quantity, bid: BID, ask: ASK })).toBeNull();
  });

  it('returns null for a zero ask on a BUY and a zero bid on a SELL', () => {
    expect(previewOrder({ side: 'BUY', quantity: 10, bid: BID, ask: 0 })).toBeNull();
    expect(previewOrder({ side: 'SELL', quantity: 10, bid: 0, ask: ASK })).toBeNull();
  });

  it('returns null when either side of the quote is not positive', () => {
    expect(previewOrder({ side: 'BUY', quantity: 10, bid: 0, ask: ASK })).toBeNull();
    expect(previewOrder({ side: 'SELL', quantity: 10, bid: BID, ask: -1 })).toBeNull();
  });

  it('exports the pricing constants', () => {
    expect(SLIPPAGE_QUANTITY_THRESHOLD).toBe(100);
    expect(SLIPPAGE_RATE).toBe(0.005);
    expect(COMMISSION_RATE).toBe(0.0025);
    expect(MIN_COMMISSION).toBe(1);
  });
});
