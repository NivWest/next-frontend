import { create } from 'zustand';
import { useUIStore } from '@/store/useUIStore';
import * as client from '../api/watchlists';
import type { Watchlist, WatchlistItem } from '../types';

// Watchlist state (story NW-06), moved out of usePortfolioStore. Reads keep the last good lists on failure and set
// `status: 'error'`; mutations update the lists in place and reject with the `ApiRequestError` so callers can
// show a toast mapped by `watchlistErrorMessage`.

export type WatchlistStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface WatchlistState {
  /** The user's lists, oldest first, as GET /watchlists returned them. */
  watchlists: Watchlist[];
  status: WatchlistStatus;
  fetchWatchlists: () => Promise<void>;
  createWatchlist: (name: string) => Promise<Watchlist>;
  renameWatchlist: (id: number, name: string) => Promise<Watchlist>;
  deleteWatchlist: (id: number) => Promise<void>;
  addItem: (watchlistId: number, orderbookId: string) => Promise<WatchlistItem>;
  removeItem: (watchlistId: number, orderbookId: string) => Promise<void>;
  /** Forget everything, e.g. after sign-out. */
  reset: () => void;
}

function replaceList(lists: Watchlist[], id: number, update: (list: Watchlist) => Watchlist): Watchlist[] {
  return lists.map((list) => (list.id === id ? update(list) : list));
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  watchlists: [],
  status: 'idle',

  fetchWatchlists: async () => {
    set({ status: 'loading' });
    try {
      const watchlists = await client.listWatchlists();
      set({ watchlists, status: 'ready' });
    } catch (e) {
      console.error('Failed to fetch watchlists', e);
      set({ status: 'error' });
    }
  },

  createWatchlist: async (name) => {
    const created = await client.createWatchlist(name.trim());
    const list: Watchlist = { ...created, items: created.items ?? [] };
    set({ watchlists: [...get().watchlists, list] });
    return list;
  },

  renameWatchlist: async (id, name) => {
    const renamed = await client.renameWatchlist(id, name.trim());
    set({ watchlists: replaceList(get().watchlists, id, () => renamed) });
    return renamed;
  },

  deleteWatchlist: async (id) => {
    await client.deleteWatchlist(id);
    set({ watchlists: get().watchlists.filter((list) => list.id !== id) });
  },

  addItem: async (watchlistId, orderbookId) => {
    const item = await client.addWatchlistItem(watchlistId, orderbookId);
    set({
      watchlists: replaceList(get().watchlists, watchlistId, (list) => ({
        ...list,
        items: [...list.items.filter((i) => i.orderbook_id !== item.orderbook_id), item],
      })),
    });
    return item;
  },

  removeItem: async (watchlistId, orderbookId) => {
    await client.removeWatchlistItem(watchlistId, orderbookId);
    set({
      watchlists: replaceList(get().watchlists, watchlistId, (list) => ({
        ...list,
        items: list.items.filter((i) => i.orderbook_id !== orderbookId),
      })),
    });
  },

  reset: () => set({ watchlists: [], status: 'idle' }),
}));

// Lists belong to one user: forget them when the signed-in user changes (sign-out, or another guest signs in),
// so the next user never sees the previous user's lists while their own load.
useUIStore.subscribe((state, prev) => {
  if (state.user?.id !== prev.user?.id) useWatchlistStore.getState().reset();
});
