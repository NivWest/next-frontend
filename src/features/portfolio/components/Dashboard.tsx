'use client';

import { useEffect } from 'react';
import { KPICards } from '@/features/portfolio/components/KPICards';
import { AssetChart } from '@/features/portfolio/components/AssetChart';
import { TopMovers } from '@/features/portfolio/components/TopMovers';
import { HoldingsTable } from '@/features/portfolio/components/HoldingsTable';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { useUIStore } from '@/store/useUIStore';

export function Dashboard() {
  const { fetchDashboard } = usePortfolioStore();
  const { isAuthenticated } = useUIStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
    }
  }, [fetchDashboard, isAuthenticated]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Overview</h1>
      </div>

      <KPICards />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 min-h-[400px]">
          <AssetChart />
        </div>

        <div className="min-h-[400px]">
          <TopMovers />
        </div>
      </div>

      <HoldingsTable />
    </div>
  );
}
