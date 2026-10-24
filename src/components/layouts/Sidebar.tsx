'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { User, LogOut } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { TryDemoButton } from '@/features/auth/components/TryDemoButton';
import { ROUTES, marketsSearchHref } from '@/lib/routes';
import { NAV_ITEMS, isNavItemActive } from './navigation';
import type { NavItem } from './navigation';

export interface SidebarProps {
  /** Called after a navigation link is clicked or a search is submitted (the mobile drawer closes on it). */
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  const { logout, isAuthenticated, user } = useUIStore();
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleLogout = async () => {
    await logout();
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(marketsSearchHref(query));
    onNavigate?.();
  };

  // No fixed height: the parent flex container (desktop column or mobile drawer) stretches it,
  // so the bottom items stay inside the visible viewport on mobile browsers too.
  return (
    <div className="w-64 border-r border-[#27272a] min-h-0 p-4 flex flex-col bg-black text-[#a1a1aa] text-sm">
      <Link
        href={ROUTES.dashboard}
        onClick={onNavigate}
        className="flex items-center gap-2 px-2 py-4 text-white font-semibold mb-2 text-lg"
      >
        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-black text-xs" aria-hidden="true">T</div>
        TradeEdu
      </Link>

      <form role="search" onSubmit={handleSearch} className="relative mb-6">
        <input
          type="search"
          aria-label="Search markets"
          placeholder="Search tickers..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full bg-[#111111] border border-[#27272a] rounded-full py-1.5 px-4 pl-8 text-sm outline-none focus:border-zinc-500"
        />
        <svg className="w-4 h-4 absolute left-3 top-2 text-zinc-500" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </form>

      <nav aria-label="Main" className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <ul className="space-y-1">
          {NAV_ITEMS.main.map((item) => (
            <li key={item.href}>
              <NavLink item={item} active={isNavItemActive(pathname, item.href)} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>

        <ul className="mt-auto space-y-1">
          {NAV_ITEMS.footer.map((item) => (
            <li key={item.href}>
              <NavLink item={item} active={isNavItemActive(pathname, item.href)} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-4 pt-4 border-t border-[#27272a]">
        {!isAuthenticated ? (
          <div className="flex flex-col gap-2 p-2">
            <a href="/api/v1/auth/login" className="flex items-center justify-center gap-2 w-full py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 transition-colors">
              Sign in to TradeEdu
            </a>
            <TryDemoButton />
          </div>
        ) : (
          <div className="flex items-center gap-3 p-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
              <User size={16} className="text-zinc-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-white text-sm font-medium truncate">{user?.name || 'Trader'}</span>
                {user?.is_guest && (
                  <span
                    title="Guest portfolios are deleted after 24 hours"
                    className="shrink-0 px-1.5 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400 text-[10px] font-semibold leading-none cursor-help"
                  >
                    Guest
                  </span>
                )}
              </div>
              <div className="text-xs text-zinc-500 truncate">
                {user?.is_guest ? 'Demo account' : user?.email || 'Logged in'}
              </div>
            </div>
            {/* Only this button signs out, so clicking the name or the Guest badge never does. */}
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:bg-red-500/20 hover:text-red-500 transition-colors"
            >
              <LogOut size={16} aria-hidden="true" />
              <span className="sr-only">Sign out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface NavLinkProps {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}

function NavLink({ item, active, onNavigate }: NavLinkProps) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${active ? 'bg-[#27272a] text-white' : 'hover:bg-[#111111] hover:text-white'}`}
    >
      <Icon size={18} aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
}
