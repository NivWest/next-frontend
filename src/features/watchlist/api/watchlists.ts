import { api } from '@/lib/api';
import type {
  Watchlist,
  WatchlistItem,
  WatchlistItemRequest,
  WatchlistListResponse,
  WatchlistNameRequest,
} from '../types';

// Client for the watchlist endpoints (backend api/openapi.yaml /watchlists…, story NW-06).
// Errors reject with an `ApiRequestError` (src/lib/api.ts) whose `code` is a `WatchlistErrorCode`.

const BASE = 'watchlists';

function listPath(id: number): string {
  return `${BASE}/${id}`;
}

/** GET /watchlists — the user's lists (oldest first) with live prices. */
export async function listWatchlists(): Promise<Watchlist[]> {
  const res = await api<WatchlistListResponse>(BASE);
  return res.items ?? [];
}

/** GET /watchlists/{id}. */
export function getWatchlist(id: number): Promise<Watchlist> {
  return api<Watchlist>(listPath(id));
}

/** POST /watchlists — 201 with the new, empty list. */
export function createWatchlist(name: string): Promise<Watchlist> {
  const body: WatchlistNameRequest = { name };
  return api<Watchlist>(BASE, { method: 'POST', body: JSON.stringify(body) });
}

/** PATCH /watchlists/{id} — 200 with the renamed list. */
export function renameWatchlist(id: number, name: string): Promise<Watchlist> {
  const body: WatchlistNameRequest = { name };
  return api<Watchlist>(listPath(id), { method: 'PATCH', body: JSON.stringify(body) });
}

/** DELETE /watchlists/{id} — 204. */
export async function deleteWatchlist(id: number): Promise<void> {
  await api<unknown>(listPath(id), { method: 'DELETE' });
}

/** POST /watchlists/{id}/items — 201 with the new item and its current price. */
export function addWatchlistItem(id: number, orderbookId: string): Promise<WatchlistItem> {
  const body: WatchlistItemRequest = { orderbook_id: orderbookId };
  return api<WatchlistItem>(`${listPath(id)}/items`, { method: 'POST', body: JSON.stringify(body) });
}

/** DELETE /watchlists/{id}/items/{orderbook_id} — 204. */
export async function removeWatchlistItem(id: number, orderbookId: string): Promise<void> {
  await api<unknown>(`${listPath(id)}/items/${encodeURIComponent(orderbookId)}`, { method: 'DELETE' });
}
