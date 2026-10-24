import type { Metadata } from 'next';
import { Login } from '@/features/auth/components/Login';

export const metadata: Metadata = {
  title: 'Sign in',
};

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  return <Login next={Array.isArray(next) ? next[0] : next} />;
}
