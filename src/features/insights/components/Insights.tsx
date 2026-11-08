'use client';

import { Activity, Brain, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { AiDisclaimer } from '@/features/ai/components/AiDisclaimer';
import { aiErrorMessage } from '@/features/ai/messages';
import { orderHref } from '@/lib/routes';
import { generateInsightsReview, getInsights } from '../api/insights';
import type { DetectorResult, Insights as InsightsData, InsightsReview } from '../types';

// CookieBanner and ToastContainer are fixed to the bottom of the viewport: the bottom padding
// lets detector cards and the weekly review section scroll clear of them.
const WRAPPER_CLASS = 'max-w-5xl mx-auto p-4 md:p-6 pb-48 md:pb-48 space-y-8';

type LoadState =
  | { attempt: number; ok: true; data: InsightsData }
  | { attempt: number; ok: false };

function DetectorCard({ detector }: { detector: DetectorResult }) {
  const headingId = useId();
  const badgeClass = detector.triggered
    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40';

  return (
    <section
      aria-labelledby={headingId}
      data-detector-id={detector.id}
      className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-5 flex flex-col justify-between gap-4"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h2 id={headingId} className="text-base font-semibold text-white">
            {detector.title}
          </h2>
          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full shrink-0 ${badgeClass}`}>
            {detector.triggered ? 'Triggered' : 'OK'}
          </span>
        </div>
        <p className="text-sm text-[#a1a1aa] leading-relaxed">{detector.explanation}</p>
      </div>

      {detector.evidence.order_ids.length > 0 && (
        <div className="pt-3 border-t border-[#27272a] flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#71717a]">Cited orders:</span>
          {detector.evidence.order_ids.map((orderId) => (
            <Link
              key={orderId}
              href={orderHref(orderId)}
              className="px-2 py-0.5 rounded bg-[#111111] border border-[#27272a] text-white hover:border-[#a1a1aa] transition-colors"
            >
              Order #{orderId}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

/** Behavioral insights and AI weekly review at `/insights` (story NW-17). */
export function Insights() {
  const reviewHeadingId = useId();
  const [attempt, setAttempt] = useState(0);
  const [loadState, setLoadState] = useState<LoadState | null>(null);
  const [review, setReview] = useState<InsightsReview | null>(null);
  const [generatingReview, setGeneratingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getInsights(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setLoadState({ attempt, ok: true, data });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoadState({ attempt, ok: false });
        }
      });
    return () => {
      controller.abort();
    };
  }, [attempt]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  function retry() {
    setAttempt((a) => a + 1);
  }

  function handleGenerateReview() {
    if (generatingReview) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setGeneratingReview(true);
    setReviewError(null);

    generateInsightsReview(controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) {
          setReview(res);
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setReviewError(aiErrorMessage(err));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setGeneratingReview(false);
        }
      });
  }

  const current = loadState?.attempt === attempt ? loadState : null;

  const header = (
    <div className="flex items-center gap-3">
      <Brain className="text-white" aria-hidden="true" />
      <h1 className="text-2xl font-bold text-white">Behavioral insights</h1>
    </div>
  );

  if (!current) {
    return (
      <div className={WRAPPER_CLASS}>
        {header}
        <div className="text-[#a1a1aa] flex flex-col items-center py-16" role="status">
          <Activity className="w-8 h-8 animate-spin mb-4" aria-hidden="true" />
          <p>Loading insights…</p>
        </div>
      </div>
    );
  }

  if (!current.ok) {
    return (
      <div className={WRAPPER_CLASS}>
        {header}
        <div
          role="alert"
          className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-6 flex flex-col items-start gap-4"
        >
          <p className="text-white">Could not load your behavioral insights.</p>
          <button
            type="button"
            onClick={retry}
            className="px-4 py-2 rounded-lg border border-[#27272a] text-white hover:bg-[#111111] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={WRAPPER_CLASS}>
      {header}

      <div className="grid gap-4 md:grid-cols-2">
        {current.data.detectors.map((detector) => (
          <DetectorCard key={detector.id} detector={detector} />
        ))}
      </div>

      <section
        aria-labelledby={reviewHeadingId}
        className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-4 md:p-6 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            <h2 id={reviewHeadingId} className="text-lg font-semibold text-white">
              Weekly AI review
            </h2>
          </div>

          <button
            type="button"
            onClick={handleGenerateReview}
            disabled={generatingReview}
            aria-busy={generatingReview}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[#111111] hover:bg-zinc-800 text-white border border-[#27272a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingReview ? 'Generating…' : 'Generate weekly review'}
          </button>
        </div>

        {reviewError && (
          <p role="alert" className="text-sm text-red-500">
            {reviewError}
          </p>
        )}

        {review && (
          <div className="space-y-4 pt-2 border-t border-[#27272a]">
            <h3 className="text-base font-semibold text-white">{review.headline}</h3>

            {review.observations.length > 0 && (
              <ul className="space-y-3">
                {review.observations.map((obs, idx) => (
                  <li
                    key={`${obs.detector_id}-${idx}`}
                    className="bg-[#111111] border border-[#27272a] rounded-lg p-3 space-y-2"
                  >
                    <p className="text-sm text-zinc-200 leading-relaxed">{obs.narrative}</p>
                    {obs.order_ids.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-[#71717a]">Cited orders:</span>
                        {obs.order_ids.map((orderId) => (
                          <Link
                            key={orderId}
                            href={orderHref(orderId)}
                            className="px-2 py-0.5 rounded bg-[#0a0a0a] border border-[#27272a] text-emerald-400 hover:underline"
                          >
                            Order #{orderId}
                          </Link>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="bg-[#111111] border border-[#27272a] rounded-lg p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] mb-1">Habit to try</p>
              <p className="text-sm text-zinc-200">{review.habit_to_try}</p>
            </div>

            <div className="pt-1">
              <AiDisclaimer />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
