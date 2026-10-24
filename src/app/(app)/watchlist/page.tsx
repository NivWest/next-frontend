import type { Metadata } from 'next';
import { Watchlist } from '@/features/watchlist/components/Watchlist';

export const metadata: Metadata = {
  title: 'Watchlist',
};

export default function WatchlistPage() {
  return <Watchlist />;
}
