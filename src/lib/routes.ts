// URL contract for the app shell (story NW-02). Every screen has its own route;
// build links with these helpers instead of hard-coding paths.

export const ROUTES = {
  dashboard: '/dashboard',
  watchlist: '/watchlist',
  vault: '/vault',
  orders: '/orders',
  analytics: '/analytics',
  settings: '/settings',
  markets: '/markets',
  help: '/help',
  login: '/login',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

/** Routes an unauthenticated visitor may open without being sent to /login. */
export const PUBLIC_ROUTES: readonly AppRoute[] = [ROUTES.markets, ROUTES.help, ROUTES.login];

/** `/markets?q=<query>`; an empty query links to plain `/markets`. */
export function marketsSearchHref(query: string): string {
  const q = query.trim();
  return q ? `${ROUTES.markets}?q=${encodeURIComponent(q)}` : ROUTES.markets;
}

/** Instrument page: `/markets/<orderbookId>`. */
export function instrumentHref(orderbookId: string): string {
  return `${ROUTES.markets}/${encodeURIComponent(orderbookId)}`;
}

/** `/login?next=<path>`, e.g. loginHref('/orders') === '/login?next=%2Forders'. */
export function loginHref(next: string): string {
  return `${ROUTES.login}?next=${encodeURIComponent(next)}`;
}
