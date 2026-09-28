import { create } from 'zustand';
import { api } from '@/lib/api';

export interface Holding {
  ticker: string;
  name: string;
  shares: number;
  price: number;
  change: string;
  trend: 'up' | 'down';
  weight: number;
  value: number;
}

interface PortfolioState {
  cash: number;
  portfolioValue: number;
  holdings: Holding[];
  watchlist: string[];
  watchlistId: number | null;
  fetchDashboard: () => Promise<void>;
  fetchWatchlists: () => Promise<void>;
  executeTrade: (ticker: string, name: string, shares: number, type: 'BUY' | 'SELL') => Promise<void>;
  addToWatchlist: (ticker: string, name?: string) => Promise<void>;
  removeFromWatchlist: (stockId: string) => Promise<void>;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  cash: 0,
  portfolioValue: 0,
  holdings: [],
  watchlist: [],
  watchlistId: null,

  fetchDashboard: async () => {
    try {
      const data = await api<any>('portfolio/dashboard');
      
      const posArray = data.positions || [];
      const holdings: Holding[] = posArray.map((pos: any) => ({
        ticker: pos.symbol,
        name: pos.stock_name,
        shares: pos.quantity,
        price: pos.current_price,
        change: pos.change_percent >= 0 ? `+${pos.change_percent}%` : `${pos.change_percent}%`,
        trend: pos.change_percent >= 0 ? 'up' : 'down',
        weight: pos.weight,
        value: pos.value,
      }));

      set({ 
        cash: data.balance, 
        portfolioValue: data.total_value,
        holdings
      });

      // Also fetch watchlists on dashboard load
      await get().fetchWatchlists();
    } catch (e) {
      console.error('Failed to fetch dashboard', e);
    }
  },

  executeTrade: async (ticker, name, shares, type) => {
    await api('orders', {
      method: 'POST',
      body: JSON.stringify({
        symbol: ticker,
        name: name,
        type: type,
        quantity: shares
      })
    });
    
    // Refresh dashboard after trade
    await get().fetchDashboard();
  },

  fetchWatchlists: async () => {
    try {
      const data = await api<any[]>('watchlists');
      if (data.length > 0) {
        const items = data[0].items || [];
        const symbols = items.map((i: any) => i.stock.symbol);
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
        const newWl = await api<any>('watchlists', {
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
