import { describe, expect, it } from 'vitest';
import { ApiRequestError } from '@/lib/api';
import { aiErrorMessage } from '../messages';
import type { AIErrorCode } from '../types';

describe('aiErrorMessage', () => {
  const cases: Array<[AIErrorCode, string]> = [
    ['UNAUTHENTICATED', 'Sign in to use AI features.'],
    ['INSTRUMENT_NOT_FOUND', 'This instrument does not exist.'],
    ['MARKET_DATA_UNAVAILABLE', 'Market data is unavailable right now. Please try again later.'],
    ['AI_BUDGET_EXCEEDED', 'You have used your AI allowance for today. It resets at midnight UTC.'],
    ['AI_REFUSED', 'The AI declined to write a brief for this instrument.'],
    ['AI_UNAVAILABLE', 'The AI service is unavailable right now. Please try again later.'],
  ];

  for (const [code, expected] of cases) {
    it(`maps code "${code}" to user-friendly message`, () => {
      const err = new ApiRequestError('failed', 400, code);
      expect(aiErrorMessage(err)).toBe(expected);
    });
  }

  it('maps unknown code to fallback message', () => {
    const err = new ApiRequestError('unknown error', 500, 'UNKNOWN_CODE');
    expect(aiErrorMessage(err)).toBe('Could not generate the brief. Please try again.');
  });

  it('maps standard Error or unknown error to fallback message', () => {
    expect(aiErrorMessage(new Error('network error'))).toBe('Could not generate the brief. Please try again.');
    expect(aiErrorMessage(null)).toBe('Could not generate the brief. Please try again.');
  });
});
