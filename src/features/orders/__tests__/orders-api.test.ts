import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { cancelOrder, getOrder, listOrders } from '../api/orders';

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
    { params: { status: ['OPEN'] as const }, url: '/api/v1/orders?status=OPEN' },
  ])('$params → $url', async ({ params, url }) => {
    await expect(listOrders(params)).resolves.toEqual({ items: [], next_cursor: null });
    expect(String(fetchMock.mock.calls[0][0])).toBe(url);
  });
});

describe('getOrder', () => {
  it('calls GET /api/v1/orders/{id}', async () => {
    fetchMock.mockImplementationOnce(async () => new Response(JSON.stringify({ id: 42 }), { status: 200 }));
    await expect(getOrder(42)).resolves.toEqual({ id: 42 });
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/v1/orders/42');
  });
});

describe('cancelOrder', () => {
  it('calls DELETE /api/v1/orders/{id}', async () => {
    fetchMock.mockImplementationOnce(async () => new Response(JSON.stringify({ id: 42, status: 'CANCELLED' }), { status: 200 }));
    await expect(cancelOrder(42)).resolves.toEqual({ id: 42, status: 'CANCELLED' });
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/v1/orders/42');
    expect(fetchMock.mock.calls[0][1]?.method).toBe('DELETE');
  });
});
