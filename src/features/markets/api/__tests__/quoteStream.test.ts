import { describe, expect, it } from 'vitest';
import { MAX_STREAM_IDS, parseQuoteEvent, quoteStreamUrl } from '../quoteStream';

describe('quoteStreamUrl', () => {
  it('deduplicates, trims and sorts ids', () => {
    const url = quoteStreamUrl(['SIM-NVE', 'SIM-FJRD', ' SIM-NVE ', '']);
    expect(url).toBe('/api/v1/market/stream?ids=SIM-FJRD%2CSIM-NVE');
  });

  it('caps ids at MAX_STREAM_IDS', () => {
    const ids = Array.from({ length: 60 }, (_, i) => `ID-${String(i).padStart(3, '0')}`);
    const url = quoteStreamUrl(ids);
    const params = new URLSearchParams(url.split('?')[1]);
    const parsed = params.get('ids')?.split(',') ?? [];
    expect(parsed).toHaveLength(MAX_STREAM_IDS);
  });
});

describe('parseQuoteEvent', () => {
  const valid = JSON.stringify({
    orderbook_id: 'SIM-FJRD',
    symbol: 'FJRD',
    last: 123.45,
    bid: 123.35,
    ask: 123.55,
    change_percent: 1.25,
    currency: 'SEK',
    updated_at: '2026-11-08T12:00:00Z',
  });

  it('parses a valid Quote JSON', () => {
    const quote = parseQuoteEvent(valid);
    expect(quote).toEqual({
      orderbook_id: 'SIM-FJRD',
      symbol: 'FJRD',
      last: 123.45,
      bid: 123.35,
      ask: 123.55,
      change_percent: 1.25,
      currency: 'SEK',
      updated_at: '2026-11-08T12:00:00Z',
    });
  });

  it('returns null on invalid JSON or non-object', () => {
    expect(parseQuoteEvent('')).toBeNull();
    expect(parseQuoteEvent('{not json')).toBeNull();
    expect(parseQuoteEvent('"string"')).toBeNull();
    expect(parseQuoteEvent('123')).toBeNull();
    expect(parseQuoteEvent('null')).toBeNull();
  });

  it('returns null when required fields are missing or wrong type', () => {
    expect(parseQuoteEvent(JSON.stringify({ orderbook_id: '', symbol: 'FJRD' }))).toBeNull();
    expect(parseQuoteEvent(JSON.stringify({ orderbook_id: 'SIM-FJRD', last: '123' }))).toBeNull();
    expect(parseQuoteEvent(JSON.stringify({ orderbook_id: 'SIM-FJRD', last: NaN }))).toBeNull();
    expect(parseQuoteEvent(JSON.stringify({ orderbook_id: 'SIM-FJRD', last: Infinity }))).toBeNull();
  });
});
