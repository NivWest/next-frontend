'use client';

import { Activity } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatSignedMoney } from '@/features/portfolio/selectors';
import { formatMoney, formatPercent } from '@/lib/format';
import { getPortfolioHistory } from '../api/analytics';
import { equityChange, toEquityChartPoints } from '../format';
import { DEFAULT_HISTORY_RANGE, type EquityPoint, type HistoryRange } from '../types';
import { RangeSelector } from './RangeSelector';

/** One fetch result, tagged with its range so a new range reads as "loading" during render. */
type HistoryResult = { range: HistoryRange; ok: true; points: EquityPoint[] } | { range: HistoryRange; ok: false };

const POSITIVE = '#22c55e';
const NEGATIVE = '#ef4444';

/**
 * The dashboard's equity chart (story NW-10): total equity over time from GET /portfolio/history with the
 * range buttons 1D 1W 1M All. Every range change requests that range.
 */
export function EquityChart() {
  const [range, setRange] = useState<HistoryRange>(DEFAULT_HISTORY_RANGE);
  const [result, setResult] = useState<HistoryResult | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getPortfolioHistory(range, controller.signal)
      .then((history) => setResult({ range, ok: true, points: history.points }))
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        console.error(e);
        setResult({ range, ok: false });
      });
    return () => controller.abort();
  }, [range]);

  const current = result && result.range === range ? result : null;
  const points = current?.ok ? current.points : [];
  const latest = points.length > 0 ? points[points.length - 1] : null;
  const change = equityChange(points);

  return (
    <section aria-label="Equity chart" className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-5 flex flex-col h-full shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="text-white font-semibold">Equity</h2>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mt-1">
            {latest && (
              <span className="text-2xl font-bold text-white" data-testid="equity-latest">
                {formatMoney(latest.equity)}
              </span>
            )}
            {change && (
              <span
                data-testid="equity-change"
                className={`text-sm font-medium ${change.absolute >= 0 ? 'text-green-500' : 'text-red-500'}`}
              >
                {`${formatSignedMoney(change.absolute)} (${formatPercent(change.percent)})`}
              </span>
            )}
          </div>
        </div>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      <div className="relative h-64 flex-1">
        <EquityBody current={current} />
      </div>
    </section>
  );
}

interface EquityBodyProps {
  current: HistoryResult | null;
}

/** A state message (loading, error, empty) or the chart; messages stay outside the `role="img"` element. */
function EquityBody({ current }: EquityBodyProps) {
  const gradientId = `equity-chart-${useId().replace(/:/g, '')}`;

  if (!current) {
    return (
      <div role="status" className="h-full flex flex-col items-center justify-center text-sm text-[#a1a1aa]">
        <Activity className="w-6 h-6 animate-spin mb-3" aria-hidden="true" />
        <p>Loading equity history…</p>
      </div>
    );
  }

  if (!current.ok) {
    return (
      <div role="alert" className="h-full flex items-center justify-center text-sm text-red-500">
        Equity history is unavailable right now.
      </div>
    );
  }

  if (current.points.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center text-sm text-[#a1a1aa]">
        <p>No equity history in this range yet. Your equity is recorded after every trade and every hour.</p>
      </div>
    );
  }

  const data = toEquityChartPoints(current.points, current.range);
  const change = equityChange(current.points);
  const color = change === null || change.absolute >= 0 ? POSITIVE : NEGATIVE;

  return (
    <div role="img" aria-label="Equity over time" className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" hide />
          <YAxis domain={['auto', 'auto']} hide />
          <Tooltip
            contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
            itemStyle={{ color: '#fff' }}
            formatter={(value: unknown) => [formatMoney(Number(value ?? 0)), 'Equity']}
            separator=": "
          />
          <Area type="monotone" dataKey="equity" stroke={color} fillOpacity={1} fill={`url(#${gradientId})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
