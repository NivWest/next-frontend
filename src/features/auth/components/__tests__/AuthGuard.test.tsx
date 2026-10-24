import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthGuard } from '../AuthGuard';
import { useUIStore } from '@/store/useUIStore';

const nav = vi.hoisted(() => ({
  replace: vi.fn<(href: string) => void>(),
  pathname: '/orders',
  search: '',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: nav.replace,
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(nav.search),
}));

const initialState = useUIStore.getState();
const checkAuth = vi.fn<() => Promise<void>>();

function renderGuard() {
  return render(
    <AuthGuard>
      <h1>Orders</h1>
    </AuthGuard>,
  );
}

describe('AuthGuard', () => {
  beforeEach(() => {
    nav.replace.mockReset();
    nav.pathname = '/orders';
    nav.search = '';
    checkAuth.mockReset();
    useUIStore.setState({ checkAuth });
  });

  afterEach(() => {
    useUIStore.setState(initialState, true);
  });

  it('shows the splash and does not redirect while the session is being checked', () => {
    useUIStore.setState({ isAuthChecking: true, isAuthenticated: false });

    renderGuard();

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Orders' })).not.toBeInTheDocument();
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it('does not start the session check itself', () => {
    useUIStore.setState({ isAuthChecking: true, isAuthenticated: false });

    renderGuard();

    expect(checkAuth).not.toHaveBeenCalled();
  });

  it('renders the children for a signed-in visitor', () => {
    useUIStore.setState({ isAuthChecking: false, isAuthenticated: true });

    renderGuard();

    expect(screen.getByRole('heading', { name: 'Orders' })).toBeInTheDocument();
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it('sends an unauthenticated visitor to /login with the current path as next', () => {
    useUIStore.setState({ isAuthChecking: false, isAuthenticated: false });

    renderGuard();

    expect(nav.replace).toHaveBeenCalledWith('/login?next=%2Forders');
    expect(screen.queryByRole('heading', { name: 'Orders' })).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('keeps the query string in next', () => {
    nav.pathname = '/markets';
    nav.search = 'q=fjord';
    useUIStore.setState({ isAuthChecking: false, isAuthenticated: false });

    renderGuard();

    expect(nav.replace).toHaveBeenCalledWith('/login?next=%2Fmarkets%3Fq%3Dfjord');
  });

  it('redirects once the check finishes without a session', () => {
    useUIStore.setState({ isAuthChecking: true, isAuthenticated: false });
    renderGuard();
    expect(nav.replace).not.toHaveBeenCalled();

    act(() => {
      useUIStore.setState({ isAuthChecking: false, isAuthenticated: false });
    });

    expect(nav.replace).toHaveBeenCalledTimes(1);
    expect(nav.replace).toHaveBeenCalledWith('/login?next=%2Forders');
  });

  it('shows the children once the check finds a session', () => {
    useUIStore.setState({ isAuthChecking: true, isAuthenticated: false });
    renderGuard();

    act(() => {
      useUIStore.setState({ isAuthChecking: false, isAuthenticated: true });
    });

    expect(screen.getByRole('heading', { name: 'Orders' })).toBeInTheDocument();
    expect(nav.replace).not.toHaveBeenCalled();
  });
});
