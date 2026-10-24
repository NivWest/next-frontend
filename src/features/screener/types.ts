// Market data as returned by the backend's Avanza proxy (GET /api/v1/stocks/*).
// The backend passes Avanza's JSON through, so only the fields the UI reads are typed.

export interface SearchHitPrice {
  last?: number;
  currency?: string;
  todayChangePercent?: string | number;
  todayChangeDirection?: number;
}

export interface SearchHit {
  type: string;
  orderBookId: string;
  title: string;
  marketPlaceName?: string;
  price?: SearchHitPrice;
}

export interface SearchResponse {
  hits?: SearchHit[];
}

export interface StockDetails {
  /** Instrument name. The backend passes Avanza's stock-guide payload through untyped, so it may be absent. */
  name?: string;
  company?: {
    description?: string;
    ceo?: string;
    countryCode?: string;
    totalNumberOfShares?: number;
  };
  keyIndicators?: {
    priceEarningsRatio?: number;
    priceSalesRatio?: number;
    returnOnEquity?: number;
    directYield?: number;
    numberOfOwners?: number;
    marketCapital?: { value?: number; currency?: string };
  };
}

export interface ChartSeriesPoint {
  timestamp: number;
  close?: number;
  value?: number;
}

export interface ChartResponse {
  ohlc?: ChartSeriesPoint[];
  dataSeries?: ChartSeriesPoint[];
}

export interface ChartPoint {
  date: string;
  price: number;
}

/** Converts a chart response into `{date: "M/D", price}` points for recharts. */
export function toChartPoints(res: ChartResponse): ChartPoint[] {
  const series = res.ohlc ?? res.dataSeries ?? [];
  return series.map((pt) => {
    const date = new Date(pt.timestamp);
    return { date: `${date.getMonth() + 1}/${date.getDate()}`, price: pt.close || pt.value || 0 };
  });
}

/** Page heading for an instrument: its name when the details carry one, otherwise `Instrument <id>`. */
export function instrumentTitle(orderBookId: string, details?: StockDetails | null): string {
  const name = details?.name?.trim();
  return name || `Instrument ${orderBookId}`;
}
