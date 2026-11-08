// Portfolio history and risk analytics (story NW-10). Generated from backend api/openapi.yaml
// (src/lib/api/schema.d.ts, `npm run api:gen`): HistoryRange, EquityPoint, EquityHistory, AllocationSlice,
// PortfolioAnalytics. Money is SEK with 2 decimals; percentages have 2 decimals (1.25 means +1.25%).
import type { Schemas } from '@/lib/api';

/** Window of GET /portfolio/history: `1d` raw, `1w`/`1m` hourly buckets, `all` daily buckets. */
export type HistoryRange = Schemas['HistoryRange'];

/** One equity snapshot: `t` (RFC 3339 UTC) and `equity` (SEK). */
export type EquityPoint = Schemas['EquityPoint'];

/** Body of GET /api/v1/portfolio/history: the range and its points, oldest first. */
export type EquityHistory = Schemas['EquityHistory'];

/** One allocation slice: a position (label = symbol) or the cash (label "Cash", orderbook_id null). */
export type AllocationSlice = Schemas['AllocationSlice'];

/**
 * Body of GET /api/v1/portfolio/analytics. Volatility, Sharpe and drawdown are null until there are
 * `MIN_DAILY_RETURNS` daily returns (`sufficient_data`); `data_points` counts the daily returns.
 */
export type PortfolioAnalytics = Schemas['PortfolioAnalytics'];

/** Daily returns the backend needs before it computes volatility, Sharpe and drawdown. */
export const MIN_DAILY_RETURNS = 5;

/** The label of the cash slice in `allocation`. */
export const CASH_LABEL = 'Cash';

export interface HistoryRangeOption {
  value: HistoryRange;
  label: string;
}

/** Range buttons of the dashboard's equity chart, in display order. */
export const HISTORY_RANGES = [
  { value: '1d', label: '1D' },
  { value: '1w', label: '1W' },
  { value: '1m', label: '1M' },
  { value: 'all', label: 'All' },
] as const satisfies readonly HistoryRangeOption[];

export const DEFAULT_HISTORY_RANGE: HistoryRange = '1d';
