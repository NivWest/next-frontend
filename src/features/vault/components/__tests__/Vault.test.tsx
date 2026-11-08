import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Vault } from '../Vault';
import { useUIStore } from '@/store/useUIStore';
import { useVaultStore } from '../../store/useVaultStore';
import type { Vault as VaultData, VaultTransaction } from '../../types';

const initialUI = useUIStore.getState();
const initialVault = useVaultStore.getState();

const mockVaultData: VaultData = {
  balance: 20000,
  apy: 0.051,
  interest_earned_total: 15.25,
  projected_monthly_interest_on_idle_cash: 335.34,
};

const mockTransactions: VaultTransaction[] = [
  {
    id: 1,
    type: 'DEPOSIT',
    amount: 20000,
    created_at: '2026-11-08T12:00:00Z',
  },
];

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  useUIStore.setState(initialUI, true);
  useVaultStore.setState(initialVault, true);
});

describe('Vault Component', () => {
  it('renders sign-in prompt when unauthenticated', () => {
    useUIStore.setState({ isAuthenticated: false });
    render(<Vault />);

    expect(screen.getByRole('heading', { name: 'Sign in to use The Vault' })).toBeInTheDocument();
    expect(screen.getByText(/Earn a risk-free 5.10% APY/)).toBeInTheDocument();
  });

  it('renders vault balance, APY, and opportunity cost line when authenticated', () => {
    useUIStore.setState({
      isAuthenticated: true,
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        balance: 80000,
        is_guest: false,
        leaderboard_opt_in: false,
      },
    });
    useVaultStore.setState({
      vault: mockVaultData,
      transactions: mockTransactions,
      status: 'ready',
      fetchVault: vi.fn().mockResolvedValue(undefined),
    });

    render(<Vault />);

    expect(screen.getByRole('heading', { name: 'The Vault' })).toBeInTheDocument();
    expect(screen.getByText('Vault balance')).toBeInTheDocument();
    expect(screen.getAllByText('20,000.00 SEK')[0]).toBeInTheDocument();
    expect(screen.getByText('APY 5.10%')).toBeInTheDocument();
    expect(
      screen.getByText('Your idle cash could earn about 335.34 SEK per month')
    ).toBeInTheDocument();
  });

  it('allows switching between Deposit and Withdraw tabs and submitting', async () => {
    const depositMock = vi.fn().mockResolvedValue(mockTransactions[0]);
    const withdrawMock = vi.fn().mockResolvedValue({
      id: 2,
      type: 'WITHDRAWAL',
      amount: 5000,
      created_at: '2026-11-08T12:05:00Z',
    });

    useUIStore.setState({
      isAuthenticated: true,
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        balance: 80000,
        is_guest: false,
        leaderboard_opt_in: false,
      },
    });
    useVaultStore.setState({
      vault: mockVaultData,
      transactions: mockTransactions,
      status: 'ready',
      fetchVault: vi.fn().mockResolvedValue(undefined),
      deposit: depositMock,
      withdraw: withdrawMock,
    });

    render(<Vault />);

    const depositTab = screen.getByRole('tab', { name: 'Deposit' });
    const withdrawTab = screen.getByRole('tab', { name: 'Withdraw' });

    expect(depositTab).toHaveAttribute('aria-selected', 'true');
    expect(withdrawTab).toHaveAttribute('aria-selected', 'false');

    // Test deposit
    const input = screen.getByLabelText('Transfer amount');
    fireEvent.change(input, { target: { value: '1000' } });
    const depositBtn = screen.getByRole('button', { name: /Transfer to Vault/ });
    fireEvent.click(depositBtn);

    await waitFor(() => {
      expect(depositMock).toHaveBeenCalledWith(1000);
    });

    // Switch to withdraw
    fireEvent.click(withdrawTab);
    expect(withdrawTab).toHaveAttribute('aria-selected', 'true');
    expect(depositTab).toHaveAttribute('aria-selected', 'false');

    // Test withdraw
    fireEvent.change(input, { target: { value: '500' } });
    const withdrawBtn = screen.getByRole('button', { name: /Withdraw from Vault/ });
    fireEvent.click(withdrawBtn);

    await waitFor(() => {
      expect(withdrawMock).toHaveBeenCalledWith(500);
    });
  });
});
