// Watchlist DTOs as returned by /api/v1/watchlists.

export interface WatchlistStock {
  id: number;
  symbol: string;
  name: string;
}

export interface WatchlistItem {
  id: number;
  watchlist_id: number;
  stock_id: number;
  stock: WatchlistStock;
}

export interface Watchlist {
  id: number;
  user_id: number;
  name: string;
  items?: WatchlistItem[];
}
