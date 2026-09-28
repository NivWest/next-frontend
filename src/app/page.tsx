'use client';

import { Sidebar } from '@/components/layouts/Sidebar';
import { KPICards } from '@/features/portfolio/components/KPICards';
import { AssetChart } from '@/features/portfolio/components/AssetChart';
import { OrderTicket } from '@/features/portfolio/components/OrderTicket';
import { TopMovers } from '@/features/portfolio/components/TopMovers';
import { HoldingsTable } from '@/features/portfolio/components/HoldingsTable';
import { Watchlist } from '@/features/watchlist/components/Watchlist';
import { Settings } from '@/features/settings/components/Settings';
import { Vault } from '@/features/vault/components/Vault';
import { Orders } from '@/features/orders/components/Orders';
import { Analytics } from '@/features/analytics/components/Analytics';
import { Screener } from '@/features/screener/components/Screener';
import { Help } from '@/features/help/components/Help';
import { Login } from '@/features/auth/components/Login';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { CookieBanner } from '@/components/ui/CookieBanner';
import { Calendar, Download } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useEffect, useState } from 'react';

export default function App() {
  const { activeView, isAuthenticated, isAuthChecking, checkAuth } = useUIStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isAuthChecking) {
    return <div className="h-screen w-full bg-black flex items-center justify-center">
      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-green-500/20 animate-pulse">T</div>
    </div>;
  }

  if (activeView === 'Login') {
    return (
      <>
        <Login />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide w-full relative">
        {(activeView === 'Dashboard' || activeView === 'Trade') && <DashboardView />}
        {activeView === 'Watchlist' && <Watchlist />}
        {activeView === 'Settings' && <Settings />}
        {activeView === 'Vault' && <Vault />}
        {activeView === 'Orders' && <Orders />}
        {activeView === 'Analytics' && <Analytics />}
        {activeView === 'Screener' && <Screener />}
        {activeView === 'Help' && <Help />}
      </main>
      
      <ToastContainer />
      <CookieBanner />
    </div>
  );
}

import { usePortfolioStore } from '@/store/usePortfolioStore';

function DashboardView() {
  const { fetchDashboard } = usePortfolioStore();
  const { isAuthenticated } = useUIStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
    }
  }, [fetchDashboard, isAuthenticated]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button className="md:hidden text-white p-2 -ml-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <h1 className="text-xl font-bold text-white">Overview</h1>
        </div>
        
        <div className="flex gap-2 md:gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-[#111111] border border-[#27272a] rounded-lg text-sm text-[#a1a1aa] hover:text-white transition-colors">
            <Calendar size={16} />
            <span className="hidden sm:inline">Aug 3 - Aug 9, 2026</span>
            <span className="sm:hidden">Date</span>
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-white text-black font-medium rounded-lg text-sm hover:bg-zinc-200 transition-colors">
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      <KPICards />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 min-h-[400px]">
          <AssetChart />
        </div>
        
        <div className="flex flex-col h-full gap-6">
          <OrderTicket />
          <div className="flex-1 min-h-0">
            <TopMovers />
          </div>
        </div>
      </div>

      <HoldingsTable />
    </div>
  );
}
