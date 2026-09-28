'use client';

import { usePortfolioStore } from '@/store/usePortfolioStore';
import { useUIStore } from '@/store/useUIStore';
import { Star, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';

export function Watchlist() {
  const { watchlist, removeFromWatchlist } = usePortfolioStore();
  const { isAuthenticated } = useUIStore();

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex flex-col items-center justify-center text-center mt-20">
        <Star className="text-[#a1a1aa] w-12 h-12 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Sign in to use Watchlist</h2>
        <p className="text-[#a1a1aa] mb-6">Create an account to track your favorite assets and monitor their performance.</p>
        <a href="/api/v1/auth/login" className="px-6 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400">
          Sign In
        </a>
      </div>
    );
  }

  const getMockData = (ticker: string) => {
    // Generate deterministic mock data based on ticker length
    const price = (ticker.length * 150.34) + 20;
    const change = (ticker.length % 2 === 0) ? 1.2 : -0.8;
    return { price, change };
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Star className="text-yellow-500" />
        <h1 className="text-2xl font-bold text-white">Your Watchlist</h1>
      </div>

      <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-sm overflow-hidden">
        {watchlist.length === 0 ? (
          <div className="p-12 text-center text-[#a1a1aa]">
            <p>Your watchlist is empty. Search for assets to add them here.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[#a1a1aa] bg-[#111111] border-b border-[#27272a]">
              <tr>
                <th className="px-6 py-4 font-medium">Ticker</th>
                <th className="px-6 py-4 font-medium text-right">Price</th>
                <th className="px-6 py-4 font-medium text-right">Day Change</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {watchlist.map(ticker => {
                const { price, change } = getMockData(ticker);
                return (
                  <tr key={ticker} className="hover:bg-[#111111] transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{ticker}</td>
                    <td className="px-6 py-4 text-right text-white">${price.toFixed(2)}</td>
                    <td className={`px-6 py-4 text-right flex items-center justify-end gap-1 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {change > 0 ? '+' : ''}{change.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => removeFromWatchlist(ticker)}
                        className="text-red-500 hover:text-red-400 opacity-70 hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
