import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { ApiRequestError } from '@/lib/api';
import {
  addWatchlistItem,
  createWatchlist,
  deleteWatchlist,
  getWatchlist,
  listWatchlists,
  removeWatchlistItem,
  renameWatchlist,
} from '../api/watchlists';
import type { Watchlist, WatchlistItem } from '../types';

type FetchMock = Mock<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>;

const item: WatchlistItem = {
  orderbook_id: 'SIM-NVE',
  symbol: 'NVE',
  name: 'Nordvik Energy',
  last_price: 100,
  change_percent: -0.42,
  added_at: '2026-11-08T09:00:05Z',
};
const energy: Watchlist = { id: 7, name: 'Energy', items: [item], created_at: '2026-11-08T09:00:00Z' };

let fetchMock: FetchMock;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function lastCall(): { url: string; method: string | undefined; body: unknown } {
  const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return { url: String(url), method: init?.method, body: init?.body ? JSON.parse(String(init.body)) : undefined };
}

beforeEach(() => {
  fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('watchlist API client', () => {
  it('listWatchlists GETs /api/v1/watchlists and unwraps items', async () => {
    fetchMock.mockResolvedValue(json({ items: [energy], next_cursor: null }));
    await expect(listWatchlists()).resolves.toEqual([energy]);
    expect(lastCall()).toMatchObject({ url: '/api/v1/watchlists', method: undefined });
  });

  it('getWatchlist GETs one list', async () => {
    fetchMock.mockResolvedValue(json(energy));
    await expect(getWatchlist(7)).resolves.toEqual(energy);
    expect(lastCall().url).toBe('/api/v1/watchlists/7');
  });

  it('createWatchlist POSTs {name}', async () => {
    fetchMock.mockResolvedValue(json({ ...energy, items: [] }, 201));
    await createWatchlist('Energy');
    expect(lastCall()).toEqual({ url: '/api/v1/watchlists', method: 'POST', body: { name: 'Energy' } });
  });

  it('renameWatchlist PATCHes {name}', async () => {
    fetchMock.mockResolvedValue(json({ ...energy, name: 'Renewables' }));
    await expect(renameWatchlist(7, 'Renewables')).resolves.toMatchObject({ name: 'Renewables' });
    expect(lastCall()).toEqual({ url: '/api/v1/watchlists/7', method: 'PATCH', body: { name: 'Renewables' } });
  });

  it('deleteWatchlist DELETEs the list and accepts 204', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(deleteWatchlist(7)).resolves.toBeUndefined();
    expect(lastCall()).toMatchObject({ url: '/api/v1/watchlists/7', method: 'DELETE' });
  });

  it('addWatchlistItem POSTs {orderbook_id}', async () => {
    fetchMock.mockResolvedValue(json(item, 201));
    await expect(addWatchlistItem(7, 'SIM-NVE')).resolves.toEqual(item);
    expect(lastCall()).toEqual({ url: '/api/v1/watchlists/7/items', method: 'POST', body: { orderbook_id: 'SIM-NVE' } });
  });

  it('removeWatchlistItem DELETEs by encoded orderbook id', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await removeWatchlistItem(7, 'VOLV B');
    expect(lastCall()).toMatchObject({ url: '/api/v1/watchlists/7/items/VOLV%20B', method: 'DELETE' });
  });

  it('rejects with the backend code', async () => {
    fetchMock.mockResolvedValue(json({ error: 'instrument is already on this watchlist', code: 'CONFLICT' }, 409));
    const error = await addWatchlistItem(7, 'SIM-NVE').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({ status: 409, code: 'CONFLICT' });
  });
});
