import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import * as learnApi from '../../api/learn';
import type { Article } from '../../types';
import { ArticleDetail } from '../ArticleDetail';

const mockArticle: Article = {
  slug: 'slippage',
  title: 'Slippage',
  summary: 'Why market orders often execute at prices different from the quoted price.',
  tags: ['execution', 'mechanics'],
  body_markdown: `## What Is Slippage?
Slippage is the difference between expected and executed price.

### Why Does It Happen?
- Market volatility
- Low liquidity in the order book`,
  updated_at: '2026-11-08T12:00:00Z',
};

let getArticleMock: Mock<(slug: string) => Promise<Article>>;

beforeEach(() => {
  getArticleMock = vi.fn();
  vi.spyOn(learnApi, 'getArticle').mockImplementation(getArticleMock);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ArticleDetail component', () => {
  it('loads and renders article details and markdown content', async () => {
    getArticleMock.mockResolvedValue(mockArticle);

    render(<ArticleDetail slug="slippage" />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Slippage' })).toBeInTheDocument();
    });

    expect(getArticleMock).toHaveBeenCalledWith('slippage');

    expect(
      screen.getByText('Why market orders often execute at prices different from the quoted price.'),
    ).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 2, name: 'What Is Slippage?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Why Does It Happen?' })).toBeInTheDocument();
    expect(screen.getByText(/Market volatility/)).toBeInTheDocument();

    const backLink = screen.getByRole('link', { name: 'Back to Learn' });
    expect(backLink).toHaveAttribute('href', '/learn');
  });

  it('renders 404 not found when article does not exist', async () => {
    getArticleMock.mockRejectedValue(new Error('Article not found'));

    render(<ArticleDetail slug="non-existent" />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Article Not Found' })).toBeInTheDocument();
    });

    const backLink = screen.getByRole('link', { name: 'Back to Learn' });
    expect(backLink).toHaveAttribute('href', '/learn');
  });
});
