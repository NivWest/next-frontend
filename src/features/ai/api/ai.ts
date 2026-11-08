import { apiGet, apiPost } from '@/lib/api';
import type { AIUsage, AskResponse, InstrumentBrief } from '../types';

// Client for the AI endpoints (backend api/openapi.yaml /ai…, story NW-14). Both need a session.
// Errors reject with an `ApiRequestError` (src/lib/api.ts) whose `code` is an `AIErrorCode`.

/** GET /ai/instruments/{orderbook_id}/brief — today's brief, generated on the first request of the UTC day. */
export function getInstrumentBrief(orderbookId: string, signal?: AbortSignal): Promise<InstrumentBrief> {
  return apiGet('/ai/instruments/{orderbook_id}/brief', { path: { orderbook_id: orderbookId }, signal });
}

/** GET /ai/usage — the signed-in user's token budget and usage today. */
export function getAIUsage(): Promise<AIUsage> {
  return apiGet('/ai/usage');
}

/** POST /ai/ask — ask a trading concept question answered with citations (story NW-15). */
export function askKnowledge(question: string): Promise<AskResponse> {
  return apiPost('/ai/ask', { body: { question } });
}
