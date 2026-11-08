'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, MessageCircleQuestion, Send } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { loginHref, learnArticleHref } from '@/lib/routes';
import { askKnowledge } from '@/features/ai/api/ai';
import { AiDisclaimer } from '@/features/ai/components/AiDisclaimer';
import type { AskResponse } from '@/features/ai/types';
import { ApiRequestError } from '@/lib/api';

export function AskBox() {
  const isAuthenticated = useUIStore((s) => s.isAuthenticated);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AskResponse | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="bg-[#111111] border border-zinc-800 rounded-xl p-6 text-center shadow-sm">
        <Sparkles className="w-8 h-8 text-violet-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-white mb-1">Ask TradeEdu AI</h3>
        <p className="text-sm text-zinc-400 mb-4 max-w-md mx-auto">
          Sign in to ask questions about trading mechanics and concepts, answered with verifiable citations from our knowledge base.
        </p>
        <Link
          href={loginHref('/learn')}
          className="inline-flex items-center justify-center px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors"
        >
          Sign in to ask
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await askKnowledge(q);
      setResponse(res);
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) {
        if (err.code === 'AI_BUDGET_EXCEEDED') {
          setError('You have used your AI allowance for today. It resets at midnight UTC.');
        } else if (err.code === 'AI_UNAVAILABLE') {
          setError('The AI service is unavailable right now. Please try again later.');
        } else {
          setError(err.message || 'Failed to get answer. Please try again.');
        }
      } else {
        const message = err instanceof Error ? err.message : 'Failed to get answer. Please try again.';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111111] border border-zinc-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircleQuestion className="w-5 h-5 text-violet-400" />
        <h3 className="text-lg font-semibold text-white">Ask TradeEdu</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about trading concepts, e.g. What is slippage?"
            aria-label="Ask a question"
            disabled={loading}
            maxLength={500}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 pr-24 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            aria-busy={loading}
            className="absolute right-2 top-2 bottom-2 px-4 bg-white text-black text-sm font-medium rounded-md hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1.5"
          >
            {loading ? (
              <span>Asking…</span>
            ) : (
              <>
                <span>Ask</span>
                <Send size={14} aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div role="alert" className="mt-4 p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-sm text-red-300">
          {error}
        </div>
      )}

      {response && (
        <div className="mt-6 p-5 bg-zinc-900/70 border border-zinc-800 rounded-lg space-y-4">
          <div>
            <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
              {response.answer}
              {response.citations.map((c, i) => (
                <Link
                  key={`inline-${c.chunk_id || i}`}
                  href={learnArticleHref(c.article_slug)}
                  className="inline-block ml-1 text-blue-400 hover:text-blue-300 font-semibold"
                  aria-label={`Citation [${i + 1}]: ${c.article_title}`}
                >
                  [{i + 1}]
                </Link>
              ))}
            </p>
          </div>

          {response.citations.length > 0 && (
            <div className="pt-3 border-t border-zinc-800">
              <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Sources</h4>
              <ul className="space-y-1.5 text-xs text-zinc-400">
                {response.citations.map((c, i) => (
                  <li key={`source-${c.chunk_id || i}`} className="flex items-start gap-1.5">
                    <Link
                      href={learnArticleHref(c.article_slug)}
                      className="text-blue-400 hover:underline font-medium shrink-0"
                    >
                      [{i + 1}]
                    </Link>
                    <Link
                      href={learnArticleHref(c.article_slug)}
                      className="text-zinc-300 hover:text-white hover:underline truncate"
                    >
                      {c.article_title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
            <AiDisclaimer />
            {response.model && <span className="text-[10px] text-zinc-500 uppercase">{response.model}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
