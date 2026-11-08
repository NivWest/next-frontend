import { create } from 'zustand';
import { api } from '@/lib/api';
import type { DashboardResponse } from '@/features/portfolio/types';

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
  fetchDashboard: () => Promise<void>;
}

// Watchlists live in src/features/watchlist/store/useWatchlistStore.ts (story NW-06).

export const usePortfolioStore = create<PortfolioState>((set) => ({
  cash: 0,
  portfolioValue: 0,
  holdings: [],

  fetchDashboard: async () => {
    try {
      const data = await api<DashboardResponse>('portfolio/dashboard');
      
      const posArray = data.positions || [];
      const holdings: Holding[] = posArray.map((pos) => ({
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

    } catch (e) {
      console.error('Failed to fetch dashboard', e);
    }
  }
}));
