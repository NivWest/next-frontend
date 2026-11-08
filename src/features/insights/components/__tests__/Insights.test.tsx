import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '@/lib/api';
import type { Insights as InsightsData, InsightsReview } from '../../types';
import { Insights } from '../Insights';

const mocks = vi.hoisted(() => ({
  getInsights: vi.fn<() => Promise<InsightsData>>(),
  generateInsightsReview: vi.fn<() => Promise<InsightsReview>>(),
}));

vi.mock('../../api/insights', () => ({
  getInsights: () => mocks.getInsights(),
  generateInsightsReview: () => mocks.generateInsightsReview(),
}));

function sampleInsights(): InsightsData {
  return {
    generated_at: '2026-10-26T10:00:00Z',
    detectors: [
      {
        id: 'concentration',
        title: 'Concentration risk',
        triggered: true,
        severity: 'warning',
        evidence: { order_ids: [42], metrics: { max_weight_pct: 50.1 } },
        explanation: 'SIM-SOLV represents 50.1% of your total equity.',
      },
      {
        id: 'revenge_trading',
        title: 'Revenge trading',
        triggered: false,
        severity: 'info',
        evidence: { order_ids: [], metrics: {} },
        explanation: 'No rapid re-entry after a loss-making sell detected.',
      },
      {
        id: 'overtrading',
        title: 'Overtrading',
        triggered: false,
        severity: 'info',
        evidence: { order_ids: [], metrics: { order_count_7d: 1 } },
        explanation: '1 order placed in the last 7 days.',
      },
      {
        id: 'disposition_effect',
        title: 'Disposition effect',
        triggered: false,
        severity: 'info',
        evidence: { order_ids: [], metrics: {} },
        explanation: 'Not enough winners and losers to compare holding times yet.',
      },
      {
        id: 'no_thesis',
        title: 'Trading without a thesis',
        triggered: false,
        severity: 'info',
        evidence: { order_ids: [], metrics: {} },
        explanation: 'Fewer than 3 filled orders so far.',
      },
    ],
  };
}

function sampleReview(): InsightsReview {
  return {
    id: 7,
    generated_at: '2026-10-26T10:01:00Z',
    headline: 'FAKE: 1 behavioral pattern triggered across 1 order.',
    observations: [
      {
        detector_id: 'concentration',
        narrative: 'Concentration risk triggered: SIM-SOLV represents 50.1% of your total equity.',
        order_ids: [42],
      },
    ],
    habit_to_try: 'Before submitting your next trade, write a one-sentence thesis note.',
    disclaimer: 'AI-generated · educational, not financial advice',
  };
}

describe('Insights', () => {
  beforeEach(() => {
    mocks.getInsights.mockReset().mockResolvedValue(sampleInsights());
    mocks.generateInsightsReview.mockReset().mockResolvedValue(sampleReview());
  });

  it('renders one card per detector with Triggered or OK badges and cited order links', async () => {
    render(<Insights />);

    expect(screen.getByRole('heading', { level: 1, name: 'Behavioral insights' })).toBeInTheDocument();

    const concentrationCard = await screen.findByRole('region', { name: 'Concentration risk' });
    expect(within(concentrationCard).getByText('Triggered')).toBeInTheDocument();
    expect(within(concentrationCard).getByText(/SIM-SOLV represents 50.1%/)).toBeInTheDocument();
    expect(within(concentrationCard).getByRole('link', { name: 'Order #42' })).toHaveAttribute(
      'href',
      '/orders#order-42',
    );

    const revengeCard = screen.getByRole('region', { name: 'Revenge trading' });
    expect(within(revengeCard).getByText('OK')).toBeInTheDocument();

    expect(screen.getByRole('region', { name: 'Overtrading' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Disposition effect' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Trading without a thesis' })).toBeInTheDocument();
  });

  it('generates the weekly AI review with headline, observations, cited order links and disclaimer', async () => {
    render(<Insights />);
    await screen.findByRole('region', { name: 'Concentration risk' });

    const button = screen.getByRole('button', { name: 'Generate weekly review' });
    fireEvent.click(button);

    await waitFor(() => expect(mocks.generateInsightsReview).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('FAKE: 1 behavioral pattern triggered across 1 order.')).toBeInTheDocument();
    expect(
      screen.getByText('Concentration risk triggered: SIM-SOLV represents 50.1% of your total equity.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Before submitting your next trade, write a one-sentence thesis note.')).toBeInTheDocument();
    expect(screen.getByText('AI-generated · educational, not financial advice')).toBeInTheDocument();

    const reviewRegion = screen.getByRole('region', { name: 'Weekly AI review' });
    expect(within(reviewRegion).getByRole('link', { name: 'Order #42' })).toHaveAttribute('href', '/orders#order-42');
  });

  it('shows an error alert when generating the review fails', async () => {
    mocks.generateInsightsReview.mockRejectedValueOnce(
      new ApiRequestError('budget exceeded', 429, 'AI_BUDGET_EXCEEDED'),
    );
    render(<Insights />);
    await screen.findByRole('region', { name: 'Concentration risk' });

    fireEvent.click(screen.getByRole('button', { name: 'Generate weekly review' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You have used your AI allowance for today. It resets at midnight UTC.',
    );
  });

  it('shows Retry when loading insights fails', async () => {
    mocks.getInsights
      .mockRejectedValueOnce(new ApiRequestError('boom', 500, null))
      .mockResolvedValueOnce(sampleInsights());
    render(<Insights />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Could not load your behavioral insights.');
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('region', { name: 'Concentration risk' })).toBeInTheDocument();
    expect(mocks.getInsights).toHaveBeenCalledTimes(2);
  });
});
