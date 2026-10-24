import type { Metadata } from 'next';
import { Orders } from '@/features/orders/components/Orders';

export const metadata: Metadata = {
  title: 'Orders',
};

export default function OrdersPage() {
  return <Orders />;
}
