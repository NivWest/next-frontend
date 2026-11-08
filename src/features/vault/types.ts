// Vault types (story NW-11). Generated from backend api/openapi.yaml (src/lib/api/schema.d.ts, `npm run api:gen`).
import type { ErrorCode, Schemas } from '@/lib/api';

export type Vault = Schemas['Vault'];
export type VaultTransferRequest = Schemas['VaultTransferRequest'];
export type VaultTransaction = Schemas['VaultTransaction'];
export type VaultTransactionListResponse = Schemas['VaultTransactionListResponse'];

export const VAULT_ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'INSUFFICIENT_FUNDS',
  'INSUFFICIENT_VAULT_BALANCE',
] as const satisfies readonly ErrorCode[];

export type VaultErrorCode = (typeof VAULT_ERROR_CODES)[number];
