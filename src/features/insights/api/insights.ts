import { apiGet, apiPost } from '@/lib/api';
import type { Insights, InsightsReview, InsightsReviewListResponse } from '../types';

// Client for the behavioral insights and AI weekly review endpoints (story NW-17),
// typed by the generated contract (src/lib/api.ts, story NW-07).

/** GET /insights — evaluate all five behavioral detectors for the signed-in user. */
export function getInsights(signal?: AbortSignal): Promise<Insights> {
  return apiGet('/insights', { signal });
}

/** POST /ai/insights/review — generate and store a new AI weekly trading review. */
export function generateInsightsReview(signal?: AbortSignal): Promise<InsightsReview> {
  return apiPost('/ai/insights/review', { signal });
}

/** GET /ai/insights/reviews — list past AI weekly reviews for the signed-in user, newest first. */
export function listInsightsReviews(signal?: AbortSignal): Promise<InsightsReviewListResponse> {
  return apiGet('/ai/insights/reviews', { signal });
}
