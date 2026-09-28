'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);
  return <div className="h-screen w-full bg-black flex items-center justify-center text-white">Redirecting...</div>;
}
