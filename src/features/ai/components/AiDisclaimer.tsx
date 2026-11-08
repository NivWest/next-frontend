import { Sparkles } from 'lucide-react';
import { AI_DISCLAIMER } from '../types';

interface AiDisclaimerProps {
  className?: string;
}

/** The label every piece of AI output carries (docs/conventions.md). Shared by every AI feature. */
export function AiDisclaimer({ className = '' }: AiDisclaimerProps) {
  return (
    <p className={`inline-flex items-center gap-1.5 text-xs text-[#a1a1aa] ${className}`}>
      <Sparkles size={12} aria-hidden="true" className="text-violet-400" />
      <span>{AI_DISCLAIMER}</span>
    </p>
  );
}
