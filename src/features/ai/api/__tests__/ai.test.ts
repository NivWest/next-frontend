import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { ApiRequestError } from '@/lib/api';
import { getAIUsage, getInstrumentBrief } from '../ai';
import type { AIUsage, InstrumentBrief } from '../../types';

type FetchMock = Mock<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>;

const mockBrief: InstrumentBrief = {
  orderbook_id: 'SIM-FJRD',
  generated_at: '2026-11-08T12:00:00Z',
  model: 'fake',
  prompt_version: 'v1',
  cached: false,
  disclaimer: 'AI-generated · educational, not financial advice',
  brief: {
    summary: 'FAKE: Fjord Robotics (FJRD) trades at 100.00 SEK.',
    what_the_numbers_say: [
      { metric: 'P/E Ratio', value: '18.5', explanation: 'Reasonable valuation.' },
    ],
    risks: ['High competition in robotics'],
    beginner_takeaway: 'Promising growth company.',
  },
};

const mockUsage: AIUsage = {
  date: '2026-11-08',
  budget_tokens: 200000,
  used_tokens: 150,
  remaining_tokens: 199850,
  by_feature: [
    {
      feature: 'instrument_brief',
      calls: 1,
      input_tokens: 100,
      output_tokens: 50,
    },
  ],
};

let fetchMock: FetchMock;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function lastCall(): { url: string; method: string | undefined } {
  const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return { url: String(url), method: init?.method };
}

beforeEach(() => {
  fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AI API client', () => {
  it('getInstrumentBrief GETs /api/v1/ai/instruments/:orderbook_id/brief', async () => {
    fetchMock.mockResolvedValue(json(mockBrief));
    const result = await getInstrumentBrief('SIM-FJRD');
    expect(result).toEqual(mockBrief);
    expect(lastCall()).toEqual({ url: '/api/v1/ai/instruments/SIM-FJRD/brief', method: undefined });
  });

  it('getAIUsage GETs /api/v1/ai/usage', async () => {
    fetchMock.mockResolvedValue(json(mockUsage));
    const result = await getAIUsage();
    expect(result).toEqual(mockUsage);
    expect(lastCall()).toEqual({ url: '/api/v1/ai/usage', method: undefined });
  });

  it('rejects with ApiRequestError on failure', async () => {
    fetchMock.mockResolvedValue(
      json({ error: 'instrument not found', code: 'INSTRUMENT_NOT_FOUND' }, 404),
    );
    const error = await getInstrumentBrief('SIM-NOPE').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({ status: 404, code: 'INSTRUMENT_NOT_FOUND' });
  });
});
