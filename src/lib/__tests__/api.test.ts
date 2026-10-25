import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { api, ApiRequestError } from '../api';

type FetchMock = Mock<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>;

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function rejection(promise: Promise<unknown>): Promise<ApiRequestError> {
  try {
    await promise;
  } catch (e) {
    if (e instanceof ApiRequestError) return e;
    throw e;
  }
  throw new Error('expected the request to fail');
}

let fetchMock: FetchMock;

beforeEach(() => {
  fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('api', () => {
  it('throws an ApiRequestError with the status, code and backend message on a 422', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'insufficient funds', code: 'INSUFFICIENT_FUNDS' }, 422));

    const error = await rejection(api('orders', { method: 'POST', body: '{}' }));

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApiRequestError');
    expect(error.status).toBe(422);
    expect(error.code).toBe('INSUFFICIENT_FUNDS');
    expect(error.message).toBe('insufficient funds');
  });

  it('falls back to the generic message and a null code for a non-JSON error body', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 502 }));

    const error = await rejection(api('market/instruments?q=x'));

    expect(error.status).toBe(502);
    expect(error.code).toBeNull();
    expect(error.message).toBe('An error occurred');
  });

  it('dispatches auth-error on a 401 and still throws', async () => {
    const listener = vi.fn();
    window.addEventListener('auth-error', listener);
    fetchMock.mockResolvedValue(jsonResponse({ error: 'authentication required', code: 'UNAUTHENTICATED' }, 401));

    try {
      const error = await rejection(api('user/profile'));
      expect(error.status).toBe(401);
      expect(error.code).toBe('UNAUTHENTICATED');
      expect(listener).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener('auth-error', listener);
    }
  });

  it('does not dispatch auth-error for other failures', async () => {
    const listener = vi.fn();
    window.addEventListener('auth-error', listener);
    fetchMock.mockResolvedValue(jsonResponse({ error: 'not found', code: 'INSTRUMENT_NOT_FOUND' }, 404));

    try {
      await rejection(api('orders'));
      expect(listener).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener('auth-error', listener);
    }
  });

  it('returns the parsed JSON body of a 201 and sends cookies to the /api/v1 path', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }, 201));

    await expect(api<{ id: number }>('orders', { method: 'POST' })).resolves.toEqual({ id: 1 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/v1/orders');
    expect(init?.credentials).toBe('include');
  });

  it('returns an empty object for a 204', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(api('auth/logout', { method: 'POST' })).resolves.toEqual({});
  });
});
