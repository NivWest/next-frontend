import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { apiDelete, apiGet, apiPatch, apiPost, ApiRequestError, buildApiUrl } from '../api';
import type { ErrorCode, Schemas, SuccessBody, Operation } from '../api';

// Typed helpers over the generated contract (story NW-07). The runtime cases pin the URLs and requests they
// send; the type cases (checked by `tsc --noEmit`, which includes test files) pin what the contract allows.

type FetchMock = Mock<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>;

let fetchMock: FetchMock;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function lastCall(): { url: string; init: RequestInit | undefined } {
  const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return { url: String(url), init };
}

beforeEach(() => {
  fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('buildApiUrl', () => {
  it.each([
    { path: '/portfolio', options: {}, want: '/api/v1/portfolio' },
    { path: '/watchlists/{id}', options: { path: { id: 7 } }, want: '/api/v1/watchlists/7' },
    {
      path: '/watchlists/{id}/items/{orderbook_id}',
      options: { path: { id: 7, orderbook_id: 'SIM/NVE x' } },
      want: '/api/v1/watchlists/7/items/SIM%2FNVE%20x',
    },
    { path: '/orders', options: { query: { limit: 20, cursor: 'abc' } }, want: '/api/v1/orders?limit=20&cursor=abc' },
    { path: '/orders', options: { query: { limit: undefined, cursor: null } }, want: '/api/v1/orders' },
    { path: '/market/instruments', options: { query: { q: 'fjord & co' } }, want: '/api/v1/market/instruments?q=fjord+%26+co' },
  ])('$path with $options → $want', ({ path, options, want }) => {
    expect(buildApiUrl(path, options)).toBe(want);
  });

  it('throws on a missing path parameter instead of sending "{id}"', () => {
    expect(() => buildApiUrl('/watchlists/{id}', {})).toThrow('Missing path parameter "id" for /watchlists/{id}');
  });
});

describe('typed helpers', () => {
  it('apiGet sends no method and no body, with cookies, and resolves the JSON body', async () => {
    const portfolio = { cash: 1, holdings_value: 0, total_equity: 1, unrealized_pnl: 0, realized_pnl: 0, positions: [], top_movers: [] };
    fetchMock.mockResolvedValue(json(portfolio));

    await expect(apiGet('/portfolio')).resolves.toEqual(portfolio);

    const { url, init } = lastCall();
    expect(url).toBe('/api/v1/portfolio');
    expect(init?.method).toBeUndefined();
    expect(init?.body).toBeUndefined();
    expect(init?.credentials).toBe('include');
  });

  it('apiPost sends POST with the JSON body and the given headers next to Content-Type', async () => {
    fetchMock.mockResolvedValue(json({ id: 1 }, 201));

    await apiPost('/orders', {
      headers: { 'Idempotency-Key': 'k-1' },
      body: { orderbook_id: 'SIM-FJRD', side: 'BUY', quantity: 10 },
    });

    const { url, init } = lastCall();
    expect(url).toBe('/api/v1/orders');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({ orderbook_id: 'SIM-FJRD', side: 'BUY', quantity: 10 });
    const headers = new Headers(init?.headers);
    expect(headers.get('Idempotency-Key')).toBe('k-1');
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('leaves out headers whose value is undefined', async () => {
    fetchMock.mockResolvedValue(json({ id: 1 }, 201));

    await apiPost('/orders', { headers: { 'Idempotency-Key': undefined }, body: { orderbook_id: 'X', side: 'SELL', quantity: 1 } });

    expect(new Headers(lastCall().init?.headers).has('Idempotency-Key')).toBe(false);
  });

  it('apiPatch and apiDelete use their methods and fill the path', async () => {
    fetchMock.mockResolvedValueOnce(json({ id: 3, name: 'B', items: [], created_at: '2026-11-08T09:00:00Z' }));
    await apiPatch('/watchlists/{id}', { path: { id: 3 }, body: { name: 'B' } });
    expect(lastCall()).toMatchObject({ url: '/api/v1/watchlists/3', init: { method: 'PATCH' } });

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(apiDelete('/watchlists/{id}', { path: { id: 3 } })).resolves.toEqual({});
    expect(lastCall()).toMatchObject({ url: '/api/v1/watchlists/3', init: { method: 'DELETE' } });
  });

  it('keeps the auth-error event and ApiRequestError of api() on a 401', async () => {
    const listener = vi.fn();
    window.addEventListener('auth-error', listener);
    fetchMock.mockResolvedValue(json({ error: 'authentication required', code: 'UNAUTHENTICATED' }, 401));
    try {
      const error = await apiGet('/portfolio').then(
        () => null,
        (e: unknown) => e,
      );
      expect(error).toBeInstanceOf(ApiRequestError);
      expect(error).toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
      expect(listener).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener('auth-error', listener);
    }
  });

  it('only accepts paths, parameters and bodies the contract defines (compile-time)', () => {
    // Never called: tsc checks these lines, the test only has to compile.
    function contractViolations(): void {
      // @ts-expect-error not a path of the contract
      void apiGet('/portfolio/dashboard');
      // @ts-expect-error /portfolio has no POST
      void apiPost('/portfolio');
      // @ts-expect-error the {id} path parameter is required
      void apiGet('/watchlists/{id}');
      // @ts-expect-error q is required by GET /market/instruments
      void apiGet('/market/instruments', { query: {} });
      // @ts-expect-error side and quantity are required by OrderRequest
      void apiPost('/orders', { body: { orderbook_id: 'SIM-FJRD' } });
      // @ts-expect-error period must be a CandlePeriod
      void apiGet('/market/instruments/{orderbook_id}/candles', { path: { orderbook_id: 'X' }, query: { period: '2d' } });

      expectTypeOf(apiGet('/portfolio')).resolves.toEqualTypeOf<Schemas['Portfolio']>();
      expectTypeOf(apiPost('/orders', { body: { orderbook_id: 'X', side: 'BUY', quantity: 1 } })).resolves.toEqualTypeOf<
        Schemas['Order']
      >();
    }
    expect(contractViolations).toBeTypeOf('function');

    expectTypeOf<SuccessBody<Operation<'/portfolio', 'get'>>>().toEqualTypeOf<Schemas['Portfolio']>();
    expectTypeOf<SuccessBody<Operation<'/watchlists/{id}', 'delete'>>>().toEqualTypeOf<void>();
    expectTypeOf<'INSUFFICIENT_FUNDS'>().toExtend<ErrorCode>();
    expectTypeOf<'NOT_A_CODE'>().not.toExtend<ErrorCode>();
  });
});
