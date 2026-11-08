// Learn DTOs (story NW-15), generated from backend api/openapi.yaml (src/lib/api/schema.d.ts, `npm run api:gen`):
// ArticleSummary, ArticleListResponse, Article, ArticleSearchResult, ArticleSearchResponse.
import type { ErrorCode, Schemas } from '@/lib/api';

export type ArticleSummary = Schemas['ArticleSummary'];
export type ArticleListResponse = Schemas['ArticleListResponse'];
export type Article = Schemas['Article'];
export type ArticleSearchResult = Schemas['ArticleSearchResult'];
export type ArticleSearchResponse = Schemas['ArticleSearchResponse'];

export const LEARN_ERROR_CODES = [
  'ARTICLE_NOT_FOUND',
  'VALIDATION_ERROR',
] as const satisfies readonly ErrorCode[];

export type LearnErrorCode = (typeof LEARN_ERROR_CODES)[number];
