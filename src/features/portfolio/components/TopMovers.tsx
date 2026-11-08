'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useWatchlistStore } from '@/features/watchlist/store/useWatchlistStore';
import { topMovers } from '@/features/watchlist/watchlist';
import { formatMoney, formatPercent } from '@/lib/format';
import { instrumentHref } from '@/lib/routes';

/** Rows shown at most; the widget only has room for a few. */
const MAX_MOVERS = 5;

/**
 * Dashboard widget: the watchlist instruments with the biggest day change, across all of the user's lists.
 * Prices come with the lists from GET /watchlists (story NW-06), so nothing is looked up by ticker.
 */
export function TopMovers() {
  const { isAuthenticated } = useUIStore();
  const { watchlists, status, fetchWatchlists } = useWatchlistStore();

  useEffect(() => {
    if (isAuthenticated) void fetchWatchlists();
  }, [isAuthenticated, fetchWatchlists]);

  const movers = topMovers(watchlists, MAX_MOVERS);
  const loading = (status === 'idle' || status === 'loading') && watchlists.length === 0;

  return (
    <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-5 shadow-sm h-full overflow-y-auto scrollbar-hide">
      <h3 className="text-sm font-medium text-white mb-4">Top movers (Watchlist)</h3>

      {!isAuthenticated ? (
        <div className="text-center text-[#a1a1aa] mt-8 text-sm">
          Sign in to see watchlist movers.
        </div>
      ) : loading ? (
        <div className="flex justify-center mt-8 text-[#a1a1aa]">
          <Loader2 className="w-5 h-5 animate-spin" aria-label="Loading movers" />
        </div>
      ) : movers.length === 0 ? (
        <div className="text-center text-[#a1a1aa] mt-8 text-sm">
          Your watchlist is empty.
        </div>
      ) : (
        <ul className="space-y-4" aria-label="Watchlist movers">
          {movers.map((mover) => (
            <li key={mover.orderbook_id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                </div>
                <Link href={instrumentHref(mover.orderbook_id)} className="text-sm font-medium text-white hover:underline">
                  {mover.symbol || mover.orderbook_id}
                </Link>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">{formatMoney(mover.last_price ?? 0)}</div>
                <div className={`text-xs ${(mover.change_percent ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPercent(mover.change_percent ?? 0)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
