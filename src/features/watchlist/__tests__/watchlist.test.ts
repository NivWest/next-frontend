import { describe, expect, it } from 'vitest';
import { ApiRequestError } from '@/lib/api';
import type { Watchlist, WatchlistItem } from '../types';
import { isDuplicateItemError, topMovers, validateWatchlistName, watchlistErrorMessage } from '../watchlist';

describe('validateWatchlistName', () => {
  it.each([
    ['Energy', null],
    ['  Energy  ', null],
    ['a'.repeat(50), null],
    ['ö'.repeat(50), null],
    [' ' + 'a'.repeat(50) + ' ', null],
    ['', 'Enter a name for the list.'],
    ['   ', 'Enter a name for the list.'],
    ['a'.repeat(51), 'List names can be at most 50 characters.'],
  ])('%j → %j', (name, expected) => {
    expect(validateWatchlistName(name)).toBe(expected);
  });
});

describe('watchlistErrorMessage', () => {
  it.each([
    ['WATCHLIST_LIMIT_REACHED', 'You can have at most 10 watchlists. Delete one to make room.'],
    ['CONFLICT', 'This instrument is already on that list.'],
    ['INSTRUMENT_NOT_FOUND', 'This instrument could not be found.'],
    ['WATCHLIST_NOT_FOUND', 'That watchlist no longer exists.'],
  ])('maps %s', (code, message) => {
    expect(watchlistErrorMessage(new ApiRequestError('raw', 400, code))).toBe(message);
  });

  it('passes the backend message through for validation errors', () => {
    expect(watchlistErrorMessage(new ApiRequestError('name must be at most 50 characters', 400, 'VALIDATION_ERROR'))).toBe(
      'name must be at most 50 characters',
    );
  });

  it('falls back to a generic message', () => {
    expect(watchlistErrorMessage(new Error('network'))).toBe('Something went wrong. Please try again.');
    expect(watchlistErrorMessage(new ApiRequestError('boom', 500, 'INTERNAL_ERROR'))).toBe('Something went wrong. Please try again.');
  });
});

describe('isDuplicateItemError', () => {
  it('is true only for CONFLICT', () => {
    expect(isDuplicateItemError(new ApiRequestError('dup', 409, 'CONFLICT'))).toBe(true);
    expect(isDuplicateItemError(new ApiRequestError('nf', 404, 'INSTRUMENT_NOT_FOUND'))).toBe(false);
    expect(isDuplicateItemError(new Error('x'))).toBe(false);
  });
});

describe('topMovers', () => {
  const item = (id: string, change: number | null, price: number | null = 10): WatchlistItem => ({
    orderbook_id: id,
    symbol: id,
    name: id,
    last_price: price,
    change_percent: change,
    added_at: '2026-11-08T09:00:00Z',
  });
  const list = (id: number, items: WatchlistItem[]): Watchlist => ({ id, name: `L${id}`, items, created_at: '' });

  it('dedupes across lists, skips unpriced items, sorts by change and limits', () => {
    const lists = [list(1, [item('A', 1), item('B', 5), item('C', null)]), list(2, [item('A', 1), item('D', -2), item('E', 3, null)])];
    expect(topMovers(lists, 2).map((i) => i.orderbook_id)).toEqual(['B', 'A']);
    expect(topMovers(lists, 10).map((i) => i.orderbook_id)).toEqual(['B', 'A', 'D']);
  });

  it('returns [] for no lists', () => {
    expect(topMovers([], 5)).toEqual([]);
  });
});
