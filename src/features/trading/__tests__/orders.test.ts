import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { IDEMPOTENCY_KEY_HEADER, newIdempotencyKey, placeOrder } from '../api/orders';
import type { Order, OrderRequest } from '../types';

type FetchMock = Mock<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>;

const order: Order = {
  id: 7,
  orderbook_id: 'SIM-FJRD',
  symbol: 'FJRD',
  name: 'Fjord Robotics',
  side: 'BUY',
  type: 'MARKET',
  status: 'FILLED',
  quantity: 10,
  fill_price: 100.1,
  commission: 2.5,
  total: 1003.5,
  created_at: '2026-10-25T12:00:00Z',
  filled_at: '2026-10-25T12:00:00Z',
};

let fetchMock: FetchMock;

beforeEach(() => {
  fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('placeOrder', () => {
  it('POSTs the request to /api/v1/orders with the Idempotency-Key header', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(order), { status: 201 }));
    const request: OrderRequest = { orderbook_id: 'SIM-FJRD', side: 'BUY', quantity: 10 };

    await expect(placeOrder(request, 'key-1')).resolves.toEqual(order);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/v1/orders');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual(request);
    const headers = new Headers(init?.headers);
    expect(headers.get(IDEMPOTENCY_KEY_HEADER)).toBe('key-1');
    expect(headers.get('Content-Type')).toBe('application/json');
  });
});

describe('newIdempotencyKey', () => {
  it('returns a distinct UUID per call', () => {
    const first = newIdempotencyKey();
    const second = newIdempotencyKey();
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(second).not.toBe(first);
  });
});
