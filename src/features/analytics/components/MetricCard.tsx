'use client';

import { Info } from 'lucide-react';
import { useId } from 'react';
import type { MetricTone } from '../format';

const TONE_CLASS: Record<MetricTone, string> = {
  positive: 'text-green-500',
  negative: 'text-red-500',
  neutral: 'text-white',
};

interface MetricCardProps {
  title: string;
  value: string;
  tone?: MetricTone;
  /** Plain-language explanation, shown as the tooltip of the info button and as the card's description. */
  explanation: string;
}

/**
 * One metric: `role="group"` named by its title and described by its explanation. The info button shows the
 * explanation as a `role="tooltip"` on hover and keyboard focus (and on tap, which focuses it).
 */
export function MetricCard({ title, value, tone = 'neutral', explanation }: MetricCardProps) {
  const titleId = useId();
  const tooltipId = useId();
  return (
    <div
      role="group"
      aria-labelledby={titleId}
      aria-describedby={tooltipId}
      className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-4 flex flex-col justify-between min-h-28 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div id={titleId} className="text-sm text-[#a1a1aa] font-medium">
          {title}
        </div>
        <div className="relative group">
          <button
            type="button"
            aria-label={`What is ${title.toLowerCase()}?`}
            aria-describedby={tooltipId}
            className="text-[#71717a] hover:text-white focus-visible:text-white rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
          >
            <Info className="w-4 h-4" aria-hidden="true" />
          </button>
          <span
            id={tooltipId}
            role="tooltip"
            className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity absolute right-0 top-6 z-30 w-60 max-w-[calc(100vw-3rem)] rounded-lg border border-[#27272a] bg-[#111111] p-3 text-xs leading-relaxed text-[#d4d4d8] shadow-xl"
          >
            {explanation}
          </span>
        </div>
      </div>
      <div className={`mt-3 text-xl sm:text-2xl font-bold break-words ${TONE_CLASS[tone]}`}>{value}</div>
    </div>
  );
}
