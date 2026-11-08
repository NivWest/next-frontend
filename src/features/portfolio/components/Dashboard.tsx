'use client';

import { useEffect } from 'react';
import { KPICards } from '@/features/portfolio/components/KPICards';
import { EquityChart } from '@/features/analytics/components/EquityChart';
import { TopMovers } from '@/features/portfolio/components/TopMovers';
import { HoldingsTable } from '@/features/portfolio/components/HoldingsTable';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { useUIStore } from '@/store/useUIStore';

export function Dashboard() {
  const fetchPortfolio = usePortfolioStore((state) => state.fetchPortfolio);
  const { isAuthenticated } = useUIStore();

  useEffect(() => {
    if (isAuthenticated) {
      void fetchPortfolio();
    }
  }, [fetchPortfolio, isAuthenticated]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Overview</h1>
      </div>

      <KPICards />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 min-h-[400px]">
          <EquityChart />
        </div>

        <div className="min-h-[400px]">
          <TopMovers />
        </div>
      </div>

      <HoldingsTable />
    </div>
  );
}
