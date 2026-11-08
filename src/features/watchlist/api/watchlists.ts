import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import type { Watchlist, WatchlistItem } from '../types';

// Client for the watchlist endpoints (backend api/openapi.yaml /watchlists…, story NW-06). Paths, parameters
// and bodies are checked against the generated contract (src/lib/api.ts, story NW-07).
// Errors reject with an `ApiRequestError` (src/lib/api.ts) whose `code` is a `WatchlistErrorCode`.

/** GET /watchlists — the user's lists (oldest first) with live prices. */
export async function listWatchlists(): Promise<Watchlist[]> {
  const res = await apiGet('/watchlists');
  return res.items ?? [];
}

/** GET /watchlists/{id}. */
export function getWatchlist(id: number): Promise<Watchlist> {
  return apiGet('/watchlists/{id}', { path: { id } });
}

/** POST /watchlists — 201 with the new, empty list. */
export function createWatchlist(name: string): Promise<Watchlist> {
  return apiPost('/watchlists', { body: { name } });
}

/** PATCH /watchlists/{id} — 200 with the renamed list. */
export function renameWatchlist(id: number, name: string): Promise<Watchlist> {
  return apiPatch('/watchlists/{id}', { path: { id }, body: { name } });
}

/** DELETE /watchlists/{id} — 204. */
export async function deleteWatchlist(id: number): Promise<void> {
  await apiDelete('/watchlists/{id}', { path: { id } });
}

/** POST /watchlists/{id}/items — 201 with the new item and its current price. */
export function addWatchlistItem(id: number, orderbookId: string): Promise<WatchlistItem> {
  return apiPost('/watchlists/{id}/items', { path: { id }, body: { orderbook_id: orderbookId } });
}

/** DELETE /watchlists/{id}/items/{orderbook_id} — 204. */
export async function removeWatchlistItem(id: number, orderbookId: string): Promise<void> {
  await apiDelete('/watchlists/{id}/items/{orderbook_id}', { path: { id, orderbook_id: orderbookId } });
}
