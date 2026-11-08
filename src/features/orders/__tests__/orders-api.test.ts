import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { listOrders, updateOrderNote } from '../api/orders';

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

describe('updateOrderNote', () => {
  it('PATCHes /api/v1/orders/{id}/note with the note body', async () => {
    const order = { id: 42, note: 'Buying dip' };
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(order), { status: 200 }));

    await expect(updateOrderNote(42, 'Buying dip')).resolves.toEqual(order);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/v1/orders/42/note');
    expect(init?.method).toBe('PATCH');
    expect(init?.body).toBe(JSON.stringify({ note: 'Buying dip' }));
  });
});
