'use client';

import { Filter, Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { StockDetailsPanel } from './StockDetailsPanel';

export function Screener() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState<{id: string, title: string} | null>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api<any>(`stocks/search?q=${encodeURIComponent(query)}`);
        if (data && data.hits) {
          const stocks = data.hits.filter((h: any) => h.type === 'STOCK').slice(0, 15);
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

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Filter className="text-white" />
          <h1 className="text-2xl font-bold text-white">Stock Screener</h1>
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
            {!loading && results.length === 0 && query.length >= 2 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-[#a1a1aa]">
                  No stocks found for "{query}".
                </td>
              </tr>
            )}
            {!loading && results.length === 0 && query.length < 2 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-[#a1a1aa]">
                  Type at least 2 characters to search Avanza API.
                </td>
              </tr>
            )}
            {!loading && results.map(stock => {
              const price = stock.price?.last || 0;
              const currency = stock.price?.currency || '';
              const changeStr = stock.price?.todayChangePercent?.toString().replace(',', '.') || '0';
              const changeVal = parseFloat(changeStr);
              const changeDir = stock.price?.todayChangeDirection || 0; // 1 up, -1 down
              
              return (
                <tr 
                  key={stock.orderBookId} 
                  className="hover:bg-[#111111] transition-colors cursor-pointer"
                  onClick={() => setSelectedStock({ id: stock.orderBookId, title: stock.title })}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{stock.title}</div>
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

      {selectedStock && (
        <StockDetailsPanel 
          orderBookId={selectedStock.id} 
          title={selectedStock.title} 
          onClose={() => setSelectedStock(null)} 
        />
      )}
    </div>
  );
}
