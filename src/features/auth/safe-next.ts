import { ROUTES } from '@/lib/routes';

const BASE = 'http://safe-next.invalid';

/**
 * Where to send a user after sign-in. Returns `next` only when it is a
 * same-origin absolute path (`/orders`, `/markets?q=fjord`); anything else,
 * including protocol-relative URLs, schemes, control characters and /login
 * itself, falls back to the dashboard.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/')) return ROUTES.dashboard;
  if (next[1] === '/' || next[1] === '\\') return ROUTES.dashboard;
  // Browsers strip tabs/newlines and treat '\' as '/', so '/\t/evil.com' would become '//evil.com'.
  if (/[\u0000-\u001f\u007f\\]/.test(next)) return ROUTES.dashboard;

  let url: URL;
  try {
    url = new URL(next, BASE);
  } catch {
    return ROUTES.dashboard;
  }
  if (url.origin !== BASE) return ROUTES.dashboard;
  if (url.pathname === ROUTES.login || url.pathname.startsWith(`${ROUTES.login}/`)) {
    return ROUTES.dashboard;
  }
  return next;
}
