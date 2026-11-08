import { create } from 'zustand';
import { useUIStore } from '@/store/useUIStore';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import * as client from '../api/vault';
import type { Vault, VaultTransaction } from '../types';

export type VaultStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface VaultState {
  vault: Vault | null;
  transactions: VaultTransaction[];
  status: VaultStatus;
  isProcessing: boolean;

  fetchVault: () => Promise<void>;
  deposit: (amount: number) => Promise<VaultTransaction>;
  withdraw: (amount: number) => Promise<VaultTransaction>;
  reset: () => void;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  vault: null,
  transactions: [],
  status: 'idle',
  isProcessing: false,

  fetchVault: async () => {
    set({ status: 'loading' });
    try {
      const [vault, txResponse] = await Promise.all([
        client.getVault(),
        client.listVaultTransactions(),
      ]);
      set({ vault, transactions: txResponse.items, status: 'ready' });
    } catch (e) {
      console.error('Failed to fetch vault', e);
      set({ status: 'error' });
    }
  },

  deposit: async (amount: number) => {
    set({ isProcessing: true });
    try {
      const tx = await client.depositVault(amount);
      await get().fetchVault();
      useUIStore.getState().checkAuth().catch(() => {});
      usePortfolioStore.getState().fetchPortfolio().catch(() => {});
      return tx;
    } finally {
      set({ isProcessing: false });
    }
  },

  withdraw: async (amount: number) => {
    set({ isProcessing: true });
    try {
      const tx = await client.withdrawVault(amount);
      await get().fetchVault();
      useUIStore.getState().checkAuth().catch(() => {});
      usePortfolioStore.getState().fetchPortfolio().catch(() => {});
      return tx;
    } finally {
      set({ isProcessing: false });
    }
  },

  reset: () => {
    set({ vault: null, transactions: [], status: 'idle', isProcessing: false });
  },
}));
