'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { BookOpen, GraduationCap, ChevronRight, Tag } from 'lucide-react';
import { listArticles } from '../api/learn';
import type { ArticleSummary } from '../types';
import { AskBox } from './AskBox';

export function Learn() {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;

    listArticles()
      .then((data) => {
        if (!cancelled) {
          setArticles(data.items);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load articles';
          setError(message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const a of articles) {
      for (const t of a.tags || []) {
        tags.add(t);
      }
    }
    return ['all', ...Array.from(tags).sort()];
  }, [articles]);

  const filteredArticles = useMemo(() => {
    if (selectedTag === 'all') return articles;
    return articles.filter((a) => (a.tags || []).includes(selectedTag));
  }, [articles, selectedTag]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <GraduationCap className="w-7 h-7 text-white" />
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Learn</h1>
        </div>
        <p className="text-zinc-400 text-sm max-w-2xl">
          Core trading concepts, realistic market friction, risk metrics and portfolio discipline, designed for beginners.
        </p>
      </div>

      {/* Ask Box */}
      <AskBox />

      {/* Articles Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-white" />
            <h2 className="text-xl font-bold text-white">Articles</h2>
            <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full font-medium">
              {filteredArticles.length}
            </span>
          </div>

          {/* Tag Filter */}
          {allTags.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap" role="toolbar" aria-label="Filter by tag">
              {allTags.map((tag) => {
                const isActive = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    aria-pressed={isActive}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-white text-black'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    {tag === 'all' ? 'All topics' : tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {loading && (
          <div className="grid md:grid-cols-2 gap-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-36 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
                <div className="h-5 w-3/4 bg-zinc-800 rounded" />
                <div className="h-4 w-full bg-zinc-800/60 rounded" />
                <div className="h-4 w-1/2 bg-zinc-800/40 rounded" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div role="alert" className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-center text-sm text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && filteredArticles.length === 0 && (
          <div className="text-center py-12 text-zinc-500 text-sm">
            No articles found for tag &ldquo;{selectedTag}&rdquo;.
          </div>
        )}

        {!loading && !error && filteredArticles.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/learn/${article.slug}`}
                className="group bg-[#0d0d0d] hover:bg-[#141414] border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {article.title}
                    </h3>
                    <ChevronRight size={18} className="text-zinc-600 group-hover:text-zinc-400 shrink-0 mt-0.5 transition-colors" />
                  </div>
                  <p className="text-zinc-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                    {article.summary}
                  </p>
                </div>

                {article.tags && article.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-4 flex-wrap">
                    <Tag size={11} className="text-zinc-500" aria-hidden="true" />
                    {article.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
