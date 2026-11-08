// Pure helpers for the analytics feature (story NW-10): metric formatting, chart points and plain-language
// explanations. Percent values are already percent (1.25 means +1.25%), as the API sends them.
import { formatPercent } from '@/lib/format';
import { MIN_DAILY_RETURNS, type EquityPoint, type HistoryRange } from './types';

/** Shown for a metric the backend cannot compute yet (null). */
export const NO_VALUE = '—';

export type MetricTone = 'positive' | 'negative' | 'neutral';

const ratioFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** `formatMetricPercent(1.25)` → `"+1.25%"`; null → `"—"`. */
export function formatMetricPercent(value: number | null): string {
  return value === null ? NO_VALUE : formatPercent(value);
}

/** Sharpe ratio with 2 decimals and no sign for gains: `1.84`, `-0.42`, `0.00`; null → `"—"`. */
export function formatRatio(value: number | null): string {
  if (value === null) return NO_VALUE;
  const text = ratioFormat.format(value);
  return text === '-0.00' ? '0.00' : text;
}

/** Colour hint judged at 2 decimals; null and 0 are neutral. */
export function metricTone(value: number | null): MetricTone {
  if (value === null) return 'neutral';
  const rounded = Math.round(value * 100) / 100;
  if (rounded > 0) return 'positive';
  if (rounded < 0) return 'negative';
  return 'neutral';
}

/** `formatDataPoints(0)` → `"0 of 5 daily returns"`: how far the account is from the risk metrics. */
export function formatDataPoints(dataPoints: number): string {
  return `${dataPoints} of ${MIN_DAILY_RETURNS} daily returns`;
}

/** Plain-language explanation of every metric card (shown as its tooltip). */
export const METRIC_EXPLANATIONS = {
  totalReturn: 'How much your account has grown or shrunk since you started with 100,000 SEK, cash included.',
  volatility:
    'How much your daily results swing, scaled to a year. Higher volatility means a bumpier ride: bigger gains and bigger losses are both more likely.',
  sharpe:
    'Return earned per unit of risk, after subtracting what a risk-free savings rate would have paid. Above 1 is good, below 0 means a savings account did better.',
  maxDrawdown:
    'The deepest fall from a previous high, measured on daily closing equity. It shows the worst loss you would have sat through.',
} as const;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Axis and tooltip text of one history point, in UTC so every viewer sees the same thing:
 * `1d` → `09:41`, `1w`/`1m` → `Nov 8, 09:00`, `all` → `Nov 8, 2026`.
 */
export function formatHistoryTime(t: string, range: HistoryRange): string {
  const date = new Date(t);
  if (Number.isNaN(date.getTime())) return t;
  const time = `${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`;
  const day = `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
  if (range === '1d') return time;
  if (range === 'all') return `${day}, ${date.getUTCFullYear()}`;
  return `${day}, ${time}`;
}

export interface EquityChartPoint {
  t: string;
  label: string;
  equity: number;
}

/** Maps history points to chart points with their range's label. */
export function toEquityChartPoints(points: EquityPoint[], range: HistoryRange): EquityChartPoint[] {
  return points.map((point) => ({ t: point.t, label: formatHistoryTime(point.t, range), equity: point.equity }));
}

export interface EquityChange {
  absolute: number;
  percent: number;
}

/** First to last point of the range; null with fewer than two points or a non-positive first equity. */
export function equityChange(points: EquityPoint[]): EquityChange | null {
  if (points.length < 2) return null;
  const first = points[0].equity;
  if (first <= 0) return null;
  const absolute = points[points.length - 1].equity - first;
  return { absolute, percent: (absolute / first) * 100 };
}
