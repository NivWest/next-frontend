'use client';

import { X, ExternalLink, Activity, Users, Info, Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { useUIStore } from '@/store/useUIStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function StockDetailsPanel({ orderBookId, title, onClose }: { orderBookId: string, title: string, onClose: () => void }) {
  const [details, setDetails] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToWatchlist } = usePortfolioStore();
  const { addToast } = useUIStore();

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [detailsRes, chartRes] = await Promise.all([
          api<any>(`stocks/details?orderbookID=${orderBookId}`),
          api<any>(`stocks/chart?orderbookID=${orderBookId}&timePeriod=one_month`)
        ]);
        
        if (isMounted) {
          setDetails(detailsRes);
          
          const series = chartRes.ohlc || chartRes.dataSeries;
          if (series) {
            const formattedData = series.map((pt: any) => {
              const date = new Date(pt.timestamp);
              return {
                date: `${date.getMonth()+1}/${date.getDate()}`,
                price: pt.close || pt.value
              };
            });
            setChartData(formattedData);
          }
        }
      } catch (e) {
        console.error(e);
        if (isMounted) addToast('Failed to load stock details', 'error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [orderBookId, addToast]);

  if (loading) {
    return (
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-black border-l border-[#27272a] shadow-2xl z-50 flex items-center justify-center">
        <div className="text-[#a1a1aa] flex flex-col items-center">
          <Activity className="w-8 h-8 animate-spin mb-4" />
          <p>Loading details for {title}...</p>
        </div>
      </div>
    );
  }

  if (!details) return null;

  const { company, keyIndicators, stock } = details;

  const handleAddWatchlist = async () => {
    try {
      const match = title.match(/\(([^)]+)\)$/);
      const ticker = match ? match[1] : title;
      await addToWatchlist(ticker, title);
      addToast(`${title} added to watchlist!`, 'success');
    } catch (e) {
      addToast('Sign in to save to your watchlist', 'error');
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:max-w-md lg:max-w-lg bg-black border-l border-[#27272a] shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-200">
      <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-[#27272a] p-4 flex justify-between items-center z-10">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-[#27272a] rounded-full text-[#a1a1aa] hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="p-6 space-y-8">
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
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Price']}
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
            <h3 className="text-lg font-semibold text-white">Company Overview</h3>
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
            <h3 className="text-lg font-semibold text-white">Key Indicators</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <h3 className="text-lg font-semibold text-white">Market Data</h3>
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
