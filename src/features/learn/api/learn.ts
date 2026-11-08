import { apiGet } from '@/lib/api';
import type { Article, ArticleListResponse, ArticleSearchResponse } from '../types';

/** GET /learn/articles — list all knowledge base articles with summaries and tags. */
export function listArticles(): Promise<ArticleListResponse> {
  return apiGet('/learn/articles');
}

/** GET /learn/articles/{slug} — full article markdown and metadata. */
export function getArticle(slug: string): Promise<Article> {
  return apiGet('/learn/articles/{slug}', { path: { slug } });
}

/** GET /learn/search?q= — full-text search across article chunks. */
export function searchArticles(q: string): Promise<ArticleSearchResponse> {
  return apiGet('/learn/search', { query: { q } });
}
