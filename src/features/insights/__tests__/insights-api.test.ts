import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { generateInsightsReview, getInsights, listInsightsReviews } from '../api/insights';

type FetchMock = Mock<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>;

let fetchMock: FetchMock;

beforeEach(() => {
  fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('insights API', () => {
  it('getInsights calls GET /api/v1/insights', async () => {
    const payload = { generated_at: '2026-10-26T10:00:00Z', detectors: [] };
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(payload), { status: 200 }));

    await expect(getInsights()).resolves.toEqual(payload);
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/v1/insights');
    expect(fetchMock.mock.calls[0][1]?.method).toBeUndefined();
  });

  it('generateInsightsReview calls POST /api/v1/ai/insights/review', async () => {
    const review = {
      id: 1,
      generated_at: '2026-10-26T10:00:00Z',
      headline: 'Weekly review',
      observations: [],
      habit_to_try: 'Add a note',
      disclaimer: 'AI-generated · educational, not financial advice',
    };
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(review), { status: 201 }));

    await expect(generateInsightsReview()).resolves.toEqual(review);
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/v1/ai/insights/review');
    expect(fetchMock.mock.calls[0][1]?.method).toBe('POST');
  });

  it('listInsightsReviews calls GET /api/v1/ai/insights/reviews', async () => {
    const body = { items: [] };
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status: 200 }));

    await expect(listInsightsReviews()).resolves.toEqual(body);
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/v1/ai/insights/reviews');
  });
});
