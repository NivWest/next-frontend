'use client';

import { ArrowUpDown } from 'lucide-react';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { useUIStore } from '@/store/useUIStore';

export function HoldingsTable() {
  const { holdings, portfolioValue } = usePortfolioStore();
  const { isAuthenticated } = useUIStore();
  
  const getLogo = (ticker: string) => {
    if (ticker === 'AAPL') return <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mr-3"><svg viewBox="0 0 384 512" className="w-3.5 h-3.5 text-black" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 24 184.8 8 273.5q-9 55.2 13 125c11.1 32.6 25.9 42.9 53 42.9 27.5 0 35.7-18 67.2-18 31.5 0 39.8 18 68 18 28.9 0 42.5-12 55.4-44 14.1-34.9 20.2-61.9 20.5-64.3-1.6-1-46.1-15-46.4-64.4zM228.6 89.1c15.1-19.4 25.2-46.6 22.4-73.4-23.7 1-52.6 15.8-68.5 35.4-13.6 16.7-25 43.6-21.7 69.5 26.2 2 52.8-12.1 67.8-31.5z"/></svg></div>;
    return <div className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center mr-3"><div className="w-3 h-3 bg-green-500 rounded-sm"></div></div>;
  };

  const formattedPortfolioValue = isAuthenticated ? `$${portfolioValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '---';

  return (
    <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-[#27272a] flex justify-between items-center">
        <h3 className="text-sm font-medium text-white">Holdings</h3>
        <span className="text-xs text-[#a1a1aa]">{isAuthenticated ? holdings.length : 0} positions · {formattedPortfolioValue}</span>
      </div>
      
      <div className="overflow-x-auto">
        {holdings.length === 0 ? (
          <div className="p-12 text-center text-[#a1a1aa]">
            <p>You have no open positions. Navigate to the Screener to buy assets.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[#a1a1aa] bg-[#0a0a0a] border-b border-[#27272a]">
              <tr>
                <th className="px-4 py-3 font-medium">Asset <ArrowUpDown size={12} className="inline ml-1 opacity-50" /></th>
                <th className="px-4 py-3 font-medium text-right">Shares <ArrowUpDown size={12} className="inline ml-1 opacity-50" /></th>
                <th className="px-4 py-3 font-medium text-right">Price <ArrowUpDown size={12} className="inline ml-1 opacity-50" /></th>
                <th className="px-4 py-3 font-medium text-right">Day change <ArrowUpDown size={12} className="inline ml-1 opacity-50" /></th>
                <th className="px-4 py-3 font-medium text-center">Trend</th>
                <th className="px-4 py-3 font-medium text-right">Value <ArrowUpDown size={12} className="inline ml-1 opacity-50" /></th>
                <th className="px-4 py-3 font-medium text-right">Weight <ArrowUpDown size={12} className="inline ml-1 opacity-50" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {holdings.map((h, i) => {
                const value = h.shares * h.price;
                const weight = portfolioValue > 0 ? (value / portfolioValue) * 100 : 0;
                return (
                <tr key={i} className="hover:bg-[#111111] transition-colors">
                  <td className="px-4 py-3 flex items-center">
                    {getLogo(h.ticker)}
                    <div>
                      <div className="font-medium text-white">{h.ticker}</div>
                      <div className="text-xs text-[#a1a1aa]">{h.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-white">{h.shares}</td>
                  <td className="px-4 py-3 text-right text-white">${h.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-green-500 flex items-center justify-end gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                    {h.change}
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-16 mx-auto">
                      <svg viewBox="0 0 100 30" className="w-full h-5">
                        <polyline 
                          points={h.trend === 'up' ? "0,25 20,20 40,22 60,10 80,15 100,5" : "0,5 20,10 40,8 60,20 80,18 100,25"} 
                          fill="none" 
                          stroke={h.trend === 'up' ? "#22c55e" : "#ef4444"} 
                          strokeWidth="2"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-white">${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td className="px-4 py-3 text-right text-white">{weight.toFixed(1)}%</td>
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
