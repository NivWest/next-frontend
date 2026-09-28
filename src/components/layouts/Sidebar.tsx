'use client';

import { LayoutDashboard, ListOrdered, BarChart3, Star, ArrowDownRight, ArrowUpRight, Filter, Settings, HelpCircle, User, Vault, LogOut } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';

export function Sidebar() {
  const { activeView, setActiveView, logout, isAuthenticated, user } = useUIStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="w-64 border-r border-[#27272a] h-screen p-4 flex flex-col bg-black text-[#a1a1aa] text-sm">
      <div className="flex items-center gap-2 px-2 py-4 text-white font-semibold mb-2 text-lg cursor-pointer" onClick={() => setActiveView('Dashboard')}>
        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-black text-xs">T</div>
        TradeEdu
      </div>

      <div className="relative mb-6">
        <input 
          type="text" 
          placeholder="Search tickers..." 
          className="w-full bg-[#111111] border border-[#27272a] rounded-full py-1.5 px-4 pl-8 text-sm outline-none focus:border-zinc-500"
        />
        <svg className="w-4 h-4 absolute left-3 top-2 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </div>

      <nav className="flex-1 space-y-1">
        <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={activeView === 'Dashboard'} onClick={() => setActiveView('Dashboard')} />
        <NavItem icon={<Star size={18} />} label="Watchlist" active={activeView === 'Watchlist'} onClick={() => setActiveView('Watchlist')} />
        <NavItem icon={<Vault size={18} />} label="The Vault" active={activeView === 'Vault'} onClick={() => setActiveView('Vault')} />
        <NavItem icon={<ListOrdered size={18} />} label="Orders" active={activeView === 'Orders'} onClick={() => setActiveView('Orders')} />
        <NavItem icon={<BarChart3 size={18} />} label="Analytics" active={activeView === 'Analytics'} onClick={() => setActiveView('Analytics')} />
        
        <div className="my-4 border-t border-[#27272a]"></div>

        <NavItem icon={<ArrowDownRight size={18} />} label="Buy" active={activeView === 'Trade'} onClick={() => setActiveView('Trade')} />
        <NavItem icon={<ArrowUpRight size={18} />} label="Sell" active={activeView === 'Trade'} onClick={() => setActiveView('Trade')} />
        <NavItem icon={<Filter size={18} />} label="Screener" active={activeView === 'Screener'} onClick={() => setActiveView('Screener')} />
      </nav>

      <div className="mt-auto space-y-1">
        <NavItem icon={<Settings size={18} />} label="Settings" active={activeView === 'Settings'} onClick={() => setActiveView('Settings')} />
        <NavItem icon={<HelpCircle size={18} />} label="Help center" active={activeView === 'Help'} onClick={() => setActiveView('Help')} rightElement={<div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span><span className="text-xs">Online</span></div>} />
      </div>

      <div className="mt-4 pt-4 border-t border-[#27272a]">
        {!isAuthenticated ? (
          <div className="flex flex-col gap-2 p-2">
            <a href="/api/v1/auth/login" className="flex items-center justify-center gap-2 w-full py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 transition-colors">
              Sign in to TradeEdu
            </a>
          </div>
        ) : (
          <div className="group relative flex items-center justify-between hover:bg-red-950/20 p-2 rounded-lg cursor-pointer transition-colors" onClick={handleLogout}>
            {/* Default State */}
            <div className="flex items-center gap-3 w-full opacity-100 group-hover:opacity-0 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                <User size={16} className="text-zinc-400" />
              </div>
              <div className="overflow-hidden">
                <div className="text-white text-sm font-medium truncate">{user?.name || 'Trader'}</div>
                <div className="text-xs text-zinc-500 truncate">{user?.email || 'Logged in'}</div>
              </div>
            </div>
            
            {/* Hover State (Logout) */}
            <div className="absolute inset-0 flex items-center gap-3 p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                <LogOut size={16} className="text-red-500" />
              </div>
              <div className="text-sm font-medium text-red-500">Sign out</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, rightElement, onClick }: { icon: React.ReactNode, label: string, active?: boolean, rightElement?: React.ReactNode, onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${active ? 'bg-[#27272a] text-white' : 'hover:bg-[#111111] hover:text-white'}`}>
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {rightElement}
    </div>
  );
}
