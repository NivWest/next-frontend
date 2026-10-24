// Market data from GET /api/v1/market/* (story NW-03). Mirrors backend api/openapi.yaml#/components/schemas.
// Replaces the Avanza-shaped src/features/screener/types.ts: the backend maps every provider into these shapes.

/** Chart window sent as `?period=`. */
export type CandlePeriod = '1d' | '1w' | '1m' | '3m' | '1y';

/** Period buttons in display order. The labels are the buttons' accessible names. */
export const CANDLE_PERIODS: ReadonlyArray<{ label: string; value: CandlePeriod }> = [
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '1Y', value: '1y' },
];

export const DEFAULT_CANDLE_PERIOD: CandlePeriod = '1m';

/** One search hit (`InstrumentSummary`). Prices are in `currency`, 2 decimals. */
export interface InstrumentSummary {
  orderbook_id: string;
  symbol: string;
  name: string;
  currency: string;
  market: string;
  last_price: number;
  change_percent: number;
}

/** Body of GET /market/instruments?q= (`InstrumentSearchResponse`). */
export interface InstrumentSearchResponse {
  items: InstrumentSummary[];
  next_cursor: string | null;
}

/** Body of GET /market/instruments/{id}/quote (`Quote`). `updated_at` is RFC 3339 UTC. */
export interface Quote {
  orderbook_id: string;
  symbol: string;
  last: number;
  bid: number;
  ask: number;
  change_percent: number;
  currency: string;
  updated_at: string;
}

/** `KeyIndicators`: null means the provider has no value. `dividend_yield_pct` 3.25 means 3.25 %. */
export interface KeyIndicators {
  pe_ratio: number | null;
  dividend_yield_pct: number | null;
  market_cap: number | null;
}

/** Body of GET /market/instruments/{id} (`InstrumentDetails`). */
export interface InstrumentDetails {
  orderbook_id: string;
  symbol: string;
  name: string;
  currency: string;
  market: string;
  sector: string;
  description: string;
  last_price: number;
  change_percent: number;
  key_indicators: KeyIndicators;
}

/** One OHLCV bar (`Candle`). `t` is the bar start, RFC 3339 UTC. */
export interface Candle {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

/** Body of GET /market/instruments/{id}/candles?period= (`CandlesResponse`). Candles ascend by `t`. */
export interface CandlesResponse {
  orderbook_id: string;
  period: CandlePeriod;
  candles: Candle[];
}

/** Prefix of every simulated-market orderbook id, e.g. `SIM-FJRD`. */
export const SIMULATED_ID_PREFIX = 'SIM-';

/** True for instruments of the deterministic simulated market (they get the "Simulated market data" badge). */
export function isSimulatedInstrument(orderbookId: string): boolean {
  return orderbookId.startsWith(SIMULATED_ID_PREFIX);
}

/** Instrument charted by the dashboard's AssetChart until portfolios pick their own (NW-05). */
export const DEFAULT_CHART_INSTRUMENT = 'SIM-FJRD';
