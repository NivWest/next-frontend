import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { getPortfolioAnalytics, getPortfolioHistory } from '../api/analytics';
import { ApiRequestError } from '@/lib/api';

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

describe('analytics API client', () => {
  it.each(['1d', '1w', '1m', 'all'] as const)('getPortfolioHistory(%s) GETs /api/v1/portfolio/history?range=%s', async (range) => {
    await expect(getPortfolioHistory(range)).resolves.toEqual({ ok: true });
    expect(String(fetchMock.mock.calls[0][0])).toBe(`/api/v1/portfolio/history?range=${range}`);
    expect(fetchMock.mock.calls[0][1]?.method).toBeUndefined();
    expect(fetchMock.mock.calls[0][1]?.credentials).toBe('include');
  });

  it('getPortfolioAnalytics GETs /api/v1/portfolio/analytics', async () => {
    await getPortfolioAnalytics();
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/v1/portfolio/analytics');
  });

  it('passes the abort signal through', async () => {
    const controller = new AbortController();
    await getPortfolioHistory('1w', controller.signal);
    expect(fetchMock.mock.calls[0][1]?.signal).toBe(controller.signal);
  });

  it('rejects with the contract error code on a 400', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'range must be one of 1d, 1w, 1m, all', code: 'VALIDATION_ERROR' }), { status: 400 }),
    );
    const error = await getPortfolioHistory('1d').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
  });
});
