import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from '../api/vault';
import { useVaultStore } from '../store/useVaultStore';
import type { Vault, VaultTransaction } from '../types';

vi.mock('../api/vault', () => ({
  getVault: vi.fn(),
  depositVault: vi.fn(),
  withdrawVault: vi.fn(),
  listVaultTransactions: vi.fn(),
}));

const api = vi.mocked(client);
const initial = useVaultStore.getState();

const mockVault: Vault = {
  balance: 20000,
  apy: 0.051,
  interest_earned_total: 10.5,
  projected_monthly_interest_on_idle_cash: 335.34,
};

const mockTx: VaultTransaction = {
  id: 1,
  type: 'DEPOSIT',
  amount: 20000,
  created_at: '2026-11-08T12:00:00Z',
};

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  useVaultStore.setState(initial, true);
});

describe('useVaultStore', () => {
  it('fetchVault loads the vault status and transactions', async () => {
    api.getVault.mockResolvedValue(mockVault);
    api.listVaultTransactions.mockResolvedValue({ items: [mockTx], next_cursor: null });

    const pending = useVaultStore.getState().fetchVault();
    expect(useVaultStore.getState().status).toBe('loading');
    await pending;

    expect(useVaultStore.getState()).toMatchObject({
      status: 'ready',
      vault: mockVault,
      transactions: [mockTx],
    });
  });

  it('deposit calls depositVault and refreshes vault status', async () => {
    api.depositVault.mockResolvedValue(mockTx);
    api.getVault.mockResolvedValue(mockVault);
    api.listVaultTransactions.mockResolvedValue({ items: [mockTx], next_cursor: null });

    const tx = await useVaultStore.getState().deposit(20000);

    expect(api.depositVault).toHaveBeenCalledWith(20000);
    expect(tx).toEqual(mockTx);
    expect(useVaultStore.getState().vault).toEqual(mockVault);
  });

  it('withdraw calls withdrawVault and refreshes vault status', async () => {
    const withdrawTx: VaultTransaction = {
      id: 2,
      type: 'WITHDRAWAL',
      amount: 5000,
      created_at: '2026-11-08T12:05:00Z',
    };
    api.withdrawVault.mockResolvedValue(withdrawTx);
    api.getVault.mockResolvedValue({ ...mockVault, balance: 15000 });
    api.listVaultTransactions.mockResolvedValue({ items: [withdrawTx, mockTx], next_cursor: null });

    const tx = await useVaultStore.getState().withdraw(5000);

    expect(api.withdrawVault).toHaveBeenCalledWith(5000);
    expect(tx).toEqual(withdrawTx);
    expect(useVaultStore.getState().vault?.balance).toBe(15000);
  });

  it('reset clears state back to initial', () => {
    useVaultStore.setState({ vault: mockVault, transactions: [mockTx], status: 'ready' });
    useVaultStore.getState().reset();
    expect(useVaultStore.getState()).toMatchObject({
      vault: null,
      transactions: [],
      status: 'idle',
      isProcessing: false,
    });
  });
});
