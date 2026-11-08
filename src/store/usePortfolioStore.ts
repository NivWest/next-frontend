import { create } from 'zustand';
import { getPortfolio } from '@/features/portfolio/api/portfolio';
import type { Portfolio } from '@/features/portfolio/types';

/** Lifecycle of the GET /portfolio request: `idle` before the first fetch. */
export type PortfolioStatus = 'idle' | 'loading' | 'ready' | 'error';

interface PortfolioState {
  /** Last portfolio loaded from GET /portfolio; null until the first success. */
  portfolio: Portfolio | null;
  portfolioStatus: PortfolioStatus;
  /** Loads the portfolio. A failure sets `error` and keeps the last portfolio. */
  fetchPortfolio: () => Promise<void>;
}

// Watchlists live in src/features/watchlist/store/useWatchlistStore.ts (story NW-06).

export const usePortfolioStore = create<PortfolioState>((set) => ({
  portfolio: null,
  portfolioStatus: 'idle',

  fetchPortfolio: async (): Promise<void> => {
    set({ portfolioStatus: 'loading' });
    try {
      const portfolio = await getPortfolio();
      set({ portfolio, portfolioStatus: 'ready' });
    } catch (e) {
      console.error('Failed to fetch portfolio', e);
      set({ portfolioStatus: 'error' });
    }
  },
}));
