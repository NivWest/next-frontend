// Market data from GET /api/v1/market/* (story NW-03). The DTOs are generated from backend api/openapi.yaml
// (src/lib/api/schema.d.ts, `npm run api:gen`); only UI constants and helpers are written here.
import type { Schemas } from '@/lib/api';

/** Chart window sent as `?period=`. */
export type CandlePeriod = Schemas['CandlePeriod'];

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
export type InstrumentSummary = Schemas['InstrumentSummary'];

/** Body of GET /market/instruments?q= (`InstrumentSearchResponse`). */
export type InstrumentSearchResponse = Schemas['InstrumentSearchResponse'];

/** Body of GET /market/instruments/{id}/quote (`Quote`). `updated_at` is RFC 3339 UTC. */
export type Quote = Schemas['Quote'];

/** `KeyIndicators`: null means the provider has no value. `dividend_yield_pct` 3.25 means 3.25 %. */
export type KeyIndicators = Schemas['KeyIndicators'];

/** Body of GET /market/instruments/{id} (`InstrumentDetails`). */
export type InstrumentDetails = Schemas['InstrumentDetails'];

/** One OHLCV bar (`Candle`). `t` is the bar start, RFC 3339 UTC. */
export type Candle = Schemas['Candle'];

/** Body of GET /market/instruments/{id}/candles?period= (`CandlesResponse`). Candles ascend by `t`. */
export type CandlesResponse = Schemas['CandlesResponse'];

/** Prefix of every simulated-market orderbook id, e.g. `SIM-FJRD`. */
export const SIMULATED_ID_PREFIX = 'SIM-';

/** True for instruments of the deterministic simulated market (they get the "Simulated market data" badge). */
export function isSimulatedInstrument(orderbookId: string): boolean {
  return orderbookId.startsWith(SIMULATED_ID_PREFIX);
}

