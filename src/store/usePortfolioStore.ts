import { create } from 'zustand';
import { api } from '@/lib/api';
import { getPortfolio } from '@/features/portfolio/api/portfolio';
import type { Portfolio } from '@/features/portfolio/types';
import type { Watchlist } from '@/features/watchlist/types';

/** Lifecycle of the GET /portfolio request: `idle` before the first fetch. */
export type PortfolioStatus = 'idle' | 'loading' | 'ready' | 'error';

interface PortfolioState {
  /** Last portfolio loaded from GET /portfolio; null until the first success. */
  portfolio: Portfolio | null;
  portfolioStatus: PortfolioStatus;
  watchlist: string[];
  watchlistId: number | null;
  /** Loads the portfolio, then the watchlists. A failure sets `error` and keeps the last portfolio. */
  fetchPortfolio: () => Promise<void>;
  fetchWatchlists: () => Promise<void>;
  addToWatchlist: (ticker: string, name?: string) => Promise<void>;
  removeFromWatchlist: (stockId: string) => Promise<void>;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  portfolio: null,
  portfolioStatus: 'idle',
  watchlist: [],
  watchlistId: null,

  fetchPortfolio: async (): Promise<void> => {
    set({ portfolioStatus: 'loading' });
    try {
      const portfolio = await getPortfolio();
      set({ portfolio, portfolioStatus: 'ready' });
    } catch (e) {
      console.error('Failed to fetch portfolio', e);
      set({ portfolioStatus: 'error' });
    }

    // The Watchlist page and TopMovers read the watchlist the dashboard load brings in.
    await get().fetchWatchlists();
  },

  fetchWatchlists: async () => {
    try {
      const data = await api<Watchlist[]>('watchlists');
      if (data.length > 0) {
        const items = data[0].items || [];
        const symbols = items.map((i) => i.stock.symbol);
        set({ watchlist: symbols, watchlistId: data[0].id });
      } else {
        set({ watchlist: [], watchlistId: null });
      }
    } catch (e) {
      console.error('Failed to fetch watchlists', e);
    }
  },

  addToWatchlist: async (ticker, name = ticker) => {
    try {
      let wlId = get().watchlistId;
      if (!wlId) {
        const newWl = await api<Watchlist>('watchlists', {
          method: 'POST',
          body: JSON.stringify({ name: 'Default' })
        });
        wlId = newWl.id;
        set({ watchlistId: wlId });
      }

      await api(`watchlists/${wlId}/items`, {
        method: 'POST',
        body: JSON.stringify({ symbol: ticker, name })
      });
      await get().fetchWatchlists();
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  removeFromWatchlist: async (stockId) => {
    const wlId = get().watchlistId;
    if (!wlId) return;
    try {
      await api(`watchlists/${wlId}/items/${stockId}`, { method: 'DELETE' });
      await get().fetchWatchlists();
    } catch (e) {
      console.error(e);
    }
  }
}));
