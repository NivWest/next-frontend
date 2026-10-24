import type { Metadata } from 'next';
import { Help } from '@/features/help/components/Help';

export const metadata: Metadata = {
  title: 'Help',
};

export default function HelpPage() {
  return <Help />;
}
