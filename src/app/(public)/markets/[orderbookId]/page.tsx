import type { Metadata } from 'next';
import { InstrumentPage } from '@/features/markets/components/InstrumentPage';

export const metadata: Metadata = {
  title: 'Instrument',
};

interface InstrumentRouteProps {
  params: Promise<{ orderbookId: string }>;
}

export default async function InstrumentRoute({ params }: InstrumentRouteProps) {
  const { orderbookId } = await params;
  return <InstrumentPage orderbookId={orderbookId} />;
}
