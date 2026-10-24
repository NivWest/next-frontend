import type { Metadata } from 'next';
import { StockDetails } from '@/features/screener/components/StockDetails';

export const metadata: Metadata = {
  title: 'Instrument',
};

interface InstrumentPageProps {
  params: Promise<{ orderbookId: string }>;
}

export default async function InstrumentPage({ params }: InstrumentPageProps) {
  const { orderbookId } = await params;
  return <StockDetails orderBookId={orderbookId} />;
}
