// Portfolio DTOs as returned by GET /api/v1/portfolio/dashboard.

export interface DashboardPosition {
  stock_name: string;
  symbol: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  change_percent: number;
  value: number;
  weight: number;
}

export interface DashboardResponse {
  balance: number;
  total_value: number;
  total_unrealized: number;
  positions: DashboardPosition[] | null;
  top_movers: DashboardPosition[] | null;
}

/** One watchlist row in TopMovers: `price` in `currency`, `change` in percent (1.25 means +1.25%). */
export interface Mover {
  ticker: string;
  price: number;
  change: number;
  currency: string;
}
