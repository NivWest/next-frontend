import type { Metadata } from 'next';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Page not found',
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-black px-6 text-center">
      <div
        className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-black font-bold text-xl mb-6 shadow-lg shadow-green-500/20"
        aria-hidden="true"
      >
        T
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
      <p className="text-sm text-[#a1a1aa] mb-8 max-w-sm">
        The page you are looking for does not exist or has moved.
      </p>
      <Link
        href={ROUTES.dashboard}
        className="px-4 py-2 bg-white text-black font-semibold rounded-lg text-sm hover:bg-zinc-200 transition-colors"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
