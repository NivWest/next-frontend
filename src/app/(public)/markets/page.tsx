import type { Metadata } from 'next';
import { MarketSearch } from '@/features/markets/components/MarketSearch';

export const metadata: Metadata = {
  title: 'Markets',
};

interface MarketsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MarketsPage({ searchParams }: MarketsPageProps) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q) ?? '';
  // Re-keying applies a new ?q= (e.g. from the sidebar search) to the search input.
  return <MarketSearch key={query} initialQuery={query} />;
}
