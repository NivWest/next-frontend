'use client';

import { Filter, Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { instrumentHref } from '@/lib/routes';
import type { SearchHit, SearchResponse } from '../types';

interface ScreenerProps {
  /** Initial search text, e.g. the `q` search param of /markets. Re-key the component to apply a new one. */
  initialQuery?: string;
}

export function Screener({ initialQuery = '' }: ScreenerProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Short queries show a hint instead of results (see visibleResults), so there is nothing to fetch.
    if (!query || query.length < 2) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api<SearchResponse>(`stocks/search?q=${encodeURIComponent(query)}`);
        if (data && data.hits) {
          const stocks = data.hits.filter((h) => h.type === 'STOCK').slice(0, 15);
          setResults(stocks);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 500); // debounce

    return () => clearTimeout(timer);
  }, [query]);

  const visibleResults = query.length >= 2 ? results : [];

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Filter className="text-white" />
          <h1 className="text-2xl font-bold text-white">Markets</h1>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-white rounded-lg transition-colors text-sm font-medium">
          <SlidersHorizontal size={16} />
          Filters
        </button>
      </div>

      <div className="bg-[#111111] border border-[#27272a] rounded-xl p-4 mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-[#a1a1aa]" size={18} />
          <input 
            type="text" 
            aria-label="Search markets"
            placeholder="Search by ticker, company, or sector..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#27272a] rounded-lg py-2 pl-10 pr-4 text-sm text-white outline-none focus:border-zinc-500 transition-colors"
          />
        </div>
        <select className="bg-[#0a0a0a] border border-[#27272a] rounded-lg px-4 py-2 text-sm text-white outline-none appearance-none cursor-pointer">
          <option>Sector: Technology</option>
          <option>Sector: Healthcare</option>
          <option>Sector: Finance</option>
        </select>
        <select className="bg-[#0a0a0a] border border-[#27272a] rounded-lg px-4 py-2 text-sm text-white outline-none appearance-none cursor-pointer">
          <option>Market Cap: Large (&gt;$10B)</option>
          <option>Market Cap: Mid ($2B-$10B)</option>
          <option>Market Cap: Small (&lt;$2B)</option>
        </select>
      </div>

      <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-[#a1a1aa] bg-[#111111] border-b border-[#27272a]">
            <tr>
              <th className="px-6 py-4 font-medium">Instrument</th>
              <th className="px-6 py-4 font-medium text-right">Last Price</th>
              <th className="px-6 py-4 font-medium text-right">Change (%)</th>
              <th className="px-6 py-4 font-medium text-right">Currency</th>
              <th className="px-6 py-4 font-medium text-right">Market</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272a]">
            {loading && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-[#a1a1aa]">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Searching live markets...
                </td>
              </tr>
            )}
            {!loading && visibleResults.length === 0 && query.length >= 2 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-[#a1a1aa]">
                  No stocks found for &quot;{query}&quot;.
                </td>
              </tr>
            )}
            {!loading && visibleResults.length === 0 && query.length < 2 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-[#a1a1aa]">
                  Type at least 2 characters to search Avanza API.
                </td>
              </tr>
            )}
            {!loading && visibleResults.map(stock => {
              const price = stock.price?.last || 0;
              const currency = stock.price?.currency || '';
              const changeStr = stock.price?.todayChangePercent?.toString().replace(',', '.') || '0';
              const changeDir = stock.price?.todayChangeDirection || 0; // 1 up, -1 down
              const href = instrumentHref(stock.orderBookId);

              return (
                <tr 
                  key={stock.orderBookId} 
                  className="hover:bg-[#111111] transition-colors cursor-pointer"
                  onClick={() => router.push(href)}
                >
                  <td className="px-6 py-4">
                    <Link
                      href={href}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-white hover:underline focus-visible:underline outline-none"
                    >
                      {stock.title}
                    </Link>
                    <div className="text-xs text-[#a1a1aa]">ID: {stock.orderBookId}</div>
                  </td>
                  <td className="px-6 py-4 text-right text-white">{price}</td>
                  <td className={`px-6 py-4 text-right font-medium ${changeDir > 0 ? 'text-green-500' : changeDir < 0 ? 'text-red-500' : 'text-white'}`}>
                    {changeDir > 0 ? '+' : ''}{changeStr}%
                  </td>
                  <td className="px-6 py-4 text-right text-white">{currency}</td>
                  <td className="px-6 py-4 text-right text-white">{stock.marketPlaceName}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
