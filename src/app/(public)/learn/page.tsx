import type { Metadata } from 'next';
import { Learn } from '@/features/learn/components/Learn';

export const metadata: Metadata = {
  title: 'Learn',
  description: 'Core trading concepts, market mechanics and portfolio discipline for beginners.',
};

export default function LearnPage() {
  return <Learn />;
}
