'use client';

import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useId, useState } from 'react';
import { instrumentHref, loginHref } from '@/lib/routes';
import { useUIStore } from '@/store/useUIStore';
import { getInstrumentBrief } from '../api/ai';
import { aiErrorMessage } from '../messages';
import type { InstrumentBrief } from '../types';
import { AiDisclaimer } from './AiDisclaimer';

interface AiBriefCardProps {
  orderbookId: string;
}

export const GENERATE_LABEL = 'Generate brief';
export const GENERATING_LABEL = 'Generating…';

type BriefState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; brief: InstrumentBrief }
  | { status: 'error'; message: string };

function formatGeneratedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';
}

/**
 * "AI brief" card on the instrument page (story NW-14): on demand, a plain-language brief of the instrument's
 * numbers and risks from GET /ai/instruments/{id}/brief, always labelled with `AiDisclaimer`.
 * It sits near the top of the page, clear of the fixed cookie banner and toasts at the bottom.
 */
export function AiBriefCard({ orderbookId }: AiBriefCardProps) {
  const { isAuthenticated } = useUIStore();
  // State is tagged with the id it belongs to, so navigating to another instrument starts idle again.
  const [state, setState] = useState<{ id: string; value: BriefState }>({ id: orderbookId, value: { status: 'idle' } });
  const current: BriefState = state.id === orderbookId ? state.value : { status: 'idle' };
  const headingId = useId();

  async function generate(): Promise<void> {
    const id = orderbookId;
    setState({ id, value: { status: 'loading' } });
    try {
      const brief = await getInstrumentBrief(id);
      setState((prev) => (prev.id === id ? { id, value: { status: 'ready', brief } } : prev));
    } catch (e: unknown) {
      setState((prev) => (prev.id === id ? { id, value: { status: 'error', message: aiErrorMessage(e) } } : prev));
    }
  }

  const loading = current.status === 'loading';

  return (
    <section aria-labelledby={headingId} className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Sparkles className="text-violet-400" size={18} aria-hidden="true" />
        <h2 id={headingId} className="text-lg font-semibold text-white">
          AI brief
        </h2>
        {current.status !== 'ready' && (
          <div className="ml-auto">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => void generate()}
                disabled={loading}
                aria-busy={loading}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-60 disabled:cursor-wait transition-colors"
              >
                {loading ? GENERATING_LABEL : GENERATE_LABEL}
              </button>
            ) : (
              <Link
                href={loginHref(instrumentHref(orderbookId))}
                className="text-sm font-medium text-violet-400 hover:text-violet-300"
              >
                Sign in for an AI brief
              </Link>
            )}
          </div>
        )}
      </div>

      {current.status === 'idle' && (
        <p className="mt-2 text-sm text-[#a1a1aa]">A plain-language explanation of this instrument&apos;s numbers and risks.</p>
      )}

      {current.status === 'error' && (
        <p role="alert" className="mt-3 text-sm text-red-500">
          {current.message}
        </p>
      )}

      {current.status === 'ready' && <BriefBody brief={current.brief} />}
    </section>
  );
}

function BriefBody({ brief }: { brief: InstrumentBrief }) {
  const { summary, what_the_numbers_say, risks, beginner_takeaway } = brief.brief;
  return (
    <div className="mt-3 space-y-4 text-sm">
      <p className="text-white leading-relaxed">{summary}</p>

      {what_the_numbers_say.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#71717a] mb-2">What the numbers say</h3>
          <dl className="space-y-2">
            {what_the_numbers_say.map((m) => (
              <div key={m.metric} className="bg-[#111111] border border-[#27272a] rounded-lg p-3">
                <dt className="flex justify-between gap-3 text-[#a1a1aa]">
                  <span>{m.metric}</span>
                  <span className="text-white font-medium">{m.value}</span>
                </dt>
                <dd className="mt-1 text-[#a1a1aa]">{m.explanation}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {risks.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#71717a] mb-2">Risks</h3>
          <ul className="list-disc pl-5 space-y-1 text-[#a1a1aa]">
            {risks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[#d4d4d8]">
        <span className="font-semibold text-white">Beginner takeaway: </span>
        {beginner_takeaway}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#27272a] pt-3">
        <AiDisclaimer />
        <p className="text-xs text-[#71717a]">
          Generated <time dateTime={brief.generated_at}>{formatGeneratedAt(brief.generated_at)}</time>
        </p>
      </div>
    </div>
  );
}
