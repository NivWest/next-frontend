import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { Sidebar } from '../Sidebar';
import { useUIStore } from '@/store/useUIStore';
import type { UserProfile } from '@/features/auth/types';

const guest: UserProfile = {
  id: 42,
  name: 'Guest trader',
  email: 'guest-42@demo.local',
  role: 'guest',
  balance: 100000,
  is_guest: true,
};

const member: UserProfile = {
  id: 7,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  role: 'member',
  balance: 100000,
  is_guest: false,
};

const navigation = vi.hoisted(() => ({
  pathname: '/dashboard',
  push: vi.fn<(href: string) => void>(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({
    push: navigation.push,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const initialState = useUIStore.getState();

let loginAsGuest: Mock<() => Promise<void>>;
let logout: Mock<() => Promise<void>>;

describe('Sidebar', () => {
  beforeEach(() => {
    loginAsGuest = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    logout = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    useUIStore.setState({ loginAsGuest, logout });
    navigation.pathname = '/dashboard';
    navigation.push.mockReset();
  });

  afterEach(() => {
    useUIStore.setState(initialState, true);
  });

  describe('when unauthenticated', () => {
    beforeEach(() => {
      useUIStore.setState({ isAuthenticated: false, user: null });
    });

    it('shows "Try the demo" under the sign-in link', () => {
      render(<Sidebar />);

      expect(screen.getByRole('link', { name: 'Sign in to TradeEdu' })).toBeInTheDocument();
      const demo = screen.getByRole('button', { name: 'Try the demo' });
      expect(demo.closest('a')).toBeNull();
    });

    it('starts a guest session when "Try the demo" is clicked', async () => {
      render(<Sidebar />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Try the demo' }));
      });

      expect(loginAsGuest).toHaveBeenCalledTimes(1);
    });
  });

  describe('when signed in as a guest', () => {
    beforeEach(() => {
      useUIStore.setState({ isAuthenticated: true, user: guest });
    });

    it('shows the guest name, a "Guest" badge with the retention tooltip and "Demo account"', () => {
      render(<Sidebar />);

      expect(screen.getByText('Guest trader')).toBeInTheDocument();
      const badge = screen.getByText('Guest', { exact: true });
      expect(badge).toHaveAttribute('title', 'Guest portfolios are deleted after 24 hours');
      expect(screen.getByText('Demo account')).toBeInTheDocument();
      expect(screen.queryByText(guest.email)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Try the demo' })).not.toBeInTheDocument();
    });

    it('does not sign out when the badge or the name is clicked', () => {
      render(<Sidebar />);

      fireEvent.click(screen.getByText('Guest', { exact: true }));
      fireEvent.click(screen.getByText('Guest trader'));

      expect(logout).not.toHaveBeenCalled();
    });

    it('signs out from the sign-out button', async () => {
      render(<Sidebar />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
      });

      expect(logout).toHaveBeenCalledTimes(1);
    });
  });

  describe('when signed in as a member', () => {
    beforeEach(() => {
      useUIStore.setState({ isAuthenticated: true, user: member });
    });

    it('shows the name and email without a Guest badge', () => {
      render(<Sidebar />);

      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
      expect(screen.getByText('ada@example.com')).toBeInTheDocument();
      expect(screen.queryByText('Guest', { exact: true })).not.toBeInTheDocument();
      expect(screen.queryByTitle('Guest portfolios are deleted after 24 hours')).not.toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    beforeEach(() => {
      useUIStore.setState({ isAuthenticated: true, user: guest });
    });

    it('renders every item as a link to its route', () => {
      render(<Sidebar />);

      const expected: Array<[string, string]> = [
        ['Dashboard', '/dashboard'],
        ['Watchlist', '/watchlist'],
        ['The Vault', '/vault'],
        ['Orders', '/orders'],
        ['Analytics', '/analytics'],
        ['Markets', '/markets'],
        ['Settings', '/settings'],
        ['Help center', '/help'],
      ];
      for (const [name, href] of expected) {
        expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
      }
      expect(screen.getByRole('link', { name: /TradeEdu/ })).toHaveAttribute('href', '/dashboard');
    });

    it('marks only the active link with aria-current="page"', () => {
      navigation.pathname = '/orders';
      render(<Sidebar />);

      expect(screen.getByRole('link', { name: 'Orders' })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
      expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    });

    it('keeps Markets active on an instrument page', () => {
      navigation.pathname = '/markets/SIM-1';
      render(<Sidebar />);

      expect(screen.getByRole('link', { name: 'Markets' })).toHaveAttribute('aria-current', 'page');
    });

    it('no longer shows Buy, Sell, Screener or the "Online" badge', () => {
      render(<Sidebar />);

      expect(screen.queryByText('Buy')).not.toBeInTheDocument();
      expect(screen.queryByText('Sell')).not.toBeInTheDocument();
      expect(screen.queryByText('Screener')).not.toBeInTheDocument();
      expect(screen.queryByText('Online')).not.toBeInTheDocument();
    });

    it('calls onNavigate when a link is clicked', () => {
      const onNavigate = vi.fn();
      // jsdom cannot follow the link; stop the default action after React has handled the click.
      const stopNavigation = (event: MouseEvent) => event.preventDefault();
      document.addEventListener('click', stopNavigation);
      render(<Sidebar onNavigate={onNavigate} />);

      fireEvent.click(screen.getByRole('link', { name: 'Watchlist' }));
      document.removeEventListener('click', stopNavigation);

      expect(onNavigate).toHaveBeenCalledTimes(1);
    });
  });

  describe('search', () => {
    it('is a search landmark with a labelled search input', () => {
      render(<Sidebar />);

      const form = screen.getByRole('search');
      const input = screen.getByRole('searchbox', { name: 'Search markets' });
      expect(form).toContainElement(input);
      expect(input).toHaveAttribute('type', 'search');
      expect(input).toHaveAttribute('placeholder', 'Search tickers...');
    });

    it('navigates to /markets?q=<query> on submit and calls onNavigate', () => {
      const onNavigate = vi.fn();
      render(<Sidebar onNavigate={onNavigate} />);

      const input = screen.getByRole('searchbox', { name: 'Search markets' });
      fireEvent.change(input, { target: { value: 'fjord' } });
      fireEvent.submit(screen.getByRole('search'));

      expect(navigation.push).toHaveBeenCalledWith('/markets?q=fjord');
      expect(onNavigate).toHaveBeenCalledTimes(1);
    });

    it('navigates to plain /markets for an empty query', () => {
      render(<Sidebar />);

      fireEvent.submit(screen.getByRole('search'));

      expect(navigation.push).toHaveBeenCalledWith('/markets');
    });
  });
});
