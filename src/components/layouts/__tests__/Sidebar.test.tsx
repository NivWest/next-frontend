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

const initialState = useUIStore.getState();

let loginAsGuest: Mock<() => Promise<void>>;
let logout: Mock<() => Promise<void>>;

describe('Sidebar', () => {
  beforeEach(() => {
    loginAsGuest = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    logout = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    useUIStore.setState({ loginAsGuest, logout });
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
});
