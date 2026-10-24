'use client';

import { Activity, ArrowLeft, Building2, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';
import { ROUTES } from '@/lib/routes';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { useUIStore } from '@/store/useUIStore';
import {
  instrumentTitle,
  toChartPoints,
  type ChartPoint,
  type ChartResponse,
  type StockDetails as StockDetailsData,
} from '../types';

interface StockDetailsProps {
  orderBookId: string;
}

/** Result of one fetch, tagged with the id it belongs to so a new id reads as "loading" without a sync setState. */
type FetchResult =
  | { id: string; ok: true; details: StockDetailsData; chartData: ChartPoint[] }
  | { id: string; ok: false };

export function StockDetails({ orderBookId }: StockDetailsProps) {
  const [result, setResult] = useState<FetchResult | null>(null);
  const { addToWatchlist } = usePortfolioStore();
  const { addToast } = useUIStore();

  useEffect(() => {
    let isMounted = true;
    const id = encodeURIComponent(orderBookId);
    Promise.all([
      api<StockDetailsData>(`stocks/details?orderbookID=${id}`),
      api<ChartResponse>(`stocks/chart?orderbookID=${id}&timePeriod=one_month`),
    ])
      .then(([detailsRes, chartRes]) => {
        if (isMounted) {
          setResult({ id: orderBookId, ok: true, details: detailsRes, chartData: toChartPoints(chartRes) });
        }
      })
      .catch((e: unknown) => {
        console.error(e);
        if (isMounted) setResult({ id: orderBookId, ok: false });
      });
    return () => {
      isMounted = false;
    };
  }, [orderBookId]);

  const current = result?.id === orderBookId ? result : null;
  const details = current?.ok ? current.details : null;
  const title = instrumentTitle(orderBookId, details);

  const header = (
    <div className="mb-6">
      <Link
        href={ROUTES.markets}
        className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] hover:text-white transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Back to Markets
      </Link>
      <h1 className="text-2xl font-bold text-white">{title}</h1>
    </div>
  );

  if (!current) {
    return (
      <div className="max-w-5xl mx-auto p-6">
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
      <div className="max-w-5xl mx-auto p-6">
        {header}
        <div role="alert" className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-6 text-sm text-red-500">
          Failed to load stock details. Please try again later.
        </div>
      </div>
    );
  }

  const { company, keyIndicators } = current.details;
  const { chartData } = current;

  const handleAddWatchlist = async () => {
    try {
      const match = title.match(/\(([^)]+)\)$/);
      const ticker = match ? match[1] : title;
      await addToWatchlist(ticker, title);
      addToast(`${title} added to watchlist!`, 'success');
    } catch {
      addToast('Sign in to save to your watchlist', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {header}

      <div className="space-y-8">
        <div className="flex gap-3">
          <button onClick={handleAddWatchlist} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-lg transition-colors">
            Add to Watchlist
          </button>
          <button className="flex-1 bg-green-500 hover:bg-green-400 text-black font-medium py-3 rounded-lg transition-colors" onClick={() => addToast('Trading features coming soon', 'info')}>
            Trade Asset
          </button>
        </div>

        {chartData.length > 0 && (
          <section className="h-48 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: unknown) => [`$${Number(value ?? 0).toFixed(2)}`, 'Price']}
                  separator=": "
                />
                <Area type="monotone" dataKey="price" stroke="#22c55e" fillOpacity={1} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          </section>
        )}

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="text-blue-400" size={18} />
            <h2 className="text-lg font-semibold text-white">Company Overview</h2>
          </div>
          <p className="text-sm text-[#a1a1aa] leading-relaxed mb-4">
            {company?.description || 'No description available.'}
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {company?.ceo && (
              <div>
                <span className="block text-[#71717a]">CEO</span>
                <span className="text-white font-medium">{company.ceo}</span>
              </div>
            )}
            {company?.countryCode && (
              <div>
                <span className="block text-[#71717a]">Country</span>
                <span className="text-white font-medium">{company.countryCode}</span>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-green-400" size={18} />
            <h2 className="text-lg font-semibold text-white">Key Indicators</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#111111] p-4 rounded-xl border border-[#27272a]">
              <span className="block text-xs text-[#a1a1aa] mb-1">P/E Ratio</span>
              <span className="text-lg font-medium text-white">{keyIndicators?.priceEarningsRatio?.toFixed(2) || '---'}</span>
            </div>
            <div className="bg-[#111111] p-4 rounded-xl border border-[#27272a]">
              <span className="block text-xs text-[#a1a1aa] mb-1">P/S Ratio</span>
              <span className="text-lg font-medium text-white">{keyIndicators?.priceSalesRatio?.toFixed(2) || '---'}</span>
            </div>
            <div className="bg-[#111111] p-4 rounded-xl border border-[#27272a]">
              <span className="block text-xs text-[#a1a1aa] mb-1">ROE</span>
              <span className="text-lg font-medium text-white">{keyIndicators?.returnOnEquity ? (keyIndicators.returnOnEquity * 100).toFixed(2) + '%' : '---'}</span>
            </div>
            <div className="bg-[#111111] p-4 rounded-xl border border-[#27272a]">
              <span className="block text-xs text-[#a1a1aa] mb-1">Dividend Yield</span>
              <span className="text-lg font-medium text-white">{keyIndicators?.directYield ? (keyIndicators.directYield * 100).toFixed(2) + '%' : '---'}</span>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-purple-400" size={18} />
            <h2 className="text-lg font-semibold text-white">Market Data</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-[#27272a]">
              <span className="text-[#a1a1aa] text-sm">Market Cap</span>
              <span className="text-white text-sm font-medium">
                {keyIndicators?.marketCapital?.value ?
                  `${(keyIndicators.marketCapital.value / 1e9).toFixed(2)}B ${keyIndicators.marketCapital.currency}` :
                  '---'
                }
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#27272a]">
              <span className="text-[#a1a1aa] text-sm">Outstanding Shares</span>
              <span className="text-white text-sm font-medium">
                {company?.totalNumberOfShares ?
                  (company.totalNumberOfShares / 1e6).toFixed(2) + 'M' :
                  '---'
                }
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#27272a]">
              <span className="text-[#a1a1aa] text-sm">Avanza Owners</span>
              <span className="text-white text-sm font-medium">
                {keyIndicators?.numberOfOwners ? keyIndicators.numberOfOwners.toLocaleString() : '---'}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
