// Portfolio (story NW-05). Generated from backend api/openapi.yaml (src/lib/api/schema.d.ts, `npm run api:gen`):
// Portfolio, PortfolioPosition. Money is SEK with 2 decimals; percentages have 2 decimals (9.62 means +9.62%).
import type { Schemas } from '@/lib/api';

/**
 * One open position valued at the live last price.
 * `avg_cost` includes buy commission; `market_value` = last_price × quantity;
 * `unrealized_pnl` = market_value − avg_cost × quantity; `weight` is the percent of `holdings_value`.
 */
export type PortfolioPosition = Schemas['PortfolioPosition'];

/**
 * Body of GET /api/v1/portfolio. `total_equity` = cash + holdings_value.
 * `positions` is sorted by market_value desc (largest holding first); `top_movers` is at most 5 positions
 * sorted by day_change_percent desc. Both arrays are empty, never null, without positions.
 */
export type Portfolio = Schemas['Portfolio'];
