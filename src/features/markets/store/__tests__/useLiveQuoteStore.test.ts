import { beforeEach, describe, expect, it } from 'vitest';
import type { Quote } from '../../types';
import { mergeQuote, pruneQuotes, useLiveQuoteStore, type LiveQuotes } from '../useLiveQuoteStore';

function sampleQuote(overrides: Partial<Quote> = {}): Quote {
  return {
    orderbook_id: 'SIM-FJRD',
    symbol: 'FJRD',
    last: 100,
    bid: 99.9,
    ask: 100.1,
    change_percent: 0,
    currency: 'SEK',
    updated_at: '2026-11-08T12:00:00Z',
    ...overrides,
  };
}

describe('mergeQuote', () => {
  it('adds a new quote with seq 0 and null direction', () => {
    const quotes: LiveQuotes = {};
    const quote = sampleQuote();
    const result = mergeQuote(quotes, quote);
    expect(result['SIM-FJRD']).toEqual({
      quote,
      direction: null,
      seq: 0,
    });
  });

  it('returns the same object if prices have not changed', () => {
    const quote = sampleQuote();
    const quotes: LiveQuotes = {
      'SIM-FJRD': { quote, direction: null, seq: 0 },
    };
    const next = mergeQuote(quotes, { ...quote });
    expect(next).toBe(quotes);
  });

  it('ignores older quotes by updated_at', () => {
    const current = sampleQuote({ updated_at: '2026-11-08T12:05:00Z', last: 105 });
    const quotes: LiveQuotes = {
      'SIM-FJRD': { quote: current, direction: 'up', seq: 1 },
    };
    const older = sampleQuote({ updated_at: '2026-11-08T12:00:00Z', last: 100 });
    const next = mergeQuote(quotes, older);
    expect(next).toBe(quotes);
  });

  it('detects upward price move, bumps seq and sets direction to up', () => {
    const current = sampleQuote({ last: 100 });
    const quotes: LiveQuotes = {
      'SIM-FJRD': { quote: current, direction: null, seq: 0 },
    };
    const higher = sampleQuote({ last: 105, updated_at: '2026-11-08T12:01:00Z' });
    const next = mergeQuote(quotes, higher);
    expect(next['SIM-FJRD'].direction).toBe('up');
    expect(next['SIM-FJRD'].seq).toBe(1);
    expect(next['SIM-FJRD'].quote.last).toBe(105);
  });

  it('detects downward price move, bumps seq and sets direction to down', () => {
    const current = sampleQuote({ last: 100 });
    const quotes: LiveQuotes = {
      'SIM-FJRD': { quote: current, direction: null, seq: 0 },
    };
    const lower = sampleQuote({ last: 95, updated_at: '2026-11-08T12:01:00Z' });
    const next = mergeQuote(quotes, lower);
    expect(next['SIM-FJRD'].direction).toBe('down');
    expect(next['SIM-FJRD'].seq).toBe(1);
    expect(next['SIM-FJRD'].quote.last).toBe(95);
  });

  it('preserves direction and seq when only bid/ask change', () => {
    const current = sampleQuote({ last: 100 });
    const quotes: LiveQuotes = {
      'SIM-FJRD': { quote: current, direction: 'up', seq: 3 },
    };
    const bidChange = sampleQuote({ last: 100, bid: 99.95, updated_at: '2026-11-08T12:01:00Z' });
    const next = mergeQuote(quotes, bidChange);
    expect(next['SIM-FJRD'].direction).toBe('up');
    expect(next['SIM-FJRD'].seq).toBe(3);
    expect(next['SIM-FJRD'].quote.bid).toBe(99.95);
  });
});

describe('pruneQuotes', () => {
  it('removes instruments that are not retained', () => {
    const quotes: LiveQuotes = {
      'SIM-FJRD': { quote: sampleQuote({ orderbook_id: 'SIM-FJRD' }), direction: null, seq: 0 },
      'SIM-NVE': { quote: sampleQuote({ orderbook_id: 'SIM-NVE' }), direction: null, seq: 0 },
    };
    const pruned = pruneQuotes(quotes, ['SIM-FJRD']);
    expect(Object.keys(pruned)).toEqual(['SIM-FJRD']);
  });

  it('returns the same object if no instruments were pruned', () => {
    const quotes: LiveQuotes = {
      'SIM-FJRD': { quote: sampleQuote({ orderbook_id: 'SIM-FJRD' }), direction: null, seq: 0 },
    };
    const pruned = pruneQuotes(quotes, ['SIM-FJRD', 'SIM-NVE']);
    expect(pruned).toBe(quotes);
  });
});

describe('useLiveQuoteStore', () => {
  beforeEach(() => {
    useLiveQuoteStore.setState({ quotes: {}, status: 'idle' });
  });

  it('updates state via applyQuote, setStatus, and retain', () => {
    const quote = sampleQuote();
    useLiveQuoteStore.getState().applyQuote(quote);
    expect(useLiveQuoteStore.getState().quotes['SIM-FJRD']?.quote.last).toBe(100);

    useLiveQuoteStore.getState().setStatus('live');
    expect(useLiveQuoteStore.getState().status).toBe('live');

    useLiveQuoteStore.getState().retain([]);
    expect(useLiveQuoteStore.getState().quotes).toEqual({});
  });
});
