'use client';

import { Activity } from 'lucide-react';
import { useEffect, useEffectEvent, useId, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatMoney } from '@/lib/format';
import { getCandles } from '../api/market';
import { periodChange, toChartPoints } from '../candles';
import { CANDLE_PERIODS, DEFAULT_CANDLE_PERIOD, type Candle, type CandlePeriod } from '../types';

interface PriceChartProps {
  orderbookId: string;
  currency?: string;
  initialPeriod?: CandlePeriod;
  /** Called after every successful load with the candles and the period they belong to. */
  onCandles?: (candles: Candle[], period: CandlePeriod) => void;
  className?: string;
}

/**
 * Result of one fetch, tagged with the id and period it belongs to: a new id or period reads as
 * "loading" during render, so no setState runs synchronously in the effect.
 */
type LoadResult =
  | { id: string; period: CandlePeriod; ok: true; candles: Candle[] }
  | { id: string; period: CandlePeriod; ok: false };

const POSITIVE = '#22c55e';
const NEGATIVE = '#ef4444';

export function PriceChart({ orderbookId, currency, initialPeriod, onCandles, className }: PriceChartProps) {
  const [period, setPeriod] = useState<CandlePeriod>(initialPeriod ?? DEFAULT_CANDLE_PERIOD);
  const [result, setResult] = useState<LoadResult | null>(null);
  const gradientId = `price-chart-${useId().replace(/:/g, '')}`;

  const notifyCandles = useEffectEvent((candles: Candle[], loadedPeriod: CandlePeriod) => {
    onCandles?.(candles, loadedPeriod);
  });

  useEffect(() => {
    let active = true;
    getCandles(orderbookId, period)
      .then((res) => {
        if (!active) return;
        setResult({ id: orderbookId, period, ok: true, candles: res.candles });
        notifyCandles(res.candles, period);
      })
      .catch((e: unknown) => {
        console.error(e);
        if (active) setResult({ id: orderbookId, period, ok: false });
      });
    return () => {
      active = false;
    };
  }, [orderbookId, period]);

  const current = result && result.id === orderbookId && result.period === period ? result : null;

  return (
    <div className={className}>
      <div role="group" aria-label="Chart period" className="flex gap-1 mb-3">
        {CANDLE_PERIODS.map((option) => {
          const selected = option.value === period;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => setPeriod(option.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                selected ? 'bg-zinc-700 text-white' : 'text-[#a1a1aa] hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div role="img" aria-label="Price chart" className="relative h-64">
        <ChartBody current={current} currency={currency ?? 'SEK'} gradientId={gradientId} />
      </div>
    </div>
  );
}

interface ChartBodyProps {
  current: LoadResult | null;
  currency: string;
  gradientId: string;
}

function ChartBody({ current, currency, gradientId }: ChartBodyProps) {
  if (!current) {
    return (
      <div role="status" className="h-full flex flex-col items-center justify-center text-sm text-[#a1a1aa]">
        <Activity className="w-6 h-6 animate-spin mb-3" aria-hidden="true" />
        <p>Loading chart…</p>
      </div>
    );
  }

  if (!current.ok) {
    return (
      <div role="alert" className="h-full flex items-center justify-center text-sm text-red-500">
        Price data is unavailable right now.
      </div>
    );
  }

  if (current.candles.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-[#a1a1aa]">
        No price data for this period.
      </div>
    );
  }

  const points = toChartPoints(current.candles, current.period);
  const change = periodChange(current.candles);
  const color = change === null || change.absolute >= 0 ? POSITIVE : NEGATIVE;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={points} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
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
          formatter={(value: unknown) => [formatMoney(Number(value ?? 0), currency), 'Price']}
          separator=": "
        />
        <Area type="monotone" dataKey="close" stroke={color} fillOpacity={1} fill={`url(#${gradientId})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
