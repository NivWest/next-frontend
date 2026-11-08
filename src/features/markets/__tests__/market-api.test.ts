import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { getCandles, getInstrumentDetails, getQuote, searchInstruments } from '../api/market';

// The market client builds its URLs from the generated contract's paths (story NW-07); these pin the exact
// requests so moving onto the typed helpers changed nothing on the wire.

type FetchMock = Mock<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>;

let fetchMock: FetchMock;

beforeEach(() => {
  fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
  fetchMock.mockImplementation(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function calledUrl(): string {
  return String(fetchMock.mock.calls[0][0]);
}

describe('market API client', () => {
  it.each([
    { name: 'searchInstruments', call: () => searchInstruments('fjord'), url: '/api/v1/market/instruments?q=fjord' },
    { name: 'searchInstruments encodes the query', call: () => searchInstruments('a&b c'), url: '/api/v1/market/instruments?q=a%26b+c' },
    { name: 'getQuote', call: () => getQuote('SIM-FJRD'), url: '/api/v1/market/instruments/SIM-FJRD/quote' },
    { name: 'getInstrumentDetails encodes the id', call: () => getInstrumentDetails('a/b'), url: '/api/v1/market/instruments/a%2Fb' },
    { name: 'getCandles', call: () => getCandles('5361', '1w'), url: '/api/v1/market/instruments/5361/candles?period=1w' },
  ])('$name GETs $url', async ({ call, url }) => {
    await expect(call()).resolves.toEqual({ ok: true });
    expect(calledUrl()).toBe(url);
    expect(fetchMock.mock.calls[0][1]?.method).toBeUndefined();
  });
});
