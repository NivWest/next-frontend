import {
  BarChart3,
  HelpCircle,
  LayoutDashboard,
  LineChart,
  ListOrdered,
  Settings,
  Star,
  Vault,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ROUTES } from '@/lib/routes';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroups {
  /** Top of the sidebar: the app's main screens. */
  main: readonly NavItem[];
  /** Pinned to the bottom of the sidebar. */
  footer: readonly NavItem[];
}

export const NAV_ITEMS: NavGroups = {
  main: [
    { label: 'Dashboard', href: ROUTES.dashboard, icon: LayoutDashboard },
    { label: 'Watchlist', href: ROUTES.watchlist, icon: Star },
    { label: 'The Vault', href: ROUTES.vault, icon: Vault },
    { label: 'Orders', href: ROUTES.orders, icon: ListOrdered },
    { label: 'Analytics', href: ROUTES.analytics, icon: BarChart3 },
    { label: 'Markets', href: ROUTES.markets, icon: LineChart },
  ],
  footer: [
    { label: 'Settings', href: ROUTES.settings, icon: Settings },
    { label: 'Help center', href: ROUTES.help, icon: HelpCircle },
  ],
};

function stripTrailingSlash(path: string): string {
  return path.replace(/\/+$/, '') || '/';
}

/**
 * True when `pathname` is `href` itself or one of its sub-paths:
 * `/markets` and `/markets/SIM-1` activate `/markets`, `/marketsx` does not.
 * A trailing slash on either side is ignored.
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  const path = stripTrailingSlash(pathname);
  const base = stripTrailingSlash(href);
  if (path === base) return true;
  if (base === '/') return false;
  return path.startsWith(`${base}/`);
}
