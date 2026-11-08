import type { Metadata } from 'next';
import { ArticleDetail } from '@/features/learn/components/ArticleDetail';

export const metadata: Metadata = {
  title: 'Learn Article',
};

interface LearnArticlePageProps {
  params: Promise<{ slug: string }>;
}

export default async function LearnArticlePage({ params }: LearnArticlePageProps) {
  const { slug } = await params;
  return <ArticleDetail slug={slug} />;
}
