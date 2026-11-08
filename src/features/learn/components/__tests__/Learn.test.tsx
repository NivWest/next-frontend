import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import * as learnApi from '../../api/learn';
import type { ArticleListResponse } from '../../types';
import { Learn } from '../Learn';

const mockArticles: ArticleListResponse = {
  items: [
    {
      slug: 'bid-ask-spread',
      title: 'Bid-Ask Spread',
      summary: 'Understanding the difference between the highest buy price and the lowest sell price.',
      tags: ['liquidity', 'mechanics'],
    },
    {
      slug: 'slippage',
      title: 'Slippage',
      summary: 'Why market orders often execute at prices different from the quoted price.',
      tags: ['execution', 'mechanics'],
    },
    {
      slug: 'sharpe-ratio',
      title: 'Sharpe Ratio',
      summary: 'Measuring risk-adjusted return relative to a risk-free benchmark.',
      tags: ['risk', 'portfolio'],
    },
  ],
};

let listArticlesMock: Mock<() => Promise<ArticleListResponse>>;

beforeEach(() => {
  listArticlesMock = vi.fn();
  vi.spyOn(learnApi, 'listArticles').mockImplementation(listArticlesMock);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Learn component', () => {
  it('renders heading and loads articles', async () => {
    listArticlesMock.mockResolvedValue(mockArticles);

    render(<Learn />);

    expect(screen.getByRole('heading', { level: 1, name: 'Learn' })).toBeInTheDocument();
    expect(screen.getByText(/Core trading concepts/)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Bid-Ask Spread')).toBeInTheDocument();
      expect(screen.getByText('Slippage')).toBeInTheDocument();
      expect(screen.getByText('Sharpe Ratio')).toBeInTheDocument();
    });

    expect(listArticlesMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: /Bid-Ask Spread/ })).toHaveAttribute('href', '/learn/bid-ask-spread');
    expect(screen.getByRole('link', { name: /Slippage/ })).toHaveAttribute('href', '/learn/slippage');
  });

  it('filters articles when tag button is clicked', async () => {
    listArticlesMock.mockResolvedValue(mockArticles);

    render(<Learn />);

    await waitFor(() => {
      expect(screen.getByText('Bid-Ask Spread')).toBeInTheDocument();
    });

    // Tag buttons exist
    const riskTag = screen.getByRole('button', { name: 'risk' });
    expect(riskTag).toBeInTheDocument();

    fireEvent.click(riskTag);

    expect(screen.getByText('Sharpe Ratio')).toBeInTheDocument();
    expect(screen.queryByText('Bid-Ask Spread')).not.toBeInTheDocument();
    expect(screen.queryByText('Slippage')).not.toBeInTheDocument();

    // Click "All topics" to clear filter
    const allButton = screen.getByRole('button', { name: 'All topics' });
    fireEvent.click(allButton);

    expect(screen.getByText('Bid-Ask Spread')).toBeInTheDocument();
    expect(screen.getByText('Slippage')).toBeInTheDocument();
    expect(screen.getByText('Sharpe Ratio')).toBeInTheDocument();
  });

  it('displays error message when article list fetch fails', async () => {
    listArticlesMock.mockRejectedValue(new Error('Network error loading articles'));

    render(<Learn />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Network error loading articles');
  });
});
