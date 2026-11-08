// Behavioral insights and AI weekly review DTOs (story NW-17), generated from backend api/openapi.yaml
// (src/lib/api/schema.d.ts, `npm run api:gen`). Don't redefine them elsewhere.
import type { Schemas } from '@/lib/api';

/** Body of GET /api/v1/insights: all five behavioral detectors evaluated over the signed-in user's history. */
export type Insights = Schemas['Insights'];

/** One detector result inside `Insights.detectors`. */
export type DetectorResult = Schemas['DetectorResult'];

/** Identifier of a behavioral detector. */
export type DetectorID = Schemas['DetectorID'];

/** Severity level of a detector finding (`info` | `warning` | `high`). */
export type DetectorSeverity = DetectorResult['severity'];

/** Cited order IDs and numeric metrics backing a detector result. */
export type DetectorEvidence = Schemas['DetectorEvidence'];

/** Body of POST /api/v1/ai/insights/review (201) and each item in GET /api/v1/ai/insights/reviews. */
export type InsightsReview = Schemas['InsightsReview'];

/** One grounded observation inside `InsightsReview.observations`. */
export type ReviewObservation = Schemas['ReviewObservation'];

/** Body of GET /api/v1/ai/insights/reviews: `{ items: InsightsReview[] }`. */
export type InsightsReviewListResponse = Schemas['InsightsReviewListResponse'];
