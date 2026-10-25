'use client';

import { Activity, ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatMoney, formatPercent } from '@/lib/format';
import { ROUTES } from '@/lib/routes';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { useUIStore } from '@/store/useUIStore';
import { OrderTicket } from '@/features/trading/components/OrderTicket';
import { getInstrumentDetails, getQuote } from '../api/market';
import {
  DEFAULT_CANDLE_PERIOD,
  isSimulatedInstrument,
  type InstrumentDetails,
  type Quote,
} from '../types';
import { PriceChart } from './PriceChart';
import { SimulatedBadge } from './SimulatedBadge';

interface InstrumentPageProps {
  orderbookId: string;
}

/** Result of one load, tagged with the id it belongs to so a new id reads as "loading" without a sync setState. */
type LoadResult =
  | { id: string; ok: true; details: InstrumentDetails; quote: Quote }
  | { id: string; ok: false };

const MISSING = '—';

const COMPACT_UNITS: ReadonlyArray<{ size: number; suffix: string }> = [
  { size: 1e12, suffix: 'T' },
  { size: 1e9, suffix: 'B' },
  { size: 1e6, suffix: 'M' },
];

/** `formatMarketCap(12_340_000_000, 'SEK')` → `"12.34B SEK"`; values under one million use `formatMoney`. */
function formatMarketCap(value: number, currency: string): string {
  const unit = COMPACT_UNITS.find(({ size }) => Math.abs(value) >= size);
  if (!unit) return formatMoney(value, currency);
  return `${(value / unit.size).toFixed(2)}${unit.suffix} ${currency}`;
}

function formatUpdatedAt(updatedAt: string): string {
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return updatedAt;
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function changeClass(value: number): string {
  if (value > 0) return 'text-green-500';
  if (value < 0) return 'text-red-500';
  return 'text-[#a1a1aa]';
}

/** Public instrument page at `/markets/<orderbookId>`: quote, order ticket, price chart, company overview and key indicators. */
export function InstrumentPage({ orderbookId }: InstrumentPageProps) {
  const [result, setResult] = useState<LoadResult | null>(null);
  const { addToWatchlist } = usePortfolioStore();
  const { addToast } = useUIStore();

  useEffect(() => {
    let isMounted = true;
    Promise.all([getInstrumentDetails(orderbookId), getQuote(orderbookId)])
      .then(([details, quote]) => {
        if (isMounted) setResult({ id: orderbookId, ok: true, details, quote });
      })
      .catch((e: unknown) => {
        console.error(e);
        if (isMounted) setResult({ id: orderbookId, ok: false });
      });
    return () => {
      isMounted = false;
    };
  }, [orderbookId]);

  const current = result?.id === orderbookId ? result : null;
  const details = current?.ok ? current.details : null;
  const title = details?.name || `Instrument ${orderbookId}`;

  const header = (
    <div className="mb-6">
      <Link
        href={ROUTES.markets}
        className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] hover:text-white transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Back to Markets
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {isSimulatedInstrument(orderbookId) && <SimulatedBadge />}
      </div>
      {details && (
        <p className="mt-1 text-sm text-[#a1a1aa]">
          {[details.symbol, details.market, details.sector].filter(Boolean).join(' · ')}
        </p>
      )}
    </div>
  );

  // The cookie banner is fixed to the bottom (full width below md, a card bottom-right from md):
  // the bottom padding lets the last section scroll above it.
  const wrapperClass = 'max-w-5xl mx-auto p-4 md:p-6 pb-64 md:pb-64';

  if (!current) {
    return (
      <div className={wrapperClass}>
        {header}
        <div className="text-[#a1a1aa] flex flex-col items-center py-16" role="status">
          <Activity className="w-8 h-8 animate-spin mb-4" />
          <p>Loading details for {title}...</p>
        </div>
      </div>
    );
  }

  if (!current.ok) {
    return (
      <div className={wrapperClass}>
        {header}
        <div role="alert" className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-6 text-sm text-red-500">
          Failed to load instrument details. Please try again later.
        </div>
      </div>
    );
  }

  const { quote } = current;
  const currency = current.details.currency || quote.currency;
  const { pe_ratio, dividend_yield_pct, market_cap } = current.details.key_indicators;
  const ticker = current.details.symbol || orderbookId;

  const handleAddWatchlist = async () => {
    try {
      await addToWatchlist(ticker, title);
      addToast(`${title} added to watchlist!`, 'success');
    } catch {
      addToast('Sign in to save to your watchlist', 'error');
    }
  };

  const indicators: ReadonlyArray<{ label: string; value: string }> = [
    { label: 'P/E Ratio', value: pe_ratio === null ? MISSING : pe_ratio.toFixed(2) },
    { label: 'Dividend Yield', value: dividend_yield_pct === null ? MISSING : `${dividend_yield_pct.toFixed(2)}%` },
    { label: 'Market Cap', value: market_cap === null ? MISSING : formatMarketCap(market_cap, currency) },
  ];

  return (
    <div className={wrapperClass}>
      {header}

      <div className="space-y-8">
        <section aria-label="Quote" className="flex flex-wrap items-end gap-x-8 gap-y-3">
          <div>
            <span className="block text-3xl font-semibold text-white">{formatMoney(quote.last, currency)}</span>
            <span className={`text-sm font-medium ${changeClass(quote.change_percent)}`}>
              {formatPercent(quote.change_percent)}
            </span>
          </div>
          <dl className="flex gap-6 text-sm">
            <div>
              <dt className="text-[#71717a]">Bid</dt>
              <dd className="text-white font-medium">{formatMoney(quote.bid, currency)}</dd>
            </div>
            <div>
              <dt className="text-[#71717a]">Ask</dt>
              <dd className="text-white font-medium">{formatMoney(quote.ask, currency)}</dd>
            </div>
          </dl>
          <p className="text-xs text-[#71717a]">
            Updated <time dateTime={quote.updated_at}>{formatUpdatedAt(quote.updated_at)}</time>
          </p>
        </section>

        <OrderTicket orderbookId={orderbookId} />

        <PriceChart orderbookId={orderbookId} currency={currency} initialPeriod={DEFAULT_CANDLE_PERIOD} />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleAddWatchlist}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Add to Watchlist
          </button>
        </div>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="text-blue-400" size={18} />
            <h2 className="text-lg font-semibold text-white">Company Overview</h2>
          </div>
          <p className="text-sm text-[#a1a1aa] leading-relaxed">
            {current.details.description || 'No description available.'}
          </p>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-green-400" size={18} />
            <h2 className="text-lg font-semibold text-white">Key Indicators</h2>
          </div>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {indicators.map(({ label, value }) => (
              <div key={label} className="bg-[#111111] p-4 rounded-xl border border-[#27272a]">
                <dt className="text-xs text-[#a1a1aa] mb-1">{label}</dt>
                <dd className="text-lg font-medium text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
