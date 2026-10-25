import type { Candle, CandlePeriod } from './types';

/** One point of the close-price area chart. `t` is the candle start (RFC 3339 UTC), `label` its UTC display text. */
export interface ChartPoint {
  t: string;
  label: string;
  close: number;
}

/** Change over the loaded window: first candle's open to last candle's close. `percent` 1.25 means 1.25 %. */
export interface PeriodChange {
  absolute: number;
  percent: number;
}

/** Periods short enough that the time of day matters on the axis and in the tooltip. */
const INTRADAY_PERIODS: ReadonlySet<CandlePeriod> = new Set<CandlePeriod>(['1d', '1w']);

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** `MM/DD` or `MM/DD HH:mm`, always in UTC so every viewer sees the same bars. */
function formatCandleLabel(t: string, withTime: boolean): string {
  const date = new Date(t);
  if (Number.isNaN(date.getTime())) return t;
  const day = `${pad2(date.getUTCMonth() + 1)}/${pad2(date.getUTCDate())}`;
  return withTime ? `${day} ${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}` : day;
}

/** Maps candles to chart points; 1d/1w get `MM/DD HH:mm` labels, longer periods `MM/DD` (UTC). */
export function toChartPoints(candles: Candle[], period: CandlePeriod): ChartPoint[] {
  const withTime = INTRADAY_PERIODS.has(period);
  return candles.map((candle) => ({
    t: candle.t,
    label: formatCandleLabel(candle.t, withTime),
    close: candle.c,
  }));
}

/** First `o` to last `c`; null when there are no candles or the first open is 0 (percent undefined). */
export function periodChange(candles: Candle[]): PeriodChange | null {
  if (candles.length === 0) return null;
  const open = candles[0].o;
  if (open === 0) return null;
  const close = candles[candles.length - 1].c;
  const absolute = close - open;
  return { absolute, percent: (absolute / open) * 100 };
}
