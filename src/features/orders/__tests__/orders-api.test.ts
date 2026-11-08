import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { listOrders } from '../api/orders';

type FetchMock = Mock<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>;

let fetchMock: FetchMock;

beforeEach(() => {
  fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
  fetchMock.mockImplementation(async () => new Response(JSON.stringify({ items: [], next_cursor: null }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('listOrders', () => {
  it.each([
    { params: undefined, url: '/api/v1/orders' },
    { params: { limit: 20 }, url: '/api/v1/orders?limit=20' },
    { params: { limit: 20, cursor: 'eyJjIjoiMjAyNiJ9' }, url: '/api/v1/orders?limit=20&cursor=eyJjIjoiMjAyNiJ9' },
    { params: { cursor: null }, url: '/api/v1/orders' },
    { params: { cursor: '' }, url: '/api/v1/orders' },
  ])('$params → $url', async ({ params, url }) => {
    await expect(listOrders(params)).resolves.toEqual({ items: [], next_cursor: null });
    expect(String(fetchMock.mock.calls[0][0])).toBe(url);
  });
});
