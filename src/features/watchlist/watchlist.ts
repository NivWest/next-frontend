import { ApiRequestError } from '@/lib/api';
import { MAX_WATCHLISTS, MAX_WATCHLIST_NAME_LENGTH, type Watchlist, type WatchlistErrorCode, type WatchlistItem } from './types';

// Pure watchlist helpers (story NW-06): name validation that mirrors the backend, error texts by `code`,
// and the dashboard's movers.

/**
 * Mirrors the backend rule (trimmed, 1–50 characters). Returns the message to show, or null when the name is valid.
 * Counts characters like the backend (code points), so `"ö".repeat(50)` is valid.
 */
export function validateWatchlistName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed === '') return 'Enter a name for the list.';
  if ([...trimmed].length > MAX_WATCHLIST_NAME_LENGTH) {
    return `List names can be at most ${MAX_WATCHLIST_NAME_LENGTH} characters.`;
  }
  return null;
}

const MESSAGES: Partial<Record<WatchlistErrorCode, string>> = {
  WATCHLIST_LIMIT_REACHED: `You can have at most ${MAX_WATCHLISTS} watchlists. Delete one to make room.`,
  WATCHLIST_NOT_FOUND: 'That watchlist no longer exists.',
  WATCHLIST_ITEM_NOT_FOUND: 'That instrument is no longer on the list.',
  INSTRUMENT_NOT_FOUND: 'This instrument could not be found.',
  CONFLICT: 'This instrument is already on that list.',
  MARKET_DATA_UNAVAILABLE: 'Market data is unavailable right now. Please try again.',
  UNAUTHENTICATED: 'Sign in to use watchlists.',
};

/** Plain-language text for a failed watchlist request; the backend's message for validation errors. */
export function watchlistErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.code === 'VALIDATION_ERROR') return error.message;
    const known = error.code ? MESSAGES[error.code as WatchlistErrorCode] : undefined;
    if (known) return known;
  }
  return 'Something went wrong. Please try again.';
}

/** True when the request failed because the instrument is already on the list (409 CONFLICT). */
export function isDuplicateItemError(error: unknown): boolean {
  return error instanceof ApiRequestError && error.code === 'CONFLICT';
}

/**
 * Items across all lists that have a price, each instrument once, biggest day change first, at most `limit`.
 */
export function topMovers(lists: readonly Watchlist[], limit: number): WatchlistItem[] {
  const seen = new Set<string>();
  const priced: WatchlistItem[] = [];
  for (const list of lists) {
    for (const item of list.items) {
      if (seen.has(item.orderbook_id) || item.last_price === null || item.change_percent === null) continue;
      seen.add(item.orderbook_id);
      priced.push(item);
    }
  }
  return priced.sort((a, b) => (b.change_percent ?? 0) - (a.change_percent ?? 0)).slice(0, limit);
}
