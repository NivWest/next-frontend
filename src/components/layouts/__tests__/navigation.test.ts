import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, isNavItemActive } from '../navigation';
import { ROUTES } from '@/lib/routes';

describe('NAV_ITEMS', () => {
  it('lists the main screens in order, ending with Markets', () => {
    expect(NAV_ITEMS.main.map((item) => [item.label, item.href])).toEqual([
      ['Dashboard', ROUTES.dashboard],
      ['Watchlist', ROUTES.watchlist],
      ['The Vault', ROUTES.vault],
      ['Orders', ROUTES.orders],
      ['Analytics', ROUTES.analytics],
      ['Markets', ROUTES.markets],
    ]);
  });

  it('pins Settings and Help center to the footer', () => {
    expect(NAV_ITEMS.footer.map((item) => [item.label, item.href])).toEqual([
      ['Settings', ROUTES.settings],
      ['Help center', ROUTES.help],
    ]);
  });

  it('gives every item an icon component', () => {
    for (const item of [...NAV_ITEMS.main, ...NAV_ITEMS.footer]) {
      expect(item.icon).toBeTruthy();
    }
  });

  it('has no Buy, Sell or Screener entries', () => {
    const labels = [...NAV_ITEMS.main, ...NAV_ITEMS.footer].map((item) => item.label);
    expect(labels).not.toContain('Buy');
    expect(labels).not.toContain('Sell');
    expect(labels).not.toContain('Screener');
  });
});

describe('isNavItemActive', () => {
  it('matches the exact path', () => {
    expect(isNavItemActive('/markets', '/markets')).toBe(true);
    expect(isNavItemActive('/dashboard', '/dashboard')).toBe(true);
  });

  it('matches sub-paths', () => {
    expect(isNavItemActive('/markets/SIM-1', '/markets')).toBe(true);
    expect(isNavItemActive('/markets/SIM-1/chart', '/markets')).toBe(true);
  });

  it('does not match a path that only shares a prefix', () => {
    expect(isNavItemActive('/marketsx', '/markets')).toBe(false);
    expect(isNavItemActive('/market', '/markets')).toBe(false);
  });

  it('does not match other routes', () => {
    expect(isNavItemActive('/orders', '/markets')).toBe(false);
    expect(isNavItemActive('/', '/dashboard')).toBe(false);
  });

  it('tolerates a trailing slash on either side', () => {
    expect(isNavItemActive('/markets/', '/markets')).toBe(true);
    expect(isNavItemActive('/markets', '/markets/')).toBe(true);
    expect(isNavItemActive('/markets/SIM-1/', '/markets')).toBe(true);
  });

  it('only activates a root href on the root path', () => {
    expect(isNavItemActive('/', '/')).toBe(true);
    expect(isNavItemActive('/orders', '/')).toBe(false);
  });
});
