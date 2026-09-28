'use client';

import { BarChart3, TrendingUp, Activity } from 'lucide-react';
import { usePortfolioStore } from '@/store/usePortfolioStore';

export function Analytics() {
  const { portfolioValue } = usePortfolioStore();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="text-white" />
        <h1 className="text-2xl font-bold text-white">Portfolio Analytics</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-green-500" />
            <h2 className="text-lg font-medium text-white">Performance Overview</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-[#27272a]">
              <span className="text-[#a1a1aa]">YTD Return</span>
              <span className="text-green-500 font-medium">+18.4%</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-[#27272a]">
              <span className="text-[#a1a1aa]">Sharpe Ratio</span>
              <span className="text-white font-medium">1.84</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-[#27272a]">
              <span className="text-[#a1a1aa]">Max Drawdown</span>
              <span className="text-red-500 font-medium">-12.3%</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="text-blue-500" />
            <h2 className="text-lg font-medium text-white">Asset Allocation</h2>
          </div>
          <div className="relative pt-4">
            {/* Mock Donut Chart using pure CSS */}
            <div className="w-40 h-40 rounded-full mx-auto border-[16px] border-[#27272a] relative">
              <div className="absolute inset-[-16px] border-[16px] border-green-500 rounded-full opacity-80" style={{ clipPath: 'polygon(50% 50%, 50% 0, 100% 0, 100% 100%, 0 100%, 0 50%)' }}></div>
              <div className="absolute inset-[-16px] border-[16px] border-blue-500 rounded-full opacity-80" style={{ clipPath: 'polygon(50% 50%, 0 50%, 0 0, 50% 0)' }}></div>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[#a1a1aa] text-xs">Total</span>
                <span className="text-white font-bold text-sm">${(portfolioValue / 1000).toFixed(1)}k</span>
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                <span className="text-xs text-[#a1a1aa]">Tech (75%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                <span className="text-xs text-[#a1a1aa]">Cash (25%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
