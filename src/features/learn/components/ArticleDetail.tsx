'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Tag, BookOpen } from 'lucide-react';
import { getArticle } from '../api/learn';
import type { Article } from '../types';
import { MarkdownBody } from './MarkdownBody';

interface ArticleDetailProps {
  slug: string;
}

export function ArticleDetail({ slug }: ArticleDetailProps) {
  const [state, setState] = useState<{
    slug: string;
    loading: boolean;
    error: string | null;
    article: Article | null;
  }>({
    slug,
    loading: true,
    error: null,
    article: null,
  });

  useEffect(() => {
    let cancelled = false;

    getArticle(slug)
      .then((data) => {
        if (!cancelled) {
          setState({ slug, loading: false, error: null, article: data });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Article not found';
          setState({ slug, loading: false, error: message, article: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const current = state.slug === slug ? state : { slug, loading: true, error: null, article: null };
  const { loading, error, article } = current;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-zinc-800 rounded" />
        <div className="h-10 w-3/4 bg-zinc-800 rounded" />
        <div className="h-24 bg-zinc-900 rounded-xl" />
        <div className="space-y-4">
          <div className="h-4 bg-zinc-800 rounded w-full" />
          <div className="h-4 bg-zinc-800 rounded w-5/6" />
          <div className="h-4 bg-zinc-800 rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center py-16">
        <BookOpen className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Article Not Found</h1>
        <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
          The requested article could not be found or has been moved.
        </p>
        <Link
          href="/learn"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Learn
        </Link>
      </div>
    );
  }

  const formattedDate = article.updated_at
    ? new Date(article.updated_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <article className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <Link
          href="/learn"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          <span>Back to Learn</span>
        </Link>

        <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
          {formattedDate && (
            <span className="inline-flex items-center gap-1">
              <Calendar size={13} aria-hidden="true" />
              <span>{formattedDate}</span>
            </span>
          )}
          {article.tags && article.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag size={13} aria-hidden="true" />
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[11px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {article.summary && (
        <div className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl text-zinc-300 text-sm leading-relaxed font-medium">
          {article.summary}
        </div>
      )}

      <div className="pt-2">
        <MarkdownBody content={article.body_markdown} />
      </div>
    </article>
  );
}
