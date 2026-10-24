'use client';

import { usePortfolioStore } from '@/store/usePortfolioStore';
import { useUIStore } from '@/store/useUIStore';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { searchInstruments } from '@/features/markets/api/market';
import { formatMoney, formatPercent } from '@/lib/format';
import type { Mover } from '@/features/portfolio/types';

/** Watchlist tickers looked up at most; the widget only has room for a few rows. */
const MAX_MOVERS = 5;

/**
 * Looks up one watchlist ticker: the hit whose symbol matches it (case-insensitive), else the first hit.
 * Resolves to null when the search fails or finds nothing, so one bad ticker does not hide the others.
 */
async function lookupMover(ticker: string): Promise<Mover | null> {
  try {
    const { items } = await searchInstruments(ticker);
    const wanted = ticker.toLowerCase();
    const hit = items.find((item) => item.symbol.toLowerCase() === wanted) ?? items[0];
    if (!hit) return null;
    return { ticker, price: hit.last_price, change: hit.change_percent, currency: hit.currency };
  } catch {
    return null;
  }
}

export function TopMovers() {
  const { watchlist } = usePortfolioStore();
  const { isAuthenticated } = useUIStore();
  const [movers, setMovers] = useState<Mover[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Nothing to fetch; the render shows the signed-out / empty-watchlist state instead.
    if (!isAuthenticated || watchlist.length === 0) return;

    let cancelled = false;

    const fetchMovers = async (): Promise<void> => {
      setLoading(true);
      const quotes = await Promise.all(watchlist.slice(0, MAX_MOVERS).map(lookupMover));
      if (cancelled) return;
      setMovers(quotes.filter((q): q is Mover => q !== null).sort((a, b) => b.change - a.change));
      setLoading(false);
    };

    void fetchMovers();
    return () => {
      cancelled = true;
    };
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
          <Loader2 className="w-5 h-5 animate-spin" aria-label="Loading movers" />
        </div>
      ) : (
        <ul className="space-y-4" aria-label="Watchlist movers">
          {movers.map((mover) => (
            <li key={mover.ticker} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                </div>
                <span className="text-sm font-medium text-white">{mover.ticker}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">{formatMoney(mover.price, mover.currency)}</div>
                <div className={`text-xs ${mover.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPercent(mover.change)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
