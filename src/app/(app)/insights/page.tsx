import type { Metadata } from 'next';
import { Insights } from '@/features/insights/components/Insights';

export const metadata: Metadata = {
  title: 'Insights',
};

export default function InsightsPage() {
  return <Insights />;
}
