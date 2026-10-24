import type { Metadata } from 'next';
import { Vault } from '@/features/vault/components/Vault';

export const metadata: Metadata = {
  title: 'The Vault',
};

export default function VaultPage() {
  return <Vault />;
}
