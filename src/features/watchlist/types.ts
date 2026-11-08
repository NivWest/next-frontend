// Watchlist DTOs (story NW-06), generated from backend api/openapi.yaml (src/lib/api/schema.d.ts,
// `npm run api:gen`): Watchlist, WatchlistItem, WatchlistListResponse, WatchlistNameRequest, WatchlistItemRequest.
// Don't redefine them elsewhere.
import type { ErrorCode, Schemas } from '@/lib/api';

/** One instrument on a list. `last_price`/`change_percent` are null when the backend could not get a quote. */
export type WatchlistItem = Schemas['WatchlistItem'];

/** A named list owned by the signed-in user; items oldest first. */
export type Watchlist = Schemas['Watchlist'];

/** Body of GET /watchlists: at most MAX_WATCHLISTS lists, oldest first, never paginated. */
export type WatchlistListResponse = Schemas['WatchlistListResponse'];

/** Body of POST /watchlists and PATCH /watchlists/{id}. */
export type WatchlistNameRequest = Schemas['WatchlistNameRequest'];

/** Body of POST /watchlists/{id}/items. */
export type WatchlistItemRequest = Schemas['WatchlistItemRequest'];

/** `code` values of the `{error, code}` bodies the watchlist endpoints answer with; each must be an `ErrorCode` of the contract. */
export const WATCHLIST_ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'WATCHLIST_NOT_FOUND',
  'WATCHLIST_ITEM_NOT_FOUND',
  'WATCHLIST_LIMIT_REACHED',
  'INSTRUMENT_NOT_FOUND',
  'CONFLICT',
  'MARKET_DATA_UNAVAILABLE',
] as const satisfies readonly ErrorCode[];

export type WatchlistErrorCode = (typeof WATCHLIST_ERROR_CODES)[number];

/** Most lists one user may have; the next create is 422 WATCHLIST_LIMIT_REACHED. */
export const MAX_WATCHLISTS = 10;

/** Longest list name after trimming. */
export const MAX_WATCHLIST_NAME_LENGTH = 50;
