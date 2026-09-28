'use client';

import { usePortfolioStore } from '@/store/usePortfolioStore';
import { useUIStore } from '@/store/useUIStore';

export function KPICards() {
  const { portfolioValue, cash } = usePortfolioStore();
  const { isAuthenticated } = useUIStore();

  const formattedPortfolioValue = isAuthenticated ? `$${portfolioValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '---';
  const formattedBuyingPower = isAuthenticated ? `$${cash.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '---';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KPICard 
        title="Portfolio value" 
        value={formattedPortfolioValue}
        change={isAuthenticated ? "0.0% today" : ""} 
        positive={isAuthenticated ? true : null} 
      />
      <KPICard 
        title="Day P&L" 
        value={isAuthenticated ? "$0.00" : "---"} 
        change={isAuthenticated ? "vs yesterday's close" : ""} 
        positive={isAuthenticated ? true : null} 
      />
      <KPICard 
        title="Buying power" 
        value={formattedBuyingPower} 
        change={isAuthenticated ? "available to trade" : ""} 
        positive={null} 
      />
      <KPICard 
        title="Total return" 
        value={isAuthenticated ? "$0.00" : "---"} 
        change={isAuthenticated ? "0.0% all time" : ""} 
        positive={isAuthenticated ? true : null} 
      />
    </div>
  );
}

function KPICard({ title, value, change, positive }: { title: string, value: string, change: string, positive: boolean | null }) {
  return (
    <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-4 flex flex-col justify-between h-28 shadow-sm">
      <div className="text-sm text-[#a1a1aa] font-medium">{title}</div>
      <div>
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        <div className={`text-xs flex items-center gap-1 ${positive === true ? 'text-green-500' : positive === false ? 'text-red-500' : 'text-[#a1a1aa]'}`}>
          {positive === true && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>}
          {change}
        </div>
      </div>
    </div>
  );
}
