'use client';

import { usePortfolioStore } from '@/store/usePortfolioStore';
import { useUIStore } from '@/store/useUIStore';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export function TopMovers() {
  const { watchlist } = usePortfolioStore();
  const { isAuthenticated } = useUIStore();
  const [movers, setMovers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || watchlist.length === 0) {
      setMovers([]);
      return;
    }

    const fetchMovers = async () => {
      setLoading(true);
      try {
        // Fetch all quotes in parallel
        const quotes = await Promise.all(
          watchlist.slice(0, 5).map(async (ticker) => {
            try {
              // We search for the ticker to get its orderbook ID, then get details
              // For simplicity, we just use the search endpoint which returns live prices!
              const res = await api<any>(`stocks/search?q=${ticker}`);
              const stock = res.hits?.find((h: any) => h.type === 'STOCK');
              return stock ? { ticker, price: stock.price.last, change: parseFloat(stock.price.todayChangePercent.replace(',', '.')) } : null;
            } catch {
              return null;
            }
          })
        );
        
        const validQuotes = quotes.filter(q => q !== null).sort((a, b) => b.change - a.change);
        setMovers(validQuotes);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchMovers();
  }, [watchlist, isAuthenticated]);

  return (
    <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-5 shadow-sm h-full overflow-y-auto scrollbar-hide">
      <h3 className="text-sm font-medium text-white mb-4">Top movers (Watchlist)</h3>
      
      {!isAuthenticated ? (
        <div className="text-center text-[#a1a1aa] mt-8 text-sm">
          Sign in to see watchlist movers.
        </div>
      ) : watchlist.length === 0 ? (
        <div className="text-center text-[#a1a1aa] mt-8 text-sm">
          Your watchlist is empty.
        </div>
      ) : loading ? (
        <div className="flex justify-center mt-8 text-[#a1a1aa]">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {movers.map(mover => (
            <div key={mover.ticker} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                </div>
                <span className="text-sm font-medium text-white">{mover.ticker}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">${mover.price}</div>
                <div className={`text-xs ${mover.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {mover.change > 0 ? '+' : ''}{mover.change}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
