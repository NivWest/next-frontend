import { ApiRequestError } from '@/lib/api';
import type { AIErrorCode } from './types';

const MESSAGES: Record<AIErrorCode, string> = {
  UNAUTHENTICATED: 'Sign in to use AI features.',
  INSTRUMENT_NOT_FOUND: 'This instrument does not exist.',
  MARKET_DATA_UNAVAILABLE: 'Market data is unavailable right now. Please try again later.',
  AI_BUDGET_EXCEEDED: 'You have used your AI allowance for today. It resets at midnight UTC.',
  AI_REFUSED: 'The AI declined to write a brief for this instrument.',
  AI_UNAVAILABLE: 'The AI service is unavailable right now. Please try again later.',
};

const FALLBACK = 'Could not generate the brief. Please try again.';

function isAIErrorCode(code: string | null): code is AIErrorCode {
  return code !== null && Object.prototype.hasOwnProperty.call(MESSAGES, code);
}

/** Plain-language text for a failed AI request, chosen by the error body's `code`. */
export function aiErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError && isAIErrorCode(error.code)) return MESSAGES[error.code];
  return FALLBACK;
}
