'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getInstrumentDetails } from '@/features/markets/api/market';
import { periodChange, type PeriodChange } from '@/features/markets/candles';
import { PriceChart } from '@/features/markets/components/PriceChart';
import { SimulatedBadge } from '@/features/markets/components/SimulatedBadge';
import {
  CANDLE_PERIODS,
  DEFAULT_CANDLE_PERIOD,
  DEFAULT_CHART_INSTRUMENT,
  isSimulatedInstrument,
  type Candle,
  type CandlePeriod,
  type InstrumentDetails,
} from '@/features/markets/types';
import { formatMoney, formatPercent } from '@/lib/format';
import { instrumentHref } from '@/lib/routes';

interface AssetChartProps {
  /** Instrument to chart; the dashboard uses the default until portfolios pick their own (NW-05). */
  orderbookId?: string;
}

/** Details fetch result, tagged with its id so a new id reads as "loading" during render. */
type DetailsResult = { id: string; ok: true; details: InstrumentDetails } | { id: string; ok: false };

/** Change of the period PriceChart last loaded, tagged with its id. */
interface ChangeResult {
  id: string;
  period: CandlePeriod;
  change: PeriodChange | null;
}

function periodLabel(period: CandlePeriod): string {
  return CANDLE_PERIODS.find((option) => option.value === period)?.label ?? period;
}

/** `+12.50 SEK (+1.25%)`; a negative change keeps formatMoney's own minus sign. */
function formatChange(change: PeriodChange, currency: string): string {
  const money = formatMoney(change.absolute, currency);
  const signedMoney = change.absolute > 0 && !money.startsWith('0.00') ? `+${money}` : money;
  return `${signedMoney} (${formatPercent(change.percent)})`;
}

export function AssetChart({ orderbookId = DEFAULT_CHART_INSTRUMENT }: AssetChartProps) {
  const [detailsResult, setDetailsResult] = useState<DetailsResult | null>(null);
  const [changeResult, setChangeResult] = useState<ChangeResult | null>(null);

  useEffect(() => {
    let active = true;
    getInstrumentDetails(orderbookId)
      .then((details) => {
        if (active) setDetailsResult({ id: orderbookId, ok: true, details });
      })
      .catch((e: unknown) => {
        console.error(e);
        if (active) setDetailsResult({ id: orderbookId, ok: false });
      });
    return () => {
      active = false;
    };
  }, [orderbookId]);

  const current = detailsResult && detailsResult.id === orderbookId ? detailsResult : null;
  const details = current?.ok ? current.details : null;
  const loadingDetails = current === null;
  const currency = details?.currency;
  const change = changeResult && changeResult.id === orderbookId ? changeResult : null;

  function handleCandles(candles: Candle[], period: CandlePeriod): void {
    setChangeResult({ id: orderbookId, period, change: periodChange(candles) });
  }

  return (
    <section
      aria-label="Asset chart"
      className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-5 flex flex-col h-full shadow-sm"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center shrink-0" aria-hidden="true">
          <div className="w-4 h-4 bg-green-500 rounded-sm" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-white font-semibold truncate">
              {details ? (
                details.symbol
              ) : (
                <Link href={instrumentHref(orderbookId)} className="hover:underline">
                  {orderbookId}
                </Link>
              )}
            </h2>
            {isSimulatedInstrument(orderbookId) && <SimulatedBadge />}
          </div>
          <div className="text-xs text-[#a1a1aa]">
            {details ? (
              <>
                <Link href={instrumentHref(orderbookId)} className="hover:text-white hover:underline">
                  {details.name}
                </Link>
                {` · ${details.market}`}
              </>
            ) : loadingDetails ? (
              'Loading…'
            ) : null}
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {details && (
          <span className="text-3xl font-bold text-white" data-testid="asset-last-price">
            {formatMoney(details.last_price, details.currency)}
          </span>
        )}
        {change?.change && (
          <span
            data-testid="asset-period-change"
            className={`text-sm font-medium ${change.change.absolute >= 0 ? 'text-green-500' : 'text-red-500'}`}
          >
            {formatChange(change.change, currency ?? 'SEK')}
            <span className="ml-1 text-[#71717a]">{periodLabel(change.period)}</span>
          </span>
        )}
      </div>

      <PriceChart
        key={orderbookId}
        orderbookId={orderbookId}
        currency={currency}
        initialPeriod={DEFAULT_CANDLE_PERIOD}
        onCandles={handleCandles}
        className="flex-1"
      />
    </section>
  );
}
