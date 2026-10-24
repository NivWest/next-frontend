import { describe, expect, it } from 'vitest';
import { safeNextPath } from '../safe-next';

describe('safeNextPath', () => {
  it.each(['/orders', '/markets?q=fjord', '/markets/123#chart', '/dashboard'])('keeps %s', (next) => {
    expect(safeNextPath(next)).toBe(next);
  });

  it.each([
    ['protocol-relative URL', '//evil.com'],
    ['backslash host', '/\\evil.com'],
    ['absolute URL', 'https://evil.com'],
    ['javascript scheme', 'javascript:alert(1)'],
    ['tab-smuggled host', '/\t/evil.com'],
    ['relative path', 'orders'],
    ['empty string', ''],
    ['the login page', '/login'],
    ['the login page with a query', '/login?next=%2Forders'],
  ])('falls back to /dashboard for %s', (_label, next) => {
    expect(safeNextPath(next)).toBe('/dashboard');
  });

  it('falls back to /dashboard for null and undefined', () => {
    expect(safeNextPath(undefined)).toBe('/dashboard');
    expect(safeNextPath(null)).toBe('/dashboard');
  });
});
