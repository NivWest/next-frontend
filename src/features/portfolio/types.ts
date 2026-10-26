// Portfolio (story NW-05). Mirrors backend api/openapi.yaml#/components/schemas (Portfolio, PortfolioPosition).
// Money is SEK with 2 decimals; percentages have 2 decimals (9.62 means +9.62%).

/**
 * One open position valued at the live last price.
 * `avg_cost` includes buy commission; `market_value` = last_price × quantity;
 * `unrealized_pnl` = market_value − avg_cost × quantity; `weight` is the percent of `holdings_value`.
 */
export interface PortfolioPosition {
  orderbook_id: string;
  symbol: string;
  name: string;
  quantity: number;
  avg_cost: number;
  last_price: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  day_change_percent: number;
  weight: number;
}

/**
 * Body of GET /api/v1/portfolio. `total_equity` = cash + holdings_value.
 * `positions` is sorted by market_value desc (largest holding first); `top_movers` is at most 5 positions
 * sorted by day_change_percent desc. Both arrays are empty, never null, without positions.
 */
export interface Portfolio {
  cash: number;
  holdings_value: number;
  total_equity: number;
  unrealized_pnl: number;
  realized_pnl: number;
  positions: PortfolioPosition[];
  top_movers: PortfolioPosition[];
}

