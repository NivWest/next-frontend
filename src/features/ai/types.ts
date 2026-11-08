// AI DTOs (story NW-14), generated from backend api/openapi.yaml (src/lib/api/schema.d.ts, `npm run api:gen`):
// InstrumentBrief, Brief, BriefMetric, AIUsage, AIFeatureUsage, AIFeature. Don't redefine them elsewhere.
import type { ErrorCode, Schemas } from '@/lib/api';

/** Body of GET /ai/instruments/{orderbook_id}/brief: the brief plus model, prompt version and cache flag. */
export type InstrumentBrief = Schemas['InstrumentBrief'];

/** The model's structured answer inside an `InstrumentBrief`. */
export type Brief = Schemas['Brief'];

/** One explained number of a brief. */
export type BriefMetric = Schemas['BriefMetric'];

/** Body of GET /ai/usage: today's (UTC) token budget and usage per feature. */
export type AIUsage = Schemas['AIUsage'];

export type AIFeatureUsage = Schemas['AIFeatureUsage'];

export type AIFeature = Schemas['AIFeature'];

export type AskRequest = Schemas['AskRequest'];
export type AskResponse = Schemas['AskResponse'];
export type Citation = Schemas['Citation'];

/** `code` values of the `{error, code}` bodies the AI endpoints answer with; each must be an `ErrorCode` of the contract. */
export const AI_ERROR_CODES = [
  'UNAUTHENTICATED',
  'INSTRUMENT_NOT_FOUND',
  'MARKET_DATA_UNAVAILABLE',
  'AI_BUDGET_EXCEEDED',
  'AI_REFUSED',
  'AI_UNAVAILABLE',
] as const satisfies readonly ErrorCode[];

export type AIErrorCode = (typeof AI_ERROR_CODES)[number];

/** The label every piece of AI output carries (docs/conventions.md). Matches `InstrumentBrief.disclaimer`. */
export const AI_DISCLAIMER = 'AI-generated · educational, not financial advice' satisfies InstrumentBrief['disclaimer'];
