import { apiGet, apiPost } from '@/lib/api';
import type { Vault, VaultTransaction, VaultTransactionListResponse } from '../types';

/** GET /vault — current vault status, balance, APY, interest earned, and idle cash projection. */
export function getVault(): Promise<Vault> {
  return apiGet('/vault');
}

/** POST /vault/deposits — deposit uninvested cash into the vault. */
export function depositVault(amount: number): Promise<VaultTransaction> {
  return apiPost('/vault/deposits', { body: { amount } });
}

/** POST /vault/withdrawals — withdraw funds from the vault back to uninvested cash. */
export function withdrawVault(amount: number): Promise<VaultTransaction> {
  return apiPost('/vault/withdrawals', { body: { amount } });
}

/** GET /vault/transactions — list vault transactions newest first. */
export function listVaultTransactions(): Promise<VaultTransactionListResponse> {
  return apiGet('/vault/transactions');
}
