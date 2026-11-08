// Watchlist DTOs (story NW-06). They mirror backend api/openapi.yaml (#/components/schemas/Watchlist,
// WatchlistItem, WatchlistListResponse, WatchlistNameRequest, WatchlistItemRequest); don't redefine them elsewhere.

/** One instrument on a list. `last_price`/`change_percent` are null when the backend could not get a quote. */
export interface WatchlistItem {
  orderbook_id: string;
  symbol: string;
  name: string;
  /** Last price in the instrument's currency, 2 decimals. */
  last_price: number | null;
  /** Day change in percent, 2 decimals (1.25 means +1.25%). */
  change_percent: number | null;
  /** RFC 3339 UTC. */
  added_at: string;
}

/** A named list owned by the signed-in user; items oldest first. */
export interface Watchlist {
  id: number;
  name: string;
  items: WatchlistItem[];
  /** RFC 3339 UTC. */
  created_at: string;
}

/** Body of GET /watchlists: at most MAX_WATCHLISTS lists, oldest first, never paginated. */
export interface WatchlistListResponse {
  items: Watchlist[];
  next_cursor: string | null;
}

/** Body of POST /watchlists and PATCH /watchlists/{id}. */
export interface WatchlistNameRequest {
  name: string;
}

/** Body of POST /watchlists/{id}/items. */
export interface WatchlistItemRequest {
  orderbook_id: string;
}

/** `code` values of the `{error, code}` bodies the watchlist endpoints answer with. */
export type WatchlistErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'WATCHLIST_NOT_FOUND'
  | 'WATCHLIST_ITEM_NOT_FOUND'
  | 'WATCHLIST_LIMIT_REACHED'
  | 'INSTRUMENT_NOT_FOUND'
  | 'CONFLICT'
  | 'MARKET_DATA_UNAVAILABLE';

/** Most lists one user may have; the next create is 422 WATCHLIST_LIMIT_REACHED. */
export const MAX_WATCHLISTS = 10;

/** Longest list name after trimming. */
export const MAX_WATCHLIST_NAME_LENGTH = 50;
